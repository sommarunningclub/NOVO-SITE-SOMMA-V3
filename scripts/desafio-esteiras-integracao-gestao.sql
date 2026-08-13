-- ═════════════════════════════════════════════════════════════════════════════
-- DESAFIO DAS ESTEIRAS × SISTEMA DE EVENTOS DA GESTÃO
--
-- Liga a LP /desafios-das-esteiras-evolve ao módulo de eventos do
-- v0-sistema-somma-de-gestao-l7 (tabelas `eventos` e `checkins`).
--
-- Rodar DEPOIS de scripts/desafio-esteiras-migration.sql, no SQL Editor do
-- Supabase de PRODUÇÃO. Seguro de re-rodar.
--
-- Como funciona
-- ─────────────
-- `evolve_treadmill_event_registrations` continua sendo a FONTE DA VERDADE do
-- evento (ticket, QR, unidade, UTMs, LGPD). A tabela `checkins` recebe um
-- ESPELHO de cada inscrição, mantido por trigger — é assim que o painel da
-- gestão lista os participantes e conta os check-ins sem precisar de nenhuma
-- alteração no código dela.
--
-- O espelho é bidirecional: validar pelo painel da gestão marca o ticket como
-- usado no Desafio, e validar no scanner do Desafio marca validado na gestão.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. `slug` em eventos
--    O site precisa achar o evento sem UUID chumbado no código. Único quando
--    preenchido; os eventos antigos seguem com slug NULL, sem conflito.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS eventos_slug_key
  ON eventos (slug) WHERE slug IS NOT NULL;

COMMENT ON COLUMN eventos.slug IS
  'Identificador estável do evento para integrações externas (ex.: LPs do site). Opcional.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. O evento no painel da gestão
--    `pelotoes` recebe as quatro unidades: é a subdivisão do evento, e é o que
--    o espelho grava em checkins.pelotao para cada participante.
--    `oculto_no_checkin_publico = true` porque o Desafio tem fluxo próprio de
--    inscrição e check-in — ele não deve aparecer no /check-in público do site.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO eventos (
  slug, titulo, descricao, data_evento, horario_inicio,
  local, local_url, tipo,
  checkin_status, checkin_abertura, checkin_fechamento,
  pelotoes, oculto_no_checkin_publico, transferencia_habilitada, criado_por
)
VALUES (
  'desafio-das-esteiras-2026',
  'Desafio das Esteiras — Evolve + SOMMA Club',
  'Quatro unidades da Evolve, um só desafio, simultaneamente. Inscrição e ticket pela LP do site; check-in pelo scanner de QR do evento.',
  '2026-08-19',
  '19:00',
  'Evolve — Vicente Pires, Luziânia, Alameda e Samambaia',
  'https://sommaclub.com.br/desafios-das-esteiras-evolve',
  'personalizado',
  'bloqueado',                              -- a gestão abre no dia
  '2026-08-19 18:00:00-03',
  '2026-08-19 22:30:00-03',
  ARRAY['Evolve Vicente Pires', 'Evolve Luziânia', 'Evolve Alameda', 'Evolve Samambaia'],
  true,
  false,                                    -- transferência de inscrição não habilitada
  'integracao-site'
)
-- O predicado precisa ser repetido: `eventos_slug_key` é um índice único
-- PARCIAL, e o Postgres não o infere só pela coluna.
ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET
  titulo             = EXCLUDED.titulo,
  descricao          = EXCLUDED.descricao,
  data_evento        = EXCLUDED.data_evento,
  horario_inicio     = EXCLUDED.horario_inicio,
  local              = EXCLUDED.local,
  local_url          = EXCLUDED.local_url,
  tipo               = EXCLUDED.tipo,
  checkin_abertura   = EXCLUDED.checkin_abertura,
  checkin_fechamento = EXCLUDED.checkin_fechamento,
  pelotoes           = EXCLUDED.pelotoes,
  updated_at         = now();
  -- `checkin_status` fica de fora: uma vez aberto pela gestão, re-rodar este
  -- script não pode fechar o check-in no meio do evento.

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Vínculo da inscrição com o evento da gestão
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE evolve_treadmill_event_registrations
  ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id);

