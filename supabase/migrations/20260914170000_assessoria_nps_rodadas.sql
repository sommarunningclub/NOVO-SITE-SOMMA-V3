-- ─────────────────────────────────────────────────────────────────────────────
-- NPS da Assessoria: rodadas bimestrais geridas pelo admin
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
-- Painel: admin.sommaclub.com.br › NPS Assessoria
--
-- O que muda
-- ──────────
-- A primeira versão supunha UMA rodada ativa (índice único parcial). Com uma
-- rodada a cada dois meses criada pelo painel, o time precisa agendar a
-- próxima enquanto a atual está no ar. A regra passa a ser a que de fato
-- importa: duas rodadas publicadas não podem ter janelas que se sobrepõem.
-- Assim o endereço sem código (/assessoria/nps) continua inequívoco.
--
-- Cada rodada tem link próprio pelo slug (/assessoria/nps/2026-set-out). O
-- slug "convite" fica reservado porque /assessoria/nps/convite/<token> é a
-- rota do link pessoal.
--
-- Tratativas: todo detrator e todo aluno com chance baixa de renovação vira
-- uma tratativa no painel (status + responsável), com histórico de anotações
-- que só cresce. A ausência de linha em `nps_assessoria_followups` significa
-- "pendente": a fila nasce sozinha, sem gatilho.
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══ 1. Rodadas ═════════════════════════════════════════════════════════════
drop index if exists public.nps_assessoria_campaigns_uma_ativa;

alter table public.nps_assessoria_campaigns
  add column if not exists created_by text,
  add column if not exists updated_by text;

comment on column public.nps_assessoria_campaigns.slug is
  'Código público da rodada: /assessoria/nps/<slug>. Padrão do painel: <ano>-<bimestre>, ex.: 2026-set-out.';
comment on column public.nps_assessoria_campaigns.reference_period is
  'Período de referência. Rodadas bimestrais usam <ano>-B<n> (B1 = jan–fev … B6 = nov–dez).';

do $$
begin
  -- Publicada sem data de abertura não tem janela: não daria para impedir sobreposição.
  if not exists (select 1 from pg_constraint where conname = 'nps_assessoria_campaigns_publicada_com_abertura') then
    alter table public.nps_assessoria_campaigns
      add constraint nps_assessoria_campaigns_publicada_com_abertura
      check (status <> 'active' or opens_at is not null);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'nps_assessoria_campaigns_slug_reservado') then
    alter table public.nps_assessoria_campaigns
      add constraint nps_assessoria_campaigns_slug_reservado
      check (slug not in ('convite'));
  end if;

  -- Janela aberta no fim (closes_at nulo) vale até o infinito.
  if not exists (select 1 from pg_constraint where conname = 'nps_assessoria_campaigns_sem_sobreposicao') then
    alter table public.nps_assessoria_campaigns
      add constraint nps_assessoria_campaigns_sem_sobreposicao
      exclude using gist (
        tstzrange(opens_at, coalesce(closes_at, 'infinity'::timestamptz), '[)') with &&
      )
      where (status = 'active');
  end if;
end $$;

-- A primeira rodada ganha período e título no formato das próximas. O slug
-- dela NÃO muda: a pesquisa já está no ar, e quem está com o formulário
-- aberto envia o slug que recebeu. Trocar agora recusaria esse envio.
update public.nps_assessoria_campaigns
set reference_period = '2026-B5',
    title = 'NPS da Assessoria · set–out 2026'
where slug = 'assessoria-nps-2026-09';

-- ═══ 2. Convites: quando o link foi compartilhado ═══════════════════════════
alter table public.nps_assessoria_invites
  add column if not exists shared_at timestamptz,
  add column if not exists shared_by text;

comment on column public.nps_assessoria_invites.shared_at is
  'Primeira vez que alguém do painel compartilhou o link (WhatsApp ou cópia). Separa "não enviado" de "enviado e não aberto".';

-- ═══ 3. Tratativas ══════════════════════════════════════════════════════════
create table if not exists public.nps_assessoria_followups (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null
    references public.nps_assessoria_responses (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'resolved', 'no_action')),
  -- Quem está cuidando: nome livre (professor, coordenação), não precisa ser usuário do painel.
  owner_name text,
  resolved_at timestamptz,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint nps_assessoria_followups_resposta_unica unique (response_id),
  constraint nps_assessoria_followups_owner_check
    check (owner_name is null or char_length(owner_name) between 1 and 120),
  -- Fechada tem data de fechamento; aberta não tem.
  constraint nps_assessoria_followups_fechamento_check
    check ((status in ('resolved', 'no_action')) = (resolved_at is not null))
);

comment on table public.nps_assessoria_followups is
  'Tratativa de uma resposta do NPS (detrator ou risco de renovação). Sem linha = pendente.';

