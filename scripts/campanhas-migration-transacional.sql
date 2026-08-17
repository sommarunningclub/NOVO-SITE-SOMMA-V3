-- ─────────────────────────────────────────────────────────────────────────────
-- RÉGUA DE CAMPANHAS — migração para envio transacional (parte 2)
--
-- Rodar no SQL editor do Supabase de PRODUÇÃO, depois de campanhas-migration.sql.
-- Idempotente (ADD COLUMN IF NOT EXISTS).
--
-- Por que este pivô: a conta Resend está no plano Marketing que limita a 1.000
-- contatos armazenados, e a base tem 6.875. `broadcasts` só manda para quem está
-- importado como Contact numa Audience/Segment, então o broadcast da etapa 1 foi
-- recusado pela Resend (import de 5.861 contatos funcionou; criar o broadcast, não).
--
-- `emails.send`/`batch.send` (transacional) são cobrados por volume de e-mail, não
-- por contato armazenado, e não têm esse teto. A troca custa duas coisas que o
-- broadcast dava de graça, e que esta migração resolve:
--
--   1. Correlação de abertura sem `broadcast_id`: cada envio leva `tags`
--      (campanha/etapa/segmento), e a Resend ecoa essas tags no evento do
--      webhook. `campanha_eventos` passa a guardar essas três colunas.
--   2. Descadastro: broadcast dá URL de descadastro nativa; envio transacional
--      não dá nada. `campanha_contatos.descadastrado_em` é o que agora impede
--      reenvio para quem pediu para sair, e `/api/campanhas/descadastrar` é a
--      rota que grava essa data a partir de um link assinado no rodapé do e-mail.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Quem pediu para sair -------------------------------------------------------
-- NULL = continua recebendo. Toda consulta de destinatário passa a filtrar por
-- esta coluna, na base inteira, não só na campanha atual: um novo NOT NULL aqui
-- vale para qualquer campanha futura que reuse `campanha_contatos`.
ALTER TABLE campanha_contatos
  ADD COLUMN IF NOT EXISTS descadastrado_em timestamptz;

CREATE INDEX IF NOT EXISTS campanha_contatos_ativos_idx
  ON campanha_contatos (campanha, segmento)
  WHERE descadastrado_em IS NULL;

-- 2. Eventos por tag, não só por broadcast --------------------------------------
-- `broadcast_id` continua existindo (nullable) para o dia em que a régua voltar a
-- usar broadcast; as três colunas novas são o caminho que o envio transacional
-- usa hoje. Pelo menos um dos dois pares precisa estar preenchido, mas isso é
-- responsabilidade de quem grava (a rota do webhook), não uma CHECK aqui.
ALTER TABLE campanha_eventos
  ADD COLUMN IF NOT EXISTS campanha text,
  ADD COLUMN IF NOT EXISTS etapa    smallint,
  ADD COLUMN IF NOT EXISTS segmento text;

-- A UNIQUE antiga (email, broadcast_id, tipo) não serve mais sozinha: evento
-- transacional tem broadcast_id NULL sempre, e NULL não colide em UNIQUE do
-- Postgres, então ela nunca dedupliparia esses eventos. Troca pela chave que o
-- caminho novo realmente usa.
ALTER TABLE campanha_eventos
  DROP CONSTRAINT IF EXISTS campanha_eventos_unicos;

ALTER TABLE campanha_eventos
  ADD CONSTRAINT campanha_eventos_unicos
  UNIQUE (campanha, etapa, segmento, email, tipo);

CREATE INDEX IF NOT EXISTS campanha_eventos_campanha_etapa_idx
  ON campanha_eventos (campanha, etapa, segmento, tipo);

-- 3. Conferência ------------------------------------------------------------
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'campanha_contatos' AND column_name = 'descadastrado_em'
UNION ALL
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'campanha_eventos' AND column_name IN ('campanha','etapa','segmento')
ORDER BY 1;
