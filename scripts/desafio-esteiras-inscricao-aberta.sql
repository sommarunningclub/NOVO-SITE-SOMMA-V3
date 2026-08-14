-- ═════════════════════════════════════════════════════════════════════════════
-- DESAFIO DAS ESTEIRAS — INSCRIÇÃO ABERTA
--
-- Rodar DEPOIS de scripts/desafio-esteiras-vagas-baterias.sql, no SQL Editor
-- do Supabase de PRODUÇÃO. Seguro de re-rodar.
--
-- O QUE MUDA
-- ──────────
-- O teto de 12 competidores por categoria acabou: quem quiser competir,
-- compete. O que continua finito são as 4 esteiras, então uma bateria segue
-- levando 4 pessoas e a organização monta quantas forem precisas.
--
--   antes:  4 esteiras × 3 baterias = 12 vagas por categoria (teto rígido)
--   agora:  inscritos ÷ 4 esteiras  = baterias necessárias  (grade elástica)
--
-- Ficam de pé, porque continuam sendo verdade física:
--   • no máximo 4 pessoas por bateria (uma por esteira);
--   • quem não compete não ocupa esteira nenhuma.
--
-- Some a trava que recusava a 13ª inscrição. Nada é apagado: as inscrições
-- existentes seguem intactas, com a mesma bateria.
-- ═════════════════════════════════════════════════════════════════════════════

-- 1. Bateria deixa de ser 1..3
--    A grade cresce com a procura, então o CHECK antigo (BETWEEN 1 AND 3)
--    barraria a bateria 4 de uma categoria com 13 inscritos. O teto novo é só
--    um limite de sanidade, não uma regra do evento.
ALTER TABLE evolve_treadmill_event_registrations
  DROP CONSTRAINT IF EXISTS evolve_treadmill_event_registrations_heat_number_check;

ALTER TABLE evolve_treadmill_event_registrations
  ADD CONSTRAINT evolve_treadmill_event_registrations_heat_number_check
  CHECK (heat_number IS NULL OR (heat_number >= 1 AND heat_number <= 60));

COMMENT ON COLUMN evolve_treadmill_event_registrations.heat_number IS
  'Bateria dentro da categoria na unidade. Sem número fixo: a grade cresce com as inscrições. NULL enquanto a organização não distribuir.';

-- 2. Parâmetros
--    `dst_vagas_por_categoria` deixa de existir: não há vaga por categoria.
--    `dst_por_bateria` fica, porque a esteira continua sendo o limite real.
DROP FUNCTION IF EXISTS dst_vagas_por_categoria();

CREATE OR REPLACE FUNCTION dst_por_bateria() RETURNS integer
LANGUAGE sql IMMUTABLE AS $$ SELECT 4 $$;

-- 3. Trigger: sai a trava de categoria, fica a da esteira
--
--    Mantemos o advisory lock. Ele agora serializa apenas quem disputa a MESMA
--    bateria, que é onde ainda existe uma corrida real: dois operadores
--    colocando gente na mesma bateria ao mesmo tempo poderiam passar de 4 sem
--    ele. Sem bateria informada não há o que travar, e a inscrição pública
--    (que nunca escolhe bateria) deixa de tocar em lock nenhum.
CREATE OR REPLACE FUNCTION dst_travar_capacidade()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_na_bateria integer;
BEGIN
  -- Bateria é lugar em esteira: quem não compete não ocupa nenhuma. Limpamos em
  -- vez de recusar, para virar espectador (ou cancelar) liberar a esteira
  -- sozinho, sem a organização ter de lembrar de tirar a pessoa da grade.
  IF NEW.participacao <> 'competidor' OR NEW.status = 'cancelled' THEN
    NEW.heat_number := NULL;
  END IF;

  -- Sem bateria informada, nada a verificar: a inscrição é aberta.
  IF NEW.heat_number IS NULL THEN
    RETURN NEW;
  END IF;

  -- Nada mudou no que importa? Não precisa travar nada.
  IF TG_OP = 'UPDATE'
     AND OLD.unit_id = NEW.unit_id
     AND OLD.sexo IS NOT DISTINCT FROM NEW.sexo
     AND OLD.participacao = NEW.participacao
     AND OLD.status = NEW.status
     AND OLD.heat_number IS NOT DISTINCT FROM NEW.heat_number
  THEN
    RETURN NEW;
  END IF;

  -- Serializa quem disputa esta mesma (unidade, categoria, bateria).
  PERFORM pg_advisory_xact_lock(
    hashtext(NEW.unit_id || ':' || coalesce(NEW.sexo, '?') || ':' || NEW.heat_number)
  );

  SELECT count(*) INTO v_na_bateria
    FROM evolve_treadmill_event_registrations
   WHERE unit_id = NEW.unit_id
     AND sexo IS NOT DISTINCT FROM NEW.sexo
     AND heat_number = NEW.heat_number
     AND participacao = 'competidor'
     AND status <> 'cancelled'
     AND id <> NEW.id;

  IF v_na_bateria >= dst_por_bateria() THEN
    RAISE EXCEPTION 'DST_BATERIA_CHEIA: bateria % da categoria % em % já tem % competidores',
      NEW.heat_number, NEW.sexo, NEW.unit_id, v_na_bateria
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dst_capacidade ON evolve_treadmill_event_registrations;
CREATE TRIGGER dst_capacidade
  BEFORE INSERT OR UPDATE ON evolve_treadmill_event_registrations
  FOR EACH ROW EXECUTE FUNCTION dst_travar_capacidade();

-- 4. A visão deixa de contar vaga e passa a contar adesão
DROP VIEW IF EXISTS dst_vagas;

CREATE OR REPLACE VIEW dst_grade AS
SELECT
  u.unit_id,
  u.sexo,
  count(r.id)                                   AS inscritos,
  ceil(count(r.id)::numeric / dst_por_bateria())::int AS baterias_necessarias,
  count(r.id) FILTER (WHERE r.heat_number IS NULL)    AS sem_bateria,
  max(r.heat_number)                            AS maior_bateria_usada
FROM (
  SELECT unnest(ARRAY['vicente-pires','luziania','alameda','samambaia']) AS unit_id,
         unnest_sexo AS sexo
    FROM unnest(ARRAY['feminino','masculino']) AS unnest_sexo
) u
LEFT JOIN evolve_treadmill_event_registrations r
  ON r.unit_id = u.unit_id
 AND r.sexo = u.sexo
 AND r.participacao = 'competidor'
 AND r.status <> 'cancelled'
GROUP BY u.unit_id, u.sexo;

-- ═════════════════════════════════════════════════════════════════════════════
-- Conferência
-- ═════════════════════════════════════════════════════════════════════════════
-- Como está a grade hoje:
--   SELECT * FROM dst_grade ORDER BY unit_id, sexo;
--
-- A trava de categoria sumiu? (não deve aparecer DST_CATEGORIA_ESGOTADA)
--   SELECT prosrc FROM pg_proc WHERE proname = 'dst_travar_capacidade';
--
-- A trava de bateria continua de pé? (deve falhar na 5ª pessoa da mesma bateria)
--   -- coloque 5 competidores na mesma unidade+categoria+bateria e veja recusar
