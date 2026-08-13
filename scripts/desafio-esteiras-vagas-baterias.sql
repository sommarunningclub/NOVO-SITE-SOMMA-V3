-- ═════════════════════════════════════════════════════════════════════════════
-- DESAFIO DAS ESTEIRAS — REGRA OFICIAL DE VAGAS E BATERIAS
--
-- Rodar DEPOIS de:
--   1) scripts/desafio-esteiras-migration.sql
--   2) scripts/desafio-esteiras-integracao-gestao.sql
--   3) scripts/desafio-esteiras-competidores.sql
--
-- No SQL Editor do Supabase de PRODUÇÃO. Seguro de re-rodar.
--
-- A REGRA
-- ───────
--   4 esteiras por unidade → 4 competidores por bateria
--   3 baterias por categoria → 12 vagas por categoria
--   12 feminino + 12 masculino → 24 por unidade
--   24 × 4 unidades → 96 no total
--
-- Esta migration NÃO é só documentação: ela transforma a regra em restrição do
-- banco. O frontend mostra as vagas e a API confere antes de gravar, mas quem
-- garante que nunca existirão 13 confirmadas na mesma categoria é o trigger
-- abaixo — é a única camada que sobrevive a duas pessoas clicando ao mesmo
-- tempo na última vaga.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Bateria do competidor
--    Nula na inscrição: a pessoa garante a vaga primeiro; a organização
--    distribui as baterias depois, pelo admin.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE evolve_treadmill_event_registrations
  ADD COLUMN IF NOT EXISTS heat_number smallint
    CHECK (heat_number IS NULL OR heat_number BETWEEN 1 AND 3);

COMMENT ON COLUMN evolve_treadmill_event_registrations.heat_number IS
  'Bateria (1..3) dentro da categoria na unidade. NULL enquanto a organização não distribuir.';

CREATE INDEX IF NOT EXISTS dst_registrations_bateria_idx
  ON evolve_treadmill_event_registrations (unit_id, sexo, heat_number)
  WHERE participacao = 'competidor' AND status <> 'cancelled';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Parâmetros da competição
--    Uma função só, para os limites não se espalharem pelo schema. Se um dia a
--    regra mudar, muda aqui e no event.config.ts — nos dois lugares, de propósito:
--    o banco não deve depender do deploy da aplicação para continuar correto.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dst_vagas_por_categoria() RETURNS integer
LANGUAGE sql IMMUTABLE AS $$ SELECT 12 $$;

CREATE OR REPLACE FUNCTION dst_por_bateria() RETURNS integer
LANGUAGE sql IMMUTABLE AS $$ SELECT 4 $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Trava de capacidade — a garantia real contra corrida
--
--    `pg_advisory_xact_lock` serializa, dentro da transação, todo mundo que
--    disputa a MESMA (unidade, categoria). Duas inscrições simultâneas para a
--    última vaga viram duas transações em fila: a primeira conta 11, entra e
--    vira 12; a segunda só consegue o lock depois do commit, conta 12 e é
--    recusada. Sem o lock, as duas contariam 11 e ambas entrariam.
--
--    O lock é por chave (hash da unidade+categoria), então inscrições em
--    unidades ou categorias diferentes não esperam umas pelas outras.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dst_travar_capacidade()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_ocupadas integer;
  v_limite   integer := dst_vagas_por_categoria();
  v_na_bateria integer;
BEGIN
  -- Bateria é lugar em esteira: quem não compete não ocupa nenhuma. Limpamos em
  -- vez de recusar — assim virar espectador (ou cancelar) libera a bateria
  -- sozinho, sem a organização ter de lembrar de tirar a pessoa da grade.
  IF NEW.participacao <> 'competidor' OR NEW.status = 'cancelled' THEN
    NEW.heat_number := NULL;
  END IF;

  -- Só competidor ativo ocupa vaga. Espectador e cancelado não entram na conta.
  IF NEW.participacao <> 'competidor' OR NEW.status = 'cancelled' OR NEW.sexo IS NULL THEN
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

  -- Serializa quem disputa esta mesma (unidade, categoria).
  PERFORM pg_advisory_xact_lock(hashtext(NEW.unit_id || ':' || NEW.sexo));

  SELECT count(*) INTO v_ocupadas
    FROM evolve_treadmill_event_registrations
   WHERE unit_id = NEW.unit_id
     AND sexo = NEW.sexo
     AND participacao = 'competidor'
     AND status <> 'cancelled'
     AND id <> NEW.id;  -- não contar a própria linha ao atualizar

  IF v_ocupadas >= v_limite THEN
    RAISE EXCEPTION 'DST_CATEGORIA_ESGOTADA: % / % na unidade % (%)',
      v_ocupadas, v_limite, NEW.unit_id, NEW.sexo
      USING ERRCODE = 'check_violation';
  END IF;

  -- Bateria, quando informada: no máximo 4 (uma por esteira).
  IF NEW.heat_number IS NOT NULL THEN
    SELECT count(*) INTO v_na_bateria
      FROM evolve_treadmill_event_registrations
     WHERE unit_id = NEW.unit_id
       AND sexo = NEW.sexo
       AND heat_number = NEW.heat_number
       AND participacao = 'competidor'
       AND status <> 'cancelled'
       AND id <> NEW.id;

    IF v_na_bateria >= dst_por_bateria() THEN
      RAISE EXCEPTION 'DST_BATERIA_CHEIA: bateria % da categoria % em % já tem % competidores',
        NEW.heat_number, NEW.sexo, NEW.unit_id, v_na_bateria
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dst_capacidade ON evolve_treadmill_event_registrations;
CREATE TRIGGER dst_capacidade
  BEFORE INSERT OR UPDATE ON evolve_treadmill_event_registrations
  FOR EACH ROW EXECUTE FUNCTION dst_travar_capacidade();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Visão de ocupação — o que a LP, a API e o admin leem
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW dst_vagas AS
SELECT
  u.unit_id,
  u.sexo,
  dst_vagas_por_categoria() AS total,
  count(r.id)               AS ocupadas,
  dst_vagas_por_categoria() - count(r.id) AS restantes,
  count(r.id) FILTER (WHERE r.heat_number = 1) AS bateria_1,
  count(r.id) FILTER (WHERE r.heat_number = 2) AS bateria_2,
  count(r.id) FILTER (WHERE r.heat_number = 3) AS bateria_3,
  count(r.id) FILTER (WHERE r.heat_number IS NULL) AS sem_bateria
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
-- Ocupação por unidade e categoria (o que a LP mostra):
--   SELECT * FROM dst_vagas ORDER BY unit_id, sexo;
--
-- Total geral (tem que caber em 96):
--   SELECT sum(ocupadas) AS competidores, sum(total) AS vagas FROM dst_vagas;
--
-- Teste da trava (deve falhar com DST_CATEGORIA_ESGOTADA na 13ª):
--   -- rode 13 inserts na mesma unidade+categoria e veja a última ser recusada
--
-- Quem ainda está sem bateria:
--   SELECT unit_id, sexo, count(*) FROM evolve_treadmill_event_registrations
--    WHERE participacao = 'competidor' AND status <> 'cancelled' AND heat_number IS NULL
--    GROUP BY 1,2;