create index if not exists nps_assessoria_followups_status_idx
  on public.nps_assessoria_followups (status);

create table if not exists public.nps_assessoria_followup_events (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null
    references public.nps_assessoria_followups (id) on delete cascade,
  -- Status depois do evento; nulo quando é só uma anotação.
  status text check (status in ('pending', 'in_progress', 'resolved', 'no_action')),
  note text,
  author text not null,
  created_at timestamptz not null default now(),

  constraint nps_assessoria_followup_events_note_check
    check (note is null or char_length(note) between 1 and 4000),
  constraint nps_assessoria_followup_events_conteudo_check
    check (status is not null or note is not null)
);

comment on table public.nps_assessoria_followup_events is
  'Histórico da tratativa: mudanças de status e anotações. Só cresce; nunca é editado.';

create index if not exists nps_assessoria_followup_events_followup_idx
  on public.nps_assessoria_followup_events (followup_id, created_at);

drop trigger if exists nps_assessoria_followups_updated_at on public.nps_assessoria_followups;
create trigger nps_assessoria_followups_updated_at
  before update on public.nps_assessoria_followups
  for each row execute function public.tg_nps_assessoria_updated_at();

alter table public.nps_assessoria_followups enable row level security;
alter table public.nps_assessoria_followup_events enable row level security;
revoke all on table public.nps_assessoria_followups from anon, authenticated;
revoke all on table public.nps_assessoria_followup_events from anon, authenticated;

-- ═══ 4. Resumo com a janela da rodada ═══════════════════════════════════════
-- Colunas novas só no fim: `create or replace view` não aceita reordenar.
create or replace view public.nps_assessoria_campaign_summary
with (security_invoker = true)
as
select
  c.id as campaign_id,
  c.slug,
  c.title,
  c.survey_version,
  c.reference_period,
  c.status,
  count(r.id) as total_responses,
  count(r.id) filter (where r.nps_category = 'promoter') as promoters,
  count(r.id) filter (where r.nps_category = 'passive') as passives,
  count(r.id) filter (where r.nps_category = 'detractor') as detractors,
  round(
    100.0 * (
      count(r.id) filter (where r.nps_category = 'promoter')
      - count(r.id) filter (where r.nps_category = 'detractor')
    ) / nullif(count(r.id), 0),
    1
  ) as nps,
  round(avg(r.nps_score), 2) as avg_nps_score,
  round(avg(r.overall_quality), 2) as avg_overall_quality,
  round(avg(r.expectation_delivery), 2) as avg_expectation_delivery,
  round(avg((r.teacher_followup + r.teacher_understands_goals + r.teacher_whatsapp_access
    + r.teacher_support_quality + r.teacher_communication_quality) / 5.0), 2) as avg_teacher,
  round(avg((r.training_quality + r.training_level_fit + r.training_goal_alignment) / 3.0), 2) as avg_training,
  round(avg(r.perceived_progress), 2) as avg_perceived_progress,
  round(avg((r.whatsapp_group_quality + r.whatsapp_connection + r.whatsapp_information_clarity) / 3.0), 2) as avg_whatsapp,
  round(avg(r.community_climate), 2) as avg_community_climate,
  round(avg(r.community_belonging), 2) as avg_community_belonging,
  round(avg((r.sunday_support_quality + r.sunday_value) / 2.0), 2) as avg_sunday,
  round(avg(r.physical_structure_quality), 2) as avg_physical_structure,
  round(avg(r.cost_benefit), 2) as avg_cost_benefit,
  round(avg(r.renewal_probability), 2) as avg_renewal_probability,
  count(r.id) filter (where r.weekday_training_interest = 'yes') as weekday_interest_yes,
  count(r.id) filter (where r.weekday_training_interest = 'maybe') as weekday_interest_maybe,
  count(r.id) filter (where r.weekday_training_interest = 'no') as weekday_interest_no,
  count(r.id) filter (where r.preferred_weekday_combination = 'mon_wed') as prefers_mon_wed,
  count(r.id) filter (where r.preferred_weekday_combination = 'tue_thu') as prefers_tue_thu,
  count(r.id) filter (where 'morning' = any (r.available_periods)) as available_morning,
  count(r.id) filter (where 'afternoon' = any (r.available_periods)) as available_afternoon,
  count(r.id) filter (where 'evening' = any (r.available_periods)) as available_evening,
  round(avg(r.completion_seconds)) as avg_completion_seconds,
  min(r.submitted_at) as first_response_at,
  max(r.submitted_at) as last_response_at,
  c.opens_at,
  c.closes_at,
  c.created_at
from public.nps_assessoria_campaigns c
left join public.nps_assessoria_responses r on r.campaign_id = c.id
group by c.id;

revoke all on public.nps_assessoria_campaign_summary from anon, authenticated;
grant select on public.nps_assessoria_campaign_summary to service_role;
