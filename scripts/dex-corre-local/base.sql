-- Só para testes locais: o mínimo das tabelas reais, para a migration rodar no PGlite.
create role anon; create role authenticated; create role service_role;
create schema if not exists storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table public.eventos (
  id uuid primary key default gen_random_uuid(), titulo text, slug text unique, data_evento date, horario_inicio text,
  checkin_status text, evento_encerrado boolean default false, pelotoes text[], capacidade int, oculto_no_checkin_publico boolean default false
);
create table public.cadastro_site (id bigint generated always as identity primary key, cpf text, nome text, email text, sexo text);
create table public.evento_participantes (
  id uuid primary key default gen_random_uuid(), evento_id uuid references public.eventos(id), pessoa_id bigint, cpf text,
  nome_completo text, email text, telefone text, status text default 'inscrito', ticket_code text, ticket_token text default gen_random_uuid()::text,
  pelotao text, metadata jsonb default '{}'::jsonb, criado_em timestamptz default now(), unique (evento_id, pessoa_id)
);
