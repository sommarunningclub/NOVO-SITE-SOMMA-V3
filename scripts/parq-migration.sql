-- ─────────────────────────────────────────────────────────────────────────────
-- Par-Q (anamnese pós-compra) — colunas no cadastro do aluno
-- Rodar no SQL editor do Supabase de PRODUÇÃO (projeto riqf… / mesmo da assessoria).
-- Seguro de re-rodar (IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "gestao-clientes-assessoria"
  ADD COLUMN IF NOT EXISTS parq_cardio_pressao_supervisao   boolean,
  ADD COLUMN IF NOT EXISTS parq_dor_peito_atividade         boolean,
  ADD COLUMN IF NOT EXISTS parq_dor_peito_ultimo_mes        boolean,
  ADD COLUMN IF NOT EXISTS parq_desequilibrio_tontura       boolean,
  ADD COLUMN IF NOT EXISTS parq_problema_osseo_articular    boolean,
  ADD COLUMN IF NOT EXISTS parq_medicacao_continua          boolean,
  ADD COLUMN IF NOT EXISTS parq_tratamento_pressao_cardiaco boolean,
  ADD COLUMN IF NOT EXISTS parq_tratamento_continuo_afeta   boolean,
  ADD COLUMN IF NOT EXISTS parq_cirurgia_compromete         boolean,
  ADD COLUMN IF NOT EXISTS parq_outra_razao_saude           boolean,
  -- metadados
  ADD COLUMN IF NOT EXISTS parq_observacoes   text,
  ADD COLUMN IF NOT EXISTS parq_apto          boolean,
  ADD COLUMN IF NOT EXISTS parq_respondido_em timestamptz;

-- (Opcional) Política RLS para permitir UPDATE das colunas Par-Q pelo cliente anônimo,
-- caso o UPDATE pela anon key seja bloqueado. Avalie conforme suas políticas atuais.
-- create policy "parq_update_anon" on "gestao-clientes-assessoria"
--   for update to anon using (true) with check (true);
