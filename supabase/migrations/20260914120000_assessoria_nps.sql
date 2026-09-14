-- ─────────────────────────────────────────────────────────────────────────────
-- NPS da Assessoria Somma — pesquisa de experiência dos alunos
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
-- Rota pública: https://sommaclub.com.br/assessoria/nps
--
-- O que existia antes
-- ───────────────────
-- Nada equivalente. `feedback_weeks`/`weekly_feedbacks` são o check-in semanal
-- de treino do sistema de gestão (sono, dor, esforço), com outra pergunta e
-- outro ciclo; `campanha_*` são campanhas de e-mail. Esta migration NÃO toca em
-- nenhuma tabela existente — só cria as suas e aponta FKs para `professors`.
--
-- Quem é o aluno
-- ──────────────
-- O site não tem login de aluno. O identificador oficial, usado pela gestão em
-- `professor_clients`, `feedback_tokens` e `weekly_feedbacks`, é o customer id
-- do Asaas (`asaas_customer_id` / `student_asaas_id`). A resposta guarda esse
-- id quando dá para saber quem respondeu, por um de dois caminhos:
--
--   invite        link pessoal (/assessoria/nps/convite/<token>). Prova forte:
--                 só quem recebeu o link tem o token.
--   name_match    link genérico, e o nome digitado casa com UM único aluno de
--                 `professor_clients`. Útil para análise por professor, mas é
--                 inferência — o dashboard deve saber a diferença.
--   self_declared nenhum dos dois: fica só o nome.
--
-- O desenho
-- ─────────
--     nps_assessoria_campaigns   uma rodada da pesquisa (set/2026, mar/2027…).
--                                O histórico nunca é sobrescrito: rodada nova
--                                é linha nova.
--     nps_assessoria_invites     link pessoal por aluno, por rodada.
--     nps_assessoria_responses   uma resposta enviada. Colunas tipadas, uma por
--                                pergunta, para o dashboard agregar sem JSON.
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══ 1. Campanhas ═══════════════════════════════════════════════════════════
create table if not exists public.nps_assessoria_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  -- Versão do questionário. Mudou pergunta ou alternativa, muda a versão: é o
  -- que impede comparar respostas de perguntas diferentes como se fossem iguais.
  survey_version text not null,
  -- Período de referência legível ("2026-09"), para séries temporais.
  reference_period text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'closed')),
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint nps_assessoria_campaigns_slug_key unique (slug),
  constraint nps_assessoria_campaigns_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint nps_assessoria_campaigns_janela_check
    check (opens_at is null or closes_at is null or closes_at > opens_at)
);

comment on table public.nps_assessoria_campaigns is
  'Rodadas do NPS da Assessoria Somma. A rota /assessoria/nps responde à campanha com status active.';

-- Uma rodada no ar por vez: é o que torna a URL pública inequívoca.
create unique index if not exists nps_assessoria_campaigns_uma_ativa
  on public.nps_assessoria_campaigns ((true))
  where status = 'active';

-- ═══ 2. Convites (link pessoal) ═════════════════════════════════════════════
create table if not exists public.nps_assessoria_invites (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null
    references public.nps_assessoria_campaigns (id) on delete restrict,
  -- Segredo da URL. Aleatório (24 bytes, base64url), nunca aparece em lista.
  token text not null,
  student_asaas_id text not null,
  -- Pré-preenchimento: a pessoa confirma ou corrige na tela de identificação.
  first_name text not null,
  last_name text not null,
  -- Retrato do professor no momento do convite. O vínculo aluno-professor muda
  -- com o tempo; a análise por rodada precisa do professor daquela rodada.
  professor_id uuid references public.professors (id) on delete set null,
  professor_name text,
  opened_at timestamptz,
  created_at timestamptz not null default now(),

  constraint nps_assessoria_invites_token_check check (token ~ '^[A-Za-z0-9_-]{32,64}$'),
  -- Um convite por aluno por rodada: gerar de novo devolve o mesmo link.
  constraint nps_assessoria_invites_aluno_unico unique (campaign_id, student_asaas_id)
);

comment on table public.nps_assessoria_invites is
  'Link pessoal da pesquisa NPS por aluno (student_asaas_id) e rodada. Gerado por scripts/assessoria-nps-convites.mts.';

create unique index if not exists nps_assessoria_invites_token_key
  on public.nps_assessoria_invites (token);

