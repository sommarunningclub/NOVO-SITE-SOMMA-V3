-- ═══════════════════════════════════════════════════════════════════════════
-- O LONGÃO — estrutura de banco (edição 2026)
--
-- Idempotente: pode reexecutar. Rode no SQL Editor do Supabase
-- (o `supabase db push` não funciona neste projeto; use o editor ou
-- `supabase db query -f scripts/o-longao-migration.sql`).
--
-- Arquitetura de plataforma, não de landing: a mesma base sustenta a
-- seletiva, a final de 24h, leaderboard ao vivo e edições futuras.
--
-- Mapa em relação ao escopo pedido:
--   events        → longao_events (edições; premiação e textos editáveis em jsonb)
--   registrations → longao_crews (a inscrição É a crew, com responsável/capitão)
--   crews         → longao_crews
--   categories    → check (masculino|feminino) em longao_teams
--   crew_members / athletes → longao_athletes (titular|reserva por equipe)
--   qualifiers / finalists  → longao_teams.status + campos de seletiva/final
--   treadmills    → longao_treadmills
--   live_sessions → longao_live_sessions (turnos de atleta na final)
--   leaderboard   → longao_leaderboard (snapshots para o placar ao vivo)
--   results       → longao_results (resultado publicado)
--   sponsors      → longao_sponsors
--   consents      → longao_consents (aceites com ip/user-agent)
--   audit_logs    → longao_audit_logs (ações do painel)
--
-- Segurança: RLS ligado e forçado em tudo, SEM policy — anon e authenticated
-- não leem nem escrevem nada. Todo acesso passa pelas rotas de API com
-- service role (padrão da casa).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Edições ─────────────────────────────────────────────────────────────────

create table if not exists longao_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  status text not null default 'inscricoes_abertas'
    check (status in ('rascunho', 'inscricoes_abertas', 'inscricoes_encerradas', 'seletiva', 'final', 'encerrado')),
  seletiva_data date,
  final_inicio timestamptz,
  final_fim timestamptz,
  -- premiação e textos básicos editáveis pelo painel sem deploy
  premiacao jsonb not null default '{"por_categoria":[{"posicao":1,"valor":6000},{"posicao":2,"valor":3000},{"posicao":3,"valor":1000}]}'::jsonb,
  textos jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into longao_events (slug, nome)
values ('o-longao-2026', 'O Longão 2026')
on conflict (slug) do nothing;

-- ── Crews (a inscrição) ─────────────────────────────────────────────────────

create table if not exists longao_crews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references longao_events (id) on delete cascade,

  nome text not null,
  instagram text not null,          -- handle sem @, minúsculo
  cidade text not null,
  logo_path text,                   -- objeto no bucket o-longao-logos

  -- código legível (LNG-8F4X29) e segredo opaco da crew (autoriza subir logo)
  codigo text not null,
  crew_token text not null,

  status text not null default 'pendente'
    check (status in ('pendente', 'aprovada', 'reprovada')),
  notas_internas text,

  -- responsável pela inscrição
  responsavel_nome text not null,
  responsavel_cpf text not null check (responsavel_cpf ~ '^[0-9]{11}$'),
  responsavel_telefone text not null,
  responsavel_whatsapp text not null,
  responsavel_email text not null,

  -- capitão (pode ser um dos atletas)
  capitao_nome text not null,
  capitao_telefone text not null,
  capitao_email text not null,

  -- taxa futura: hoje a inscrição é gratuita, o painel só marca
  pagamento_status text not null default 'isento'
    check (pagamento_status in ('isento', 'pendente', 'pago')),
  pagamento_marcado_em timestamptz,

  origem text not null default 'lp-o-longao',
  utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  referral text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists longao_crews_codigo_key on longao_crews (codigo);
create unique index if not exists longao_crews_token_key on longao_crews (crew_token);
-- uma crew por instagram por edição: evita inscrição duplicada da mesma comunidade
create unique index if not exists longao_crews_instagram_key on longao_crews (event_id, instagram);
create index if not exists longao_crews_event_status_idx on longao_crews (event_id, status);
create index if not exists longao_crews_created_idx on longao_crews (created_at desc);

-- ── Equipes (crew × categoria) ──────────────────────────────────────────────

