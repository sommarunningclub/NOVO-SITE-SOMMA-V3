-- ─────────────────────────────────────────────────────────────────────────────
-- Aceites de termos (uso de imagem e LGPD)
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
--
-- A prova de quem aceitou o quê, quando e em qual versão do termo. Uma linha por
-- aceite: a mesma pessoa aparece de novo a cada evento, de propósito.
--
-- `forma` diz quem marcou o aceite, porque isso muda o peso da prova:
--   titular   a própria pessoa, no formulário dela
--   equipe    a equipe SOMMA declarou que a pessoa aceitou (/check-in/interno)
--   terceiro  quem transferiu o ingresso declarou pela pessoa que recebeu
--
-- Só a service role acessa, e só lê e insere: aceite gravado não se edita nem
-- se apaga pelo site. Pedido de exclusão de titular é feito direto no banco.
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.aceites_termos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('uso_imagem', 'lgpd')),
  versao text not null,
  origem text not null,
  forma text not null default 'titular' check (forma in ('titular', 'equipe', 'terceiro')),
  cpf_digits text not null check (cpf_digits ~ '^[0-9]{11}$'),
  nome text,
  email text,
  evento_id uuid,
  ip text,
  user_agent text,
  aceito_em timestamptz not null default now()
);

create index if not exists aceites_termos_cpf_idx on public.aceites_termos (cpf_digits);
create index if not exists aceites_termos_evento_idx on public.aceites_termos (evento_id);

alter table public.aceites_termos enable row level security;

revoke all on public.aceites_termos from public, anon, authenticated, service_role;
grant select, insert on public.aceites_termos to service_role;
