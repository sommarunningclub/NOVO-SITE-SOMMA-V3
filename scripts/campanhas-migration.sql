-- ─────────────────────────────────────────────────────────────────────────────
-- RÉGUA DE CAMPANHAS DE E-MAIL — módulo /admin/campanhas
--
-- Rodar no SQL editor do Supabase de PRODUÇÃO (o mesmo do restante do site).
-- Seguro de re-rodar (IF NOT EXISTS / DO $$ ... $$).
--
-- Por que estas tabelas existem: o Resend NÃO expõe quem abriu um broadcast.
-- Não há endpoint de destinatários nem de estatística por broadcast (conferido
-- na API e no SDK 6.17.1). O que existe é o webhook `email.opened`, cujo payload
-- traz `broadcast_id`. Então a única forma de montar "quem não abriu a etapa
-- anterior" é guardar aqui: quem recebeu cada etapa, e quais aberturas chegaram.
--
-- Consequência operacional: o webhook precisa estar de pé ANTES do disparo. Uma
-- abertura que acontece com o webhook fora do ar não volta.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. A base da campanha, deduplicada ------------------------------------------
-- Uma linha por pessoa. `segmento` guarda de qual base ela veio (cadastro_site
-- ou checkins), que é o corte que a Evolve quer ver; o cruzamento já foi feito
-- na geração, então ninguém aparece duas vezes.
CREATE TABLE IF NOT EXISTS campanha_contatos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em    timestamptz NOT NULL DEFAULT now(),
  campanha     text NOT NULL,
  email        text NOT NULL,               -- normalizado: minúsculo, sem espaços
  nome         text,
  segmento     text NOT NULL,               -- 'cadastro-site' | 'checkins'
  CONSTRAINT campanha_contatos_unicos UNIQUE (campanha, email)
);

CREATE INDEX IF NOT EXISTS campanha_contatos_campanha_idx
  ON campanha_contatos (campanha, segmento);

-- 2. As etapas da régua -------------------------------------------------------
-- `resend_broadcast_id` é a chave que liga a etapa aos eventos do webhook.
-- Cada etapa tem um segmento próprio no Resend: a etapa 2 não é a etapa 1
-- refiltrada lá, é uma lista nova montada aqui a partir de quem não abriu.
CREATE TABLE IF NOT EXISTS campanha_etapas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em           timestamptz NOT NULL DEFAULT now(),
  campanha            text NOT NULL,
  etapa               smallint NOT NULL CHECK (etapa BETWEEN 1 AND 9),
  -- Uma etapa tem um disparo por base, porque a Evolve quer separar a origem no
  -- utm_content e um broadcast carrega um HTML só, logo uma URL só. O `Segments`
  -- do Resend é o alvo (audienceId está deprecado no SDK 6.17).
  segmento            text NOT NULL,
  variante            text NOT NULL,
  assunto             text NOT NULL,
  resend_segment_id   text,
  resend_import_id    text,
  resend_broadcast_id text,
  agendado_para       timestamptz,
  enviado_em          timestamptz,
  -- rascunho: existe aqui mas nada foi criado no Resend
  -- agendado:  broadcast criado e com data marcada
  -- enviado:   o Resend confirmou a saída
  -- cancelado: abortado antes de sair
  status              text NOT NULL DEFAULT 'rascunho'
                      CHECK (status IN ('rascunho','agendado','enviado','cancelado')),
  total_destinatarios integer NOT NULL DEFAULT 0,
  CONSTRAINT campanha_etapas_unicas UNIQUE (campanha, etapa, segmento)
);

CREATE INDEX IF NOT EXISTS campanha_etapas_broadcast_idx
  ON campanha_etapas (resend_broadcast_id)
  WHERE resend_broadcast_id IS NOT NULL;

-- 3. Quem recebeu cada etapa --------------------------------------------------
-- Sem isto não existe régua: "quem não abriu a etapa 2" só faz sentido contra a
-- lista de quem de fato RECEBEU a etapa 2, que é menor que a base.
CREATE TABLE IF NOT EXISTS campanha_destinatarios (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  campanha  text NOT NULL,
  etapa     smallint NOT NULL,
  segmento  text NOT NULL,
  email     text NOT NULL,
  CONSTRAINT campanha_destinatarios_unicos UNIQUE (campanha, etapa, email)
);

CREATE INDEX IF NOT EXISTS campanha_destinatarios_etapa_idx
  ON campanha_destinatarios (campanha, etapa, segmento);

-- 4. Eventos vindos do webhook do Resend --------------------------------------
-- Guarda o evento cru por (e-mail, broadcast, tipo). A UNIQUE é o que torna o
-- webhook idempotente: o Resend reentrega quando não recebe 2xx, e uma segunda
-- abertura da mesma pessoa não deve virar linha nova.
--
-- `broadcast_id` é anulável mas na prática nunca chega nulo: a rota descarta
-- evento sem broadcast (e-mail transacional) antes de gravar. Isso importa porque
-- em Postgres NULLs são distintos numa UNIQUE, então a dedup só vale para linha
-- com broadcast preenchido. Se um dia a rota passar a guardar transacional,
-- revisite esta constraint junto.
CREATE TABLE IF NOT EXISTS campanha_eventos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recebido_em  timestamptz NOT NULL DEFAULT now(),
  email        text NOT NULL,               -- normalizado: minúsculo
  broadcast_id text,
  email_id     text,
  tipo         text NOT NULL,               -- 'opened' | 'clicked'
  ocorrido_em  timestamptz,
  CONSTRAINT campanha_eventos_unicos UNIQUE (email, broadcast_id, tipo)
);

-- O índice que a consulta de "não abriu" usa: por broadcast e tipo.
CREATE INDEX IF NOT EXISTS campanha_eventos_broadcast_tipo_idx
  ON campanha_eventos (broadcast_id, tipo, email);

-- 5. RLS ----------------------------------------------------------------------
-- Nenhuma destas tabelas é lida pelo cliente: quem toca nelas é o webhook e o
-- painel do admin, os dois com service role, que ignora RLS. RLS ligado e ZERO
-- policy é o que fecha a porta para a anon key.
--
-- Mesmo princípio do rls-hardening.sql deste projeto, e de propósito sem
-- `FORCE ROW LEVEL SECURITY`: FORCE aplica RLS também ao dono da tabela, e como
-- aqui não existe policy nenhuma, isso deixaria o editor de tabelas do Supabase
-- (que consulta como dono) mostrando vazio, sem ganho de segurança. Quem precisa
-- ser barrado é a anon, e `ENABLE` já faz isso.
--
-- O laço também derruba policy pré-existente, para o script poder ser reexecutado
-- sem deixar brecha aberta por acidente.
DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['campanha_contatos','campanha_etapas','campanha_destinatarios','campanha_eventos']
  LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- 6. Conferência --------------------------------------------------------------
-- Deve listar as quatro tabelas com rls = true e policies = 0.
-- `policyname` e não `polname`: quem tem `polname` é o catálogo pg_policy; a view
-- pg_policies, usada aqui, chama a coluna de `policyname`.
SELECT c.relname AS tabela, c.relrowsecurity AS rls, count(p.policyname) AS policies
FROM pg_class c
LEFT JOIN pg_policies p ON p.tablename = c.relname AND p.schemaname = 'public'
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
  AND c.relname IN ('campanha_contatos','campanha_etapas','campanha_destinatarios','campanha_eventos')
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;
