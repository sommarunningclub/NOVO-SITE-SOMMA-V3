-- ─────────────────────────────────────────────────────────────────────────────
-- Maratona do Rio 2027: vagas e abertura da inscrição da Meia pelo painel
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
--
-- Uma linha só. O painel (/assessoria/maratona-rio-2027/admin, aba Inscrições)
-- muda o número de vagas do lote e abre ou fecha as inscrições sem deploy. O
-- site lê daqui a cada inscrição e passa o teto para maratona_rio_2027_inscrever.
--
-- Sem policy nenhuma: só a service role lê e escreve, sempre server-side.
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.maratona_rio_2027_config (
  id smallint primary key default 1 check (id = 1),
  limite_vagas integer not null default 50 check (limite_vagas between 0 and 1000),
  inscricoes_abertas boolean not null default true,
  atualizado_em timestamptz not null default now()
);

insert into public.maratona_rio_2027_config (id, limite_vagas, inscricoes_abertas)
values (1, 50, true)
on conflict (id) do nothing;

alter table public.maratona_rio_2027_config enable row level security;

comment on table public.maratona_rio_2027_config is
  'Vagas do lote e abertura da inscrição da Meia Maratona do Rio 2027. Editado pelo painel da assessoria.';
