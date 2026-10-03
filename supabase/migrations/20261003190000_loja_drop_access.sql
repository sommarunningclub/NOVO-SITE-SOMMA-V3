-- DROP ACCESS da loja (/loja): lista de quem quer saber dos drops antes.
--
-- Só o servidor grava (service role, via server action). RLS ligado e sem
-- policy: a chave anon não lê nem escreve. O disparo sai pelo módulo de
-- campanhas do admin, que lê esta tabela como base.
create table if not exists public.loja_drop_access (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  -- de onde veio o cadastro: home, archive ou pdp
  origem text not null default 'home',
  criado_em timestamptz not null default now(),
  constraint loja_drop_access_email_key unique (email),
  constraint loja_drop_access_origem_check check (origem in ('home', 'archive', 'pdp'))
);

alter table public.loja_drop_access enable row level security;

comment on table public.loja_drop_access is
  'Lista DROP ACCESS da loja (sommaclub.com.br/loja). Gravada só pelo servidor do site.';
