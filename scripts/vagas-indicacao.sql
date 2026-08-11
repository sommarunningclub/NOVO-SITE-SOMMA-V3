-- ─────────────────────────────────────────────────────────────────────────────
-- Trabalhe Conosco — "Foi indicado?" na candidatura
-- Rodar no SQL editor do Supabase de PRODUÇÃO (o mesmo da gestão/assessoria).
-- Seguro de re-rodar (IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE candidatos_vagas
  ADD COLUMN IF NOT EXISTS indicado      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS indicado_por  text;

-- Quem indicou só faz sentido quando houve indicação. Sem isto, um "não" com
-- nome preenchido entraria no banco e a triagem leria indicação onde não houve.
ALTER TABLE candidatos_vagas
  DROP CONSTRAINT IF EXISTS candidatos_vagas_indicacao_check;

ALTER TABLE candidatos_vagas
  ADD CONSTRAINT candidatos_vagas_indicacao_check
  CHECK (indicado OR indicado_por IS NULL);

-- Facilita "quem mais indicou candidatos" sem varrer a tabela inteira.
CREATE INDEX IF NOT EXISTS candidatos_vagas_indicado_por_idx
  ON candidatos_vagas (indicado_por)
  WHERE indicado_por IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Conferência
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT nome, indicado, indicado_por FROM candidatos_vagas ORDER BY criado_em DESC;
