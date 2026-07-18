-- ─────────────────────────────────────────────────────────────────────────────
-- TF SPORTS — colunas de validação de check-in
-- A tabela public."tf-sports" (nome com hífen → precisa de aspas) tem os atletas
-- do "Treinão de Corrida | Somma Special Day", mas NÃO tinha campo para marcar a
-- entrada validada. Estas colunas espelham o padrão da leads_shakeout_centauro.
-- Idempotente (IF NOT EXISTS) — pode reexecutar sem risco.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public."tf-sports"
  add column if not exists validacao_do_checkin boolean not null default false,
  add column if not exists validated_at timestamptz;

-- Índice opcional p/ acelerar a contagem de "entradas liberadas"
create index if not exists idx_tf_sports_validacao
  on public."tf-sports" (validacao_do_checkin);

-- ─────────────────────────────────────────────────────────────────────────────
-- (RECOMENDADO, opcional) Hardening de RLS — hoje a tabela está legível pela
-- ANON KEY (vaza nome + CPF de 360 pessoas). A rota nova usa service-role, então
-- fechar o anon NÃO quebra o check-in. Rode SÓ se nenhuma integração externa
-- estiver LENDO a tabela via anon (a inserção externa continua se for service-role):
--
--   alter table public."tf-sports" enable row level security;
--   alter table public."tf-sports" force row level security;
--   revoke all on public."tf-sports" from anon;
--   revoke all on public."tf-sports" from authenticated;
-- ─────────────────────────────────────────────────────────────────────────────
