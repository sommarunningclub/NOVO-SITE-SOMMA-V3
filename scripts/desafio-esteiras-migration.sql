-- ─────────────────────────────────────────────────────────────────────────────
-- DESAFIO DAS ESTEIRAS — EVOLVE + SOMMA CLUB (19/08/2026)
-- Rota: /desafios-das-esteiras-evolve
--
-- Rodar no SQL editor do Supabase de PRODUÇÃO (o mesmo do restante do site).
-- Seguro de re-rodar (IF NOT EXISTS / DO $$ ... $$).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabela de inscrições -----------------------------------------------------
CREATE TABLE IF NOT EXISTS evolve_treadmill_event_registrations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),

  -- Participante
  full_name      text NOT NULL,
  cpf            text NOT NULL,               -- normalizado: 11 dígitos, sem máscara
  birth_date     date NOT NULL,
  email          text NOT NULL,               -- normalizado: minúsculo, sem espaços
  phone          text NOT NULL,               -- normalizado: DDD + número, sem +55

  -- Unidade Evolve (fonte da verdade: lib/desafio-esteiras/event.config.ts)
  unit_id        text NOT NULL
                 CHECK (unit_id IN ('vicente-pires', 'luziania', 'alameda', 'samambaia')),

  -- Ticket
  ticket_code    text NOT NULL,               -- legível: DST-VP-8F4X29
  ticket_token   text NOT NULL,               -- 32 bytes base64url — conteúdo do QR
  status         text NOT NULL DEFAULT 'confirmed'
                 CHECK (status IN ('confirmed', 'checked_in', 'cancelled')),

  -- Check-in no dia
  checked_in_at  timestamptz,
  checked_in_by  text,                        -- 'admin' ou 'operador:<unit_id>'

  -- Aquisição
  origem         text NOT NULL DEFAULT 'lp-desafio-esteiras',
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_content    text,
  utm_term       text,
  referral       text,

  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Unicidade ----------------------------------------------------------------
-- CPF é único DENTRO deste evento (a tabela é exclusiva do evento, então um
-- índice único simples já garante a regra). Cancelados continuam ocupando o CPF
-- de propósito: reinscrição passa pelo time, não por um novo formulário.
CREATE UNIQUE INDEX IF NOT EXISTS dst_registrations_cpf_key
  ON evolve_treadmill_event_registrations (cpf);

CREATE UNIQUE INDEX IF NOT EXISTS dst_registrations_ticket_code_key
  ON evolve_treadmill_event_registrations (ticket_code);

CREATE UNIQUE INDEX IF NOT EXISTS dst_registrations_ticket_token_key
  ON evolve_treadmill_event_registrations (ticket_token);

-- 3. Índices de consulta ------------------------------------------------------
CREATE INDEX IF NOT EXISTS dst_registrations_unit_idx
  ON evolve_treadmill_event_registrations (unit_id);

CREATE INDEX IF NOT EXISTS dst_registrations_created_idx
  ON evolve_treadmill_event_registrations (created_at DESC);

CREATE INDEX IF NOT EXISTS dst_registrations_status_idx
  ON evolve_treadmill_event_registrations (status);

CREATE INDEX IF NOT EXISTS dst_registrations_unit_status_idx
  ON evolve_treadmill_event_registrations (unit_id, status);

CREATE INDEX IF NOT EXISTS dst_registrations_email_idx
  ON evolve_treadmill_event_registrations (email);

CREATE INDEX IF NOT EXISTS dst_registrations_phone_idx
  ON evolve_treadmill_event_registrations (phone);

-- Busca por nome no balcão de check-in (case/acento-insensitive via unaccent
-- não está garantido em todo projeto, então indexamos o nome em minúsculo).
CREATE INDEX IF NOT EXISTS dst_registrations_name_lower_idx
  ON evolve_treadmill_event_registrations (lower(full_name));

-- 4. RLS ----------------------------------------------------------------------
-- Ligada e SEM policy: a anon key não lê nem escreve nada. Todo acesso passa
-- pelas rotas /api/desafio-esteiras/*, que usam a service-role (bypassa RLS).
ALTER TABLE evolve_treadmill_event_registrations ENABLE ROW LEVEL SECURITY;

-- 5. Consistência do check-in -------------------------------------------------
-- Garante que `checked_in` sempre tenha carimbo de hora — evita ticket marcado
-- como usado sem registro de quando.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dst_checkin_coerente'
  ) THEN
    ALTER TABLE evolve_treadmill_event_registrations
      ADD CONSTRAINT dst_checkin_coerente
      CHECK (status <> 'checked_in' OR checked_in_at IS NOT NULL);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Conferência rápida
-- ─────────────────────────────────────────────────────────────────────────────
-- Inscritos por unidade:
--   SELECT unit_id, count(*) FILTER (WHERE status <> 'cancelled') AS inscritos,
--          count(*) FILTER (WHERE status = 'checked_in')          AS check_ins
--     FROM evolve_treadmill_event_registrations
--    GROUP BY unit_id ORDER BY inscritos DESC;
--
-- Últimos inscritos:
--   SELECT full_name, unit_id, ticket_code, created_at
--     FROM evolve_treadmill_event_registrations
--    ORDER BY created_at DESC LIMIT 20;
--
-- Origem/UTM:
--   SELECT coalesce(utm_source, '(direto)') AS fonte, count(*)
--     FROM evolve_treadmill_event_registrations
--    GROUP BY 1 ORDER BY 2 DESC;
