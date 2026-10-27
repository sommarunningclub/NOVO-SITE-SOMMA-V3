-- ─────────────────────────────────────────────────────────────────────────────
-- Maratona do Rio 2027: intenção de prova da galera da assessoria
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
-- Rota pública: sommaclub.com.br/assessoria/maratona-rio-2027
--
-- Não é inscrição na prova. A pessoa diz que quer ir e qual distância pretende
-- correr, para a assessoria se organizar (grupo, viagem, planilha).
--
-- Uma linha por CPF: quem envia de novo atualiza a própria intenção (mudou de
-- distância, corrigiu o telefone) em vez de aparecer duas vezes.
--
-- Sem policy nenhuma: só a service role lê e escreve, sempre server-side.
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.maratona_rio_2027_intencoes (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  nome text not null,
  -- Só dígitos, com DDI 55.
  telefone text not null,
  email text not null,
  -- Só dígitos.
  cpf text not null unique check (cpf ~ '^\d{11}$'),
  sexo text not null check (sexo in ('feminino', 'masculino')),
  prova text not null check (prova in ('5k', '10k', '21k', '42k', 'desafio_63k')),

  ip text,
  user_agent text
);

create index if not exists maratona_rio_2027_intencoes_prova_idx
  on public.maratona_rio_2027_intencoes (prova);

alter table public.maratona_rio_2027_intencoes enable row level security;

comment on table public.maratona_rio_2027_intencoes is
  'Intenção de prova na Maratona do Rio 2027 (assessoria). Uma linha por CPF; reenvio atualiza.';
comment on column public.maratona_rio_2027_intencoes.prova is
  '5k, 10k, 21k (meia), 42k (maratona) ou desafio_63k (Desafio Cidade Maravilhosa: 21 km no sábado + 42 km no domingo).';
