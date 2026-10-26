-- ─────────────────────────────────────────────────────────────────────────────
-- Nova Assessoria: a BORA como assessoria oficial do SOMMA Club
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
-- Rotas públicas: sommaclub.com.br/assessoria e os links de professor
-- (/joseph, /alexandre, /mateus, /gabriel-brito)
--
-- O site não vende mais assessoria. Quem tem interesse deixa nome e WhatsApp e
-- cai na conversa de um professor BORA. Em /assessoria o professor sai de um
-- rodízio (um para cada pessoa, na ordem da fila); no link de um professor, é
-- sempre ele. O admin (módulo "Nova Assessoria") lê tudo daqui.
--
--     nova_assessoria_rodizio   uma linha só: a ordem da fila e quantas
--                               pessoas já passaram por ela.
--     nova_assessoria_eventos   cada visita e cada contato, com origem (UTM,
--                               click ids, referrer), aparelho e local.
--
-- Sem policy nenhuma: só a service role lê e escreve, sempre server-side
-- (rotas do site e do admin).
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══ 1. Rodízio ═════════════════════════════════════════════════════════════
create table if not exists public.nova_assessoria_rodizio (
  id smallint primary key default 1 check (id = 1),
  -- Slugs dos professores, na ordem em que recebem as pessoas.
  ordem text[] not null,
  -- Quantas pessoas já foram distribuídas. A próxima vai para
  -- ordem[posicao % cardinality(ordem) + 1].
  posicao bigint not null default 0,
  atualizado_em timestamptz not null default now()
);

insert into public.nova_assessoria_rodizio (id, ordem)
values (1, array['joseph', 'alexandre', 'mateus', 'gabriel-brito'])
on conflict (id) do nothing;

alter table public.nova_assessoria_rodizio enable row level security;

-- Avança a fila e devolve a vez sorteada. O UPDATE trava a linha, então dois
-- cliques no mesmo instante nunca recebem a mesma posição.
create or replace function public.nova_assessoria_avancar_rodizio()
returns table (posicao bigint, professor text)
language sql
security definer
set search_path = public
as $$
  update public.nova_assessoria_rodizio r
     set posicao = r.posicao + 1,
         atualizado_em = now()
   where r.id = 1
  returning r.posicao,
            r.ordem[((r.posicao - 1) % cardinality(r.ordem)) + 1];
$$;

revoke all on function public.nova_assessoria_avancar_rodizio() from public, anon, authenticated;
grant execute on function public.nova_assessoria_avancar_rodizio() to service_role;

-- ═══ 2. Eventos ═════════════════════════════════════════════════════════════
create table if not exists public.nova_assessoria_eventos (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),

  -- visita: abriu a página. contato: deixou nome e WhatsApp e foi mandado
  -- para o WhatsApp de um professor.
  tipo text not null check (tipo in ('visita', 'contato')),
  -- 'assessoria' ou 'bio-<slug do professor>'.
  pagina text not null,

  -- Contato
  professor text,
  professor_nome text,
  professor_whatsapp text,
  -- Posição no rodízio. Nula quando o professor veio do link dele ou quando a
  -- pessoa já tinha recebido um professor antes (repetido).
  rodizio_posicao bigint,
  repetido boolean not null default false,
  nome text,
  whatsapp text,

  -- Quem é o navegador (anônimo, gerado no aparelho)
  visitante_id text,
  sessao_id text,

  -- Origem desta visita
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  -- gclid, fbclid, ttclid, msclkid, ref...
  click_ids jsonb,
  referrer text,
  url text,
  -- Primeira origem registrada para este aparelho (first touch), com data.
  primeiro_toque jsonb,

  -- Aparelho e local
  dispositivo text,
  navegador text,
  sistema text,
  user_agent text,
  tela text,
  idioma text,
  fuso text,
  ip text,
  cidade text,
  regiao text,
  pais text
);

create index if not exists nova_assessoria_eventos_criado_em_idx
  on public.nova_assessoria_eventos (criado_em desc);
create index if not exists nova_assessoria_eventos_tipo_idx
  on public.nova_assessoria_eventos (tipo, criado_em desc);
create index if not exists nova_assessoria_eventos_visitante_idx
  on public.nova_assessoria_eventos (visitante_id) where tipo = 'contato';
create index if not exists nova_assessoria_eventos_whatsapp_idx
  on public.nova_assessoria_eventos (whatsapp) where tipo = 'contato';
create index if not exists nova_assessoria_eventos_ip_idx
  on public.nova_assessoria_eventos (ip, criado_em desc);

alter table public.nova_assessoria_eventos enable row level security;
