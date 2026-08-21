-- ─────────────────────────────────────────────────────────────────────────────
-- P0.4 — Credenciais do Insider Conect
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
--
-- O login passou a exigir CPF **e** senha (`app/api/insider/login/route.ts`),
-- conferida contra `public.insider_credentials.senha_hash`. A tabela já existe
-- e já tem linhas; esta migration só garante as travas em volta dela e deixa
-- uma função para cadastrar/redefinir senha sem precisar de script externo.
--
-- Idempotente: pode reexecutar. Rode no SQL Editor do Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto with schema extensions;

-- ─── 1. A tabela ─────────────────────────────────────────────────────────────
create table if not exists public.insider_credentials (
  insider_id   bigint primary key,
  senha_hash   text not null,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Uma credencial por insider. (No-op se a PK já cobre.)
create unique index if not exists insider_credentials_insider_id_key
  on public.insider_credentials (insider_id);

-- ─── 2. Ninguém chega aqui pela chave pública ────────────────────────────────
-- Só o service_role (que ignora RLS) lê hashes. Sem policy = sem acesso anon.
alter table public.insider_credentials enable row level security;
alter table public.insider_credentials force row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'insider_credentials'
  loop
    execute format('drop policy if exists %I on public.insider_credentials', r.policyname);
  end loop;
end $$;

revoke all on table public.insider_credentials from anon;
revoke all on table public.insider_credentials from authenticated;

-- ─── 3. Cadastrar / redefinir senha ──────────────────────────────────────────
-- Uso no SQL Editor:
--   select public.insider_definir_senha('00000000000', 'senha-nova');
--
-- Gera bcrypt via pgcrypto — o mesmo formato que `lib/auth/password.ts` lê
-- ($2a$...). Aceita o CPF com ou sem pontuação e casa com as duas grafias
-- possíveis da coluna `dados_insiders.cpf`.
create or replace function public.insider_definir_senha(p_cpf text, p_senha text)
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_digitos text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_id bigint;
begin
  if length(v_digitos) <> 11 then
    raise exception 'CPF inválido: informe 11 dígitos';
  end if;
  if coalesce(p_senha, '') = '' then
    raise exception 'Senha vazia';
  end if;

  select id into v_id
    from public.dados_insiders
   where regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = v_digitos
   limit 1;

  if v_id is null then
    raise exception 'CPF não encontrado em dados_insiders';
  end if;

  insert into public.insider_credentials (insider_id, senha_hash)
  values (v_id, extensions.crypt(p_senha, extensions.gen_salt('bf', 12)))
  on conflict (insider_id) do update
    set senha_hash = excluded.senha_hash,
        atualizado_em = now();

  return format('senha definida para insider_id=%s', v_id);
end $$;

-- Função administrativa: nem anon nem authenticated encostam.
revoke all on function public.insider_definir_senha(text, text) from public;
revoke all on function public.insider_definir_senha(text, text) from anon;
revoke all on function public.insider_definir_senha(text, text) from authenticated;
grant execute on function public.insider_definir_senha(text, text) to service_role;

-- ─── 4. Quem ainda está sem senha ────────────────────────────────────────────
-- Insider sem credencial NÃO entra (o login recusa). Confira quem falta:
--   select d.id, d.nome
--     from public.dados_insiders d
--     left join public.insider_credentials c on c.insider_id = d.id
--    where c.insider_id is null;
