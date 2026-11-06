-- Só para testes locais: o mínimo das tabelas reais, para a migration rodar no PGlite.
create role anon; create role authenticated; create role service_role;
create schema if not exists storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table public.eventos (
  id uuid primary key default gen_random_uuid(), titulo text, slug text unique, data_evento date, horario_inicio text,
  checkin_status text, evento_encerrado boolean default false, pelotoes text[], capacidade int, oculto_no_checkin_publico boolean default false
);
create table public.cadastro_site (id bigint generated always as identity primary key, cpf text, nome_completo text, email text, sexo text);
create table public.evento_participantes (
  id uuid primary key default gen_random_uuid(), evento_id uuid references public.eventos(id), pessoa_id bigint, cpf text,
  nome_completo text, email text, telefone text, status text default 'inscrito', ticket_code text, ticket_token text default gen_random_uuid()::text,
  pelotao text, metadata jsonb default '{}'::jsonb, criado_em timestamptz default now(), unique (evento_id, pessoa_id)
);
-- Stub mínimo de dados_insiders (produção tem bem mais colunas; o acesso do corre só usa estas).
create table public.dados_insiders (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null,
  email text,
  telefone text,
  sexo text,
  ativo boolean not null default true,
  consent_lgpd boolean not null default true,
  consent_imagem boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Igual à função real: acha pelo CPF ou cria, sem sobrescrever.
create or replace function public.upsert_pessoa_por_cpf(
  p_cpf text, p_nome text, p_email text default null, p_whatsapp text default null,
  p_sexo text default null, p_nascimento text default null, p_cep text default null, p_atualizar boolean default false
) returns bigint language plpgsql as $$
declare i bigint;
begin
  select id into i from public.cadastro_site where cpf = p_cpf order by id limit 1;
  if i is null then
    insert into public.cadastro_site (cpf, nome_completo, email, sexo) values (p_cpf, p_nome, p_email, p_sexo) returning id into i;
  end if;
  return i;
end $$;