create table if not exists longao_teams (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references longao_crews (id) on delete cascade,
  event_id uuid not null references longao_events (id) on delete cascade,
  categoria text not null check (categoria in ('masculino', 'feminino')),

  status text not null default 'inscrita'
    check (status in ('inscrita', 'classificada', 'finalista', 'eliminada')),

  -- seletiva
  seletiva_bateria smallint,
  seletiva_km numeric(7, 3),
  seletiva_posicao smallint,

  -- final
  final_km numeric(7, 3),
  final_posicao smallint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists longao_teams_crew_categoria_key on longao_teams (crew_id, categoria);
create index if not exists longao_teams_event_categoria_idx on longao_teams (event_id, categoria, status);

-- ── Atletas ─────────────────────────────────────────────────────────────────

create table if not exists longao_athletes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references longao_teams (id) on delete cascade,
  crew_id uuid not null references longao_crews (id) on delete cascade,
  event_id uuid not null references longao_events (id) on delete cascade,

  tipo text not null default 'titular' check (tipo in ('titular', 'reserva')),
  ordem smallint not null default 1,  -- posição no cadastro (atleta 01..08)

  nome text not null,
  cpf text not null check (cpf ~ '^[0-9]{11}$'),
  nascimento date not null,
  telefone text not null,
  email text not null,
  instagram text,
  camiseta text not null check (camiseta in ('PP', 'P', 'M', 'G', 'GG', 'XG')),
  emergencia_nome text not null,
  emergencia_telefone text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- um CPF corre por uma única equipe na edição (titular ou reserva)
create unique index if not exists longao_athletes_cpf_key on longao_athletes (event_id, cpf);
create index if not exists longao_athletes_team_idx on longao_athletes (team_id, tipo, ordem);

-- ── Infraestrutura da arena ─────────────────────────────────────────────────

create table if not exists longao_treadmills (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references longao_events (id) on delete cascade,
  numero smallint not null,
  modelo text,                       -- modelo Star Trac, preenchido quando anunciado
  fase text not null default 'final' check (fase in ('seletiva', 'final')),
  team_id uuid references longao_teams (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists longao_treadmills_numero_key on longao_treadmills (event_id, fase, numero);

-- ── Prova ao vivo (preparado; a lógica esportiva vem depois) ────────────────

-- turno de um atleta na esteira: base de trocas, parciais e performance individual
create table if not exists longao_live_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references longao_events (id) on delete cascade,
  team_id uuid not null references longao_teams (id) on delete cascade,
  athlete_id uuid references longao_athletes (id) on delete set null,
  fase text not null default 'final' check (fase in ('seletiva', 'final')),
  inicio timestamptz not null default now(),
  fim timestamptz,
  km numeric(7, 3),
  fonte text not null default 'manual' check (fonte in ('manual', 'telemetria')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists longao_live_sessions_team_idx on longao_live_sessions (team_id, inicio desc);

-- snapshot do placar: uma linha por equipe por captura, o site lê a mais recente
create table if not exists longao_leaderboard (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references longao_events (id) on delete cascade,
  team_id uuid not null references longao_teams (id) on delete cascade,
  fase text not null default 'final' check (fase in ('seletiva', 'final')),
  km_total numeric(7, 3) not null default 0,
  pace_atual text,
  atleta_atual uuid references longao_athletes (id) on delete set null,
  trocas integer not null default 0,
  capturado_em timestamptz not null default now()
);

create index if not exists longao_leaderboard_capturas_idx on longao_leaderboard (event_id, fase, capturado_em desc);

create table if not exists longao_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references longao_events (id) on delete cascade,
  team_id uuid not null references longao_teams (id) on delete cascade,
  fase text not null check (fase in ('seletiva', 'final')),
  categoria text not null check (categoria in ('masculino', 'feminino')),
  posicao smallint not null,
  km numeric(7, 3) not null,
  publicado boolean not null default false,
  publicado_em timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists longao_results_posicao_key on longao_results (event_id, fase, categoria, posicao);

-- ── Patrocinadores ──────────────────────────────────────────────────────────

create table if not exists longao_sponsors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references longao_events (id) on delete cascade,
  nome text not null,
  tier text not null default 'apoio' check (tier in ('master', 'realizacao', 'apoio')),
  logo_path text,
  url text,
  ordem smallint not null default 99,
  created_at timestamptz not null default now()
);

insert into longao_sponsors (event_id, nome, tier, ordem)
select e.id, s.nome, s.tier, s.ordem
from longao_events e
cross join (values
  ('Star Trac', 'master', 1),
  ('Somma Club', 'realizacao', 2),
  ('Evolve', 'realizacao', 3)
) as s (nome, tier, ordem)
where e.slug = 'o-longao-2026'
  and not exists (
    select 1 from longao_sponsors sp where sp.event_id = e.id and sp.nome = s.nome
  );

-- ── Consentimentos e auditoria ──────────────────────────────────────────────

create table if not exists longao_consents (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references longao_crews (id) on delete cascade,
  tipo text not null check (tipo in ('regulamento', 'imagem', 'veracidade')),
  aceito_em timestamptz not null default now(),
  ip text,
  user_agent text
);

create index if not exists longao_consents_crew_idx on longao_consents (crew_id);

create table if not exists longao_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references longao_events (id) on delete set null,
  ator text not null,               -- 'admin' | 'sistema' | 'crew:<codigo>'
  acao text not null,               -- 'aprovar_crew', 'editar_atleta', ...
  alvo_tabela text,
  alvo_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists longao_audit_logs_created_idx on longao_audit_logs (created_at desc);

-- ── updated_at automático ───────────────────────────────────────────────────

create or replace function longao_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['longao_events', 'longao_crews', 'longao_teams', 'longao_athletes']
  loop
    if not exists (
      select 1 from pg_trigger
      where tgname = t || '_touch_updated_at' and tgrelid = t::regclass
    ) then
      execute format(
        'create trigger %I before update on %I for each row execute function longao_touch_updated_at()',
        t || '_touch_updated_at', t
      );
    end if;
  end loop;
end;
$$;

-- ── RLS: ligado e forçado, sem policy. Só service role entra. ──────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'longao_events', 'longao_crews', 'longao_teams', 'longao_athletes',
    'longao_treadmills', 'longao_live_sessions', 'longao_leaderboard',
    'longao_results', 'longao_sponsors', 'longao_consents', 'longao_audit_logs'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('revoke all on %I from anon, authenticated', t);
  end loop;
end;
$$;

-- ── Storage: bucket público para os logos das crews ────────────────────────
-- (upload só via service role nas rotas de API; leitura pública para a vitrine)

insert into storage.buckets (id, name, public)
values ('o-longao-logos', 'o-longao-logos', true)
on conflict (id) do nothing;