CREATE INDEX IF NOT EXISTS dst_registrations_evento_idx
  ON evolve_treadmill_event_registrations (evento_id);

-- Preenche o vínculo nas inscrições que já existirem.
UPDATE evolve_treadmill_event_registrations r
   SET evento_id = e.id
  FROM eventos e
 WHERE e.slug = 'desafio-das-esteiras-2026'
   AND r.evento_id IS DISTINCT FROM e.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Nome legível da unidade
--    Fonte da verdade dos ids: lib/desafio-esteiras/event.config.ts.
--    Mantenha os rótulos iguais aos de `eventos.pelotoes` acima.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dst_unidade_label(p_unit_id text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_unit_id
    WHEN 'vicente-pires' THEN 'Evolve Vicente Pires'
    WHEN 'luziania'      THEN 'Evolve Luziânia'
    WHEN 'alameda'       THEN 'Evolve Alameda'
    WHEN 'samambaia'     THEN 'Evolve Samambaia'
    ELSE p_unit_id
  END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Espelho: Desafio → checkins
--    Toda inscrição vira (ou atualiza) uma linha em `checkins` amarrada ao
--    evento. A reconciliação é por (evento_id, cpf), que é único: o CPF já é
--    único na tabela do Desafio.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dst_espelhar_em_checkins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_evento   RECORD;
  v_checkin  uuid;
  v_validado boolean;
BEGIN
  -- Sem vínculo com a gestão não há o que espelhar.
  IF NEW.evento_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, titulo, data_evento INTO v_evento
    FROM eventos WHERE id = NEW.evento_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_validado := (NEW.status = 'checked_in');

  SELECT id INTO v_checkin
    FROM checkins
   WHERE evento_id = NEW.evento_id AND cpf = NEW.cpf
   LIMIT 1;

  IF v_checkin IS NULL THEN
    INSERT INTO checkins (
      evento_id, nome_do_evento, data_do_evento,
      nome_completo, cpf, email, telefone, pelotao,
      data_hora_checkin, validacao_do_checkin, validated, validated_at,
      status, event
    ) VALUES (
      NEW.evento_id, v_evento.titulo, v_evento.data_evento,
      NEW.full_name, NEW.cpf, NEW.email, NEW.phone,
      dst_unidade_label(NEW.unit_id),
      NEW.created_at, v_validado, v_validado, NEW.checked_in_at,
      CASE WHEN NEW.status = 'cancelled' THEN 'cancelado' ELSE 'ativo' END,
      NEW.ticket_code
    );
  ELSE
    UPDATE checkins SET
      nome_completo        = NEW.full_name,
      email                = NEW.email,
      telefone             = NEW.phone,
      pelotao              = dst_unidade_label(NEW.unit_id),
      validacao_do_checkin = v_validado,
      validated            = v_validado,
      validated_at         = NEW.checked_in_at,
      status               = CASE WHEN NEW.status = 'cancelled' THEN 'cancelado' ELSE 'ativo' END,
      event                = NEW.ticket_code
    WHERE id = v_checkin;
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- O espelho é conveniência operacional. Se ele falhar, a pessoa ainda assim
  -- se inscreveu e tem ticket válido — não derrubamos a inscrição por isso.
  RAISE WARNING '[dst] falha ao espelhar inscrição % em checkins: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dst_sync_checkins ON evolve_treadmill_event_registrations;
CREATE TRIGGER dst_sync_checkins
  AFTER INSERT OR UPDATE ON evolve_treadmill_event_registrations
  FOR EACH ROW EXECUTE FUNCTION dst_espelhar_em_checkins();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Espelho reverso: checkins → Desafio
--    Validar um participante pelo painel da gestão marca o ticket como usado no
--    Desafio (e a página do ticket passa a mostrar "CHECK-IN REALIZADO").
--
--    A recursão morre sozinha: cada lado só escreve quando o valor REALMENTE
--    difere, então o trigger oposto não encontra mais nada para mudar.
-- ─────────────────────────────────────────────────────────────────────────────
--    Este trigger vive em `checkins`, que é a tabela dos treinos de sábado
--    também. Ele sai na primeira linha para qualquer check-in que não seja do
--    Desafio, e qualquer erro é engolido com WARNING: a operação semanal da
--    gestão não pode quebrar por causa desta integração.
CREATE OR REPLACE FUNCTION dst_sincronizar_do_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_validado boolean;
  v_quando   timestamptz;
BEGIN
  IF NEW.evento_id IS NULL OR NEW.cpf IS NULL THEN
    RETURN NEW;
  END IF;

  -- Só age em inscrições do Desafio.
  IF NOT EXISTS (
    SELECT 1 FROM evolve_treadmill_event_registrations
     WHERE evento_id = NEW.evento_id AND cpf = NEW.cpf
  ) THEN
    RETURN NEW;
  END IF;

  v_validado := COALESCE(NEW.validated, false) OR COALESCE(NEW.validacao_do_checkin, false);
  v_quando   := COALESCE(NEW.validated_at, now());

  IF NEW.status = 'cancelado' THEN
    UPDATE evolve_treadmill_event_registrations
       SET status = 'cancelled'
     WHERE evento_id = NEW.evento_id AND cpf = NEW.cpf
       AND status IS DISTINCT FROM 'cancelled';

  ELSIF v_validado THEN
    UPDATE evolve_treadmill_event_registrations
       SET status = 'checked_in',
           checked_in_at = COALESCE(checked_in_at, v_quando),
           checked_in_by = COALESCE(checked_in_by, 'gestao')
     WHERE evento_id = NEW.evento_id AND cpf = NEW.cpf
       AND status = 'confirmed';
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[dst] falha ao sincronizar check-in % para o Desafio: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dst_sync_from_checkins ON checkins;
CREATE TRIGGER dst_sync_from_checkins
  AFTER INSERT OR UPDATE ON checkins
  FOR EACH ROW EXECUTE FUNCTION dst_sincronizar_do_checkin();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Backfill: espelha o que já foi inscrito antes de a integração existir
-- ─────────────────────────────────────────────────────────────────────────────
-- Um UPDATE que não muda valor nenhum, só para o trigger AFTER UPDATE rodar em
-- cada linha já existente e criar o espelho correspondente.
UPDATE evolve_treadmill_event_registrations
   SET evento_id = evento_id
 WHERE evento_id IS NOT NULL;

-- ═════════════════════════════════════════════════════════════════════════════
-- Conferência
-- ═════════════════════════════════════════════════════════════════════════════
-- O evento existe e tem id:
--   SELECT id, slug, titulo, data_evento, checkin_status FROM eventos
--    WHERE slug = 'desafio-das-esteiras-2026';
--
-- Inscrições do Desafio × espelho na gestão (os números têm que bater):
--   SELECT
--     (SELECT count(*) FROM evolve_treadmill_event_registrations WHERE status <> 'cancelled') AS no_desafio,
--     (SELECT count(*) FROM checkins c JOIN eventos e ON e.id = c.evento_id
--       WHERE e.slug = 'desafio-das-esteiras-2026' AND c.status = 'ativo')                    AS na_gestao;
--
-- Participantes por unidade, como a gestão enxerga:
--   SELECT c.pelotao, count(*), count(*) FILTER (WHERE c.validated) AS validados
--     FROM checkins c JOIN eventos e ON e.id = c.evento_id
--    WHERE e.slug = 'desafio-das-esteiras-2026'
--    GROUP BY c.pelotao ORDER BY 2 DESC;
