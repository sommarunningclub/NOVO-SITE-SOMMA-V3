-- ─────────────────────────────────────────────────────────────────────────────
-- TOKENS DE LIBERAÇÃO DO PIX AUTOMÁTICO
--
-- Rodar no SQL editor do Supabase de PRODUÇÃO (o mesmo do restante do site).
-- Seguro de re-rodar (IF NOT EXISTS).
--
-- Por que existe: o Pix Automático aparece no checkout do plano Mensal, mas
-- fica bloqueado. A estratégia comercial é levar o máximo de gente para o
-- cartão e liberar o débito automático só para quem procurar o atendimento.
-- O admin gera um código, o atendimento passa para o cliente, e o código
-- libera UM checkout dentro de 24h.
--
-- O consumo é atômico no UPDATE (WHERE usado_em IS NULL AND expira_em > now()),
-- justamente para dois checkouts simultâneos não usarem o mesmo código.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pix_automatico_tokens (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              text NOT NULL UNIQUE,      -- curto e ditável por telefone
  criado_em           timestamptz NOT NULL DEFAULT now(),
  expira_em           timestamptz NOT NULL,      -- criado_em + 1 dia
  usado_em            timestamptz,               -- NULL = ainda disponível
  usado_por_customer  text,                      -- customerId do Asaas que consumiu
  usado_por_nome      text,
  criado_por          text,                      -- 'site-admin' | 'gestao'
  observacao          text                       -- para quem o atendimento gerou
);

CREATE INDEX IF NOT EXISTS pix_automatico_tokens_disponiveis_idx
  ON pix_automatico_tokens (codigo) WHERE usado_em IS NULL;

CREATE INDEX IF NOT EXISTS pix_automatico_tokens_recentes_idx
  ON pix_automatico_tokens (criado_em DESC);

-- RLS: a tabela é manipulada só por rotas server-side com service_role (que
-- ignora RLS). A anon key não pode ler nem escrever: um código vazado para o
-- browser liberaria o desconto de fluxo que o time quer controlar.
ALTER TABLE pix_automatico_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pix_automatico_tokens'
  ) THEN
    EXECUTE (
      SELECT string_agg(format('DROP POLICY %I ON public.pix_automatico_tokens;', policyname), ' ')
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'pix_automatico_tokens'
    );
  END IF;
END $$;