-- ═══ 3. Respostas ═══════════════════════════════════════════════════════════
create table if not exists public.nps_assessoria_responses (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null
    references public.nps_assessoria_campaigns (id) on delete restrict,
  survey_version text not null,
  -- Gerado no aparelho quando a pessoa começa. Refresh, clique duplo ou retry de
  -- rede reenviam o MESMO id, e o índice único transforma isso em nada.
  client_submission_id uuid not null,

  -- ─── Identificação (a pesquisa não é anônima) ────────────────────────────
  first_name text not null,
  last_name text not null,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  -- Sem acento, minúsculo, sem partículas. Calculado na aplicação (unaccent não
  -- é imutável e não pode entrar em coluna gerada). Serve a busca e deduplicação.
  full_name_normalized text not null,
  identification_method text not null default 'self_declared'
    check (identification_method in ('invite', 'name_match', 'self_declared')),
  invite_id uuid references public.nps_assessoria_invites (id) on delete set null,
  student_asaas_id text,
  professor_id uuid references public.professors (id) on delete set null,
  professor_name text,

  -- ─── Experiência geral ───────────────────────────────────────────────────
  nps_score smallint not null check (nps_score between 0 and 10),
  -- Derivada, nunca perguntada. Coluna gerada: impossível divergir da nota.
  nps_category text generated always as (
    case
      when nps_score >= 9 then 'promoter'
      when nps_score >= 7 then 'passive'
      else 'detractor'
    end
  ) stored,
  nps_reason text,
  overall_quality smallint not null check (overall_quality between 1 and 5),
  expectation_delivery smallint not null check (expectation_delivery between 1 and 5),

  -- ─── Professor ───────────────────────────────────────────────────────────
  teacher_followup smallint not null check (teacher_followup between 1 and 5),
  teacher_understands_goals smallint not null check (teacher_understands_goals between 1 and 5),
  teacher_whatsapp_access smallint not null check (teacher_whatsapp_access between 1 and 5),
  teacher_support_quality smallint not null check (teacher_support_quality between 1 and 5),
  teacher_communication_quality smallint not null check (teacher_communication_quality between 1 and 5),

  -- ─── Treinos ─────────────────────────────────────────────────────────────
  training_quality smallint not null check (training_quality between 1 and 5),
  training_level_fit smallint not null check (training_level_fit between 1 and 5),
  training_goal_alignment smallint not null check (training_goal_alignment between 1 and 5),
  perceived_progress smallint not null check (perceived_progress between 1 and 5),
  needs_more_feedback text not null
    check (needs_more_feedback in ('yes', 'no', 'sometimes')),

  -- ─── WhatsApp ────────────────────────────────────────────────────────────
  whatsapp_group_quality smallint not null check (whatsapp_group_quality between 1 and 5),
  whatsapp_connection smallint not null check (whatsapp_connection between 1 and 5),
  whatsapp_message_volume text not null
    check (whatsapp_message_volume in ('very_low', 'low', 'adequate', 'high', 'very_high')),
  whatsapp_information_clarity smallint not null check (whatsapp_information_clarity between 1 and 5),
  whatsapp_content_preferences text[] not null,
  whatsapp_content_other text,

  -- ─── Comunidade ──────────────────────────────────────────────────────────
  community_climate smallint not null check (community_climate between 1 and 5),
  community_belonging smallint not null check (community_belonging between 1 and 5),
  community_interaction smallint not null check (community_interaction between 1 and 5),
  community_one_word text,

  -- ─── Domingos ────────────────────────────────────────────────────────────
  -- Perguntada antes das avaliações: quem nunca vai não avalia o que não conhece,
  -- e as colunas de avaliação ficam NULL (legítimo, não é dado faltando).
  sunday_frequency text not null
    check (sunday_frequency in ('never', 'rarely', 'sometimes_monthly', 'almost_every_sunday', 'every_sunday')),
  sunday_support_quality smallint check (sunday_support_quality between 1 and 5),
  sunday_value smallint check (sunday_value between 1 and 5),
  sunday_improvements text,

  -- ─── Treinos presenciais durante a semana ────────────────────────────────
  weekday_training_interest text not null
    check (weekday_training_interest in ('yes', 'maybe', 'no')),
  preferred_weekday_combination text
    check (preferred_weekday_combination in ('mon_wed', 'tue_thu', 'no_preference', 'other')),
  preferred_weekday_other text,
  -- A alternativa escolhida, como foi exibida…
  preferred_period text
    check (preferred_period in ('morning', 'afternoon', 'evening', 'multiple')),
  -- …e os períodos de fato, já resolvidos. "Manhã" vira {morning}; "mais de um"
  -- vira os que a pessoa marcou. É esta coluna que o dashboard conta.
  available_periods text[],
  preferred_morning_time text
    check (preferred_morning_time in ('before_6', '6_to_7', '7_to_8', 'after_8')),
  preferred_evening_time text
    check (preferred_evening_time in ('17_to_18', '18_to_19', '19_to_20', 'after_20')),
  expected_weekly_frequency text
    check (expected_weekly_frequency in ('once', 'twice', 'three_plus', 'depends_on_schedule')),

  -- ─── Estrutura presencial ────────────────────────────────────────────────
  physical_structure_quality smallint check (physical_structure_quality between 1 and 5),
  physical_structure_improvements text,

  -- ─── Valor percebido e permanência ───────────────────────────────────────
  cost_benefit smallint not null check (cost_benefit between 1 and 5),
  renewal_probability smallint not null check (renewal_probability between 0 and 10),

  -- ─── Abertas finais ──────────────────────────────────────────────────────
  what_is_excellent text,
  what_needs_improvement text,
  one_change text,

  -- ─── Metadados (sem IP, sem user agent cru) ──────────────────────────────
  source text not null default 'direct',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text check (device_type in ('mobile', 'tablet', 'desktop')),

  started_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  completion_seconds integer generated always as (
    greatest(0, extract(epoch from (submitted_at - started_at)))::integer
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- ═══ Vedação ═════════════════════════════════════════════════════════════
  constraint nps_assessoria_responses_envio_unico unique (campaign_id, client_submission_id),

  constraint nps_assessoria_responses_nome_check check (
    btrim(first_name) <> '' and btrim(last_name) <> ''
    and char_length(first_name) <= 60 and char_length(last_name) <= 80
  ),
  constraint nps_assessoria_responses_identificacao_check check (
    (identification_method = 'self_declared' and student_asaas_id is null and invite_id is null)
    or (identification_method = 'name_match' and student_asaas_id is not null and invite_id is null)
    or (identification_method = 'invite' and student_asaas_id is not null and invite_id is not null)
  ),
  constraint nps_assessoria_responses_tempo_check check (started_at <= submitted_at),
  constraint nps_assessoria_responses_source_check check (source ~ '^[a-z0-9_-]{1,40}$'),
  constraint nps_assessoria_responses_utm_check check (
    coalesce(char_length(utm_source), 0) <= 160
    and coalesce(char_length(utm_medium), 0) <= 160
    and coalesce(char_length(utm_campaign), 0) <= 160
  ),
  constraint nps_assessoria_responses_textos_check check (
    coalesce(char_length(nps_reason), 0) <= 2000
    and coalesce(char_length(whatsapp_content_other), 0) <= 200
    and coalesce(char_length(community_one_word), 0) <= 40
    and coalesce(char_length(sunday_improvements), 0) <= 2000
    and coalesce(char_length(preferred_weekday_other), 0) <= 200
    and coalesce(char_length(physical_structure_improvements), 0) <= 2000
    and coalesce(char_length(what_is_excellent), 0) <= 2000
    and coalesce(char_length(what_needs_improvement), 0) <= 2000
    and coalesce(char_length(one_change), 0) <= 2000
  ),

  -- Múltipla escolha: pelo menos uma, e só valores conhecidos.
  constraint nps_assessoria_responses_whatsapp_pref_check check (
    cardinality(whatsapp_content_preferences) >= 1
    and whatsapp_content_preferences <@ array[
      'training_guidance', 'coach_content', 'running_tips', 'race_info', 'announcements',
      'student_results', 'member_interaction', 'benefits_partners', 'other'
    ]::text[]
  ),
  constraint nps_assessoria_responses_whatsapp_outro_check check (
    whatsapp_content_other is null or 'other' = any (whatsapp_content_preferences)
  ),

  -- Domingos: quem nunca vai não avalia; quem vai, avalia.
  constraint nps_assessoria_responses_domingo_check check (
    (sunday_frequency = 'never'
      and sunday_support_quality is null and sunday_value is null and sunday_improvements is null
      and physical_structure_quality is null and physical_structure_improvements is null)
    or (sunday_frequency <> 'never'
      and sunday_support_quality is not null and sunday_value is not null
      and physical_structure_quality is not null)
  ),

  -- Semana: sem interesse, nada de dia e horário; com interesse, o essencial.
  constraint nps_assessoria_responses_semana_check check (
    (weekday_training_interest = 'no'
      and preferred_weekday_combination is null and preferred_weekday_other is null
      and preferred_period is null and available_periods is null
      and preferred_morning_time is null and preferred_evening_time is null
      and expected_weekly_frequency is null)
    or (weekday_training_interest <> 'no'
      and preferred_weekday_combination is not null and preferred_period is not null
      and available_periods is not null and expected_weekly_frequency is not null)
  ),
  constraint nps_assessoria_responses_dia_outro_check check (
    preferred_weekday_other is null or preferred_weekday_combination = 'other'
  ),
  constraint nps_assessoria_responses_periodos_check check (
    available_periods is null
    or (
      available_periods <@ array['morning', 'afternoon', 'evening']::text[]
      and (
        (preferred_period = 'multiple' and cardinality(available_periods) >= 2)
        or (preferred_period <> 'multiple' and available_periods = array[preferred_period]::text[])
      )
    )
  ),
  -- Horário da manhã existe exatamente quando a manhã é um dos períodos.
  constraint nps_assessoria_responses_manha_check check (
    coalesce('morning' = any (available_periods), false) = (preferred_morning_time is not null)
  ),
  constraint nps_assessoria_responses_noite_check check (
    coalesce('evening' = any (available_periods), false) = (preferred_evening_time is not null)
  )
);

comment on table public.nps_assessoria_responses is
  'Respostas do NPS da Assessoria Somma. Uma linha por envio concluído. nps_category e completion_seconds são colunas geradas. NULL em pergunta condicional = pergunta não exibida.';
comment on column public.nps_assessoria_responses.identification_method is
  'invite = link pessoal (prova forte); name_match = nome casou com um único aluno de professor_clients (inferência); self_declared = só o nome digitado.';
comment on column public.nps_assessoria_responses.available_periods is
  'Períodos resolvidos: a alternativa única vira array de um elemento; "mais de um período" vira os marcados. Use esta coluna para contar manhã/tarde/noite.';

-- Um link pessoal responde uma vez por rodada.
create unique index if not exists nps_assessoria_responses_convite_unico
  on public.nps_assessoria_responses (invite_id)
  where invite_id is not null;

-- Painel: NPS e listagem por rodada, série temporal, recortes por professor e
-- histórico do aluno entre rodadas.
create index if not exists nps_assessoria_responses_campanha_envio_idx
  on public.nps_assessoria_responses (campaign_id, submitted_at desc);
create index if not exists nps_assessoria_responses_campanha_categoria_idx
  on public.nps_assessoria_responses (campaign_id, nps_category);
create index if not exists nps_assessoria_responses_envio_idx
  on public.nps_assessoria_responses (submitted_at);
create index if not exists nps_assessoria_responses_professor_idx
  on public.nps_assessoria_responses (professor_id, campaign_id)
  where professor_id is not null;
create index if not exists nps_assessoria_responses_aluno_idx
  on public.nps_assessoria_responses (student_asaas_id)
  where student_asaas_id is not null;
create index if not exists nps_assessoria_responses_nome_idx
  on public.nps_assessoria_responses (campaign_id, full_name_normalized);

-- ═══ 4. updated_at ══════════════════════════════════════════════════════════
create or replace function public.tg_nps_assessoria_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists nps_assessoria_campaigns_updated_at on public.nps_assessoria_campaigns;
create trigger nps_assessoria_campaigns_updated_at
  before update on public.nps_assessoria_campaigns
  for each row execute function public.tg_nps_assessoria_updated_at();

drop trigger if exists nps_assessoria_responses_updated_at on public.nps_assessoria_responses;
create trigger nps_assessoria_responses_updated_at
  before update on public.nps_assessoria_responses
  for each row execute function public.tg_nps_assessoria_updated_at();

-- ═══ 5. RLS ═════════════════════════════════════════════════════════════════
-- Postura da casa (evento_participantes, longao_*): RLS ligado e NENHUMA
-- policy. anon e authenticated não leem nem escrevem nada — nem a própria
-- resposta. O formulário grava por POST /api/assessoria/nps, server-side, com
-- service_role, depois de validar tudo. A service role nunca vai ao navegador.
alter table public.nps_assessoria_campaigns enable row level security;
alter table public.nps_assessoria_invites enable row level security;
alter table public.nps_assessoria_responses enable row level security;

revoke all on table public.nps_assessoria_campaigns from anon, authenticated;
revoke all on table public.nps_assessoria_invites from anon, authenticated;
revoke all on table public.nps_assessoria_responses from anon, authenticated;

revoke all on function public.tg_nps_assessoria_updated_at() from public, anon, authenticated;

-- ═══ 6. Resumo por rodada (base do futuro dashboard) ════════════════════════
-- NPS = % promotores − % detratores, sobre o conjunto da rodada. Não é salvo
-- por linha: é calculado aqui. Médias ignoram NULL (pergunta não exibida).
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
  max(r.submitted_at) as last_response_at
from public.nps_assessoria_campaigns c
left join public.nps_assessoria_responses r on r.campaign_id = c.id
group by c.id;

comment on view public.nps_assessoria_campaign_summary is
  'Resumo por rodada do NPS da Assessoria: NPS consolidado, distribuição e médias por dimensão. security_invoker: respeita o RLS de quem consulta (só service_role vê dados).';

revoke all on public.nps_assessoria_campaign_summary from anon, authenticated;
grant select on public.nps_assessoria_campaign_summary to service_role;

-- ═══ 7. Primeira rodada ═════════════════════════════════════════════════════
insert into public.nps_assessoria_campaigns
  (slug, title, survey_version, reference_period, status, opens_at)
values
  ('assessoria-nps-2026-09', 'NPS da Assessoria Somma · setembro de 2026',
   'assessoria_nps_v1', '2026-09', 'active', now())
on conflict (slug) do nothing;
