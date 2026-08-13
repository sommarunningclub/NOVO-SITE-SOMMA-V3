-- ═════════════════════════════════════════════════════════════════════════════
-- DESAFIO DAS ESTEIRAS — COMPETIDORES, CATEGORIA E FOTO DE PERFIL
--
-- Rodar DEPOIS de:
--   1) scripts/desafio-esteiras-migration.sql
--   2) scripts/desafio-esteiras-integracao-gestao.sql
--
-- No SQL Editor do Supabase de PRODUÇÃO. Seguro de re-rodar.
--
-- O que muda
-- ──────────
-- A inscrição passa a registrar sexo (que define a categoria da disputa),
-- se a pessoa vai competir ou assistir, e uma foto de perfil opcional.
-- Só quem escolheu competir aparece na grade pública da home.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Novas colunas
--    `sexo` é nullable de propósito: as inscrições feitas antes desta migration
--    não têm o dado, e inventar um valor para elas seria pior do que deixar
--    vazio. Quem está sem sexo simplesmente não entra na grade de competidores.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE evolve_treadmill_event_registrations
  ADD COLUMN IF NOT EXISTS sexo text
    CHECK (sexo IS NULL OR sexo IN ('masculino', 'feminino'));

ALTER TABLE evolve_treadmill_event_registrations
  ADD COLUMN IF NOT EXISTS participacao text NOT NULL DEFAULT 'competidor'
    CHECK (participacao IN ('competidor', 'espectador'));

-- Caminho do arquivo dentro do bucket `desafio-esteiras-perfis`.
-- Guardamos o caminho, não a URL: se o domínio do storage mudar, nada quebra.
ALTER TABLE evolve_treadmill_event_registrations
  ADD COLUMN IF NOT EXISTS foto_path text;

-- Momento da última alteração feita pelo próprio participante.
ALTER TABLE evolve_treadmill_event_registrations
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz;

COMMENT ON COLUMN evolve_treadmill_event_registrations.sexo IS
  'Define a categoria da disputa (masculino/feminino). NULL nas inscrições anteriores à migration.';
COMMENT ON COLUMN evolve_treadmill_event_registrations.participacao IS
  'competidor aparece na grade pública da home; espectador conta no total mas não é exibido.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Índices para a grade pública
--    A home consulta "competidores de tal unidade, de tal categoria".
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS dst_registrations_grade_idx
  ON evolve_treadmill_event_registrations (unit_id, sexo, status)
  WHERE participacao = 'competidor';

CREATE INDEX IF NOT EXISTS dst_registrations_participacao_idx
  ON evolve_treadmill_event_registrations (participacao);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Bucket das fotos de perfil
--    Público: a foto vai ser exibida na home para qualquer visitante, então
--    URL assinada só adicionaria complexidade sem ganho real de privacidade.
--    A escrita continua restrita — o upload passa pela rota /api/desafio-esteiras/foto,
--    que usa a service-role, valida tipo e tamanho e gera o nome do arquivo.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'desafio-esteiras-perfis',
  'desafio-esteiras-perfis',
  true,
  3145728, -- 3 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = true,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Leitura pública das fotos; escrita/remoção só pela service-role (sem policy).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname = 'dst_perfis_leitura_publica'
  ) THEN
    CREATE POLICY dst_perfis_leitura_publica ON storage.objects
      FOR SELECT USING (bucket_id = 'desafio-esteiras-perfis');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. O espelho na gestão passa a levar o sexo
--    A tabela `checkins` já tem a coluna `sexo`; basta o trigger preenchê-la.
--    Recriamos a função inteira (CREATE OR REPLACE) com a linha nova.
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
      nome_completo, cpf, email, telefone, pelotao, sexo,
      data_hora_checkin, validacao_do_checkin, validated, validated_at,
      status, event
    ) VALUES (
      NEW.evento_id, v_evento.titulo, v_evento.data_evento,
      NEW.full_name, NEW.cpf, NEW.email, NEW.phone,
      dst_unidade_label(NEW.unit_id), NEW.sexo,
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
      sexo                 = NEW.sexo,
      validacao_do_checkin = v_validado,
      validated            = v_validado,
      validated_at         = NEW.checked_in_at,
      status               = CASE WHEN NEW.status = 'cancelled' THEN 'cancelado' ELSE 'ativo' END,
      event                = NEW.ticket_code
    WHERE id = v_checkin;
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[dst] falha ao espelhar inscrição % em checkins: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Reaplica o espelho com o sexo nas inscrições já existentes.
UPDATE evolve_treadmill_event_registrations
   SET evento_id = evento_id
 WHERE evento_id IS NOT NULL;

-- ═════════════════════════════════════════════════════════════════════════════
-- Conferência
-- ═════════════════════════════════════════════════════════════════════════════
-- Grade pública, como a home monta:
--   SELECT unit_id, sexo, count(*)
--     FROM evolve_treadmill_event_registrations
--    WHERE participacao = 'competidor' AND status <> 'cancelled' AND sexo IS NOT NULL
--    GROUP BY unit_id, sexo ORDER BY unit_id, sexo;
--
-- Total por unidade, separando quem compete de quem assiste:
--   SELECT unit_id,
--          count(*)                                          AS total,
--          count(*) FILTER (WHERE participacao = 'competidor') AS competidores,
--          count(*) FILTER (WHERE participacao = 'espectador') AS espectadores,
--          count(*) FILTER (WHERE foto_path IS NOT NULL)       AS com_foto
--     FROM evolve_treadmill_event_registrations
--    WHERE status <> 'cancelled'
--    GROUP BY unit_id ORDER BY total DESC;
--
-- Inscrições anteriores à migration (sem sexo definido):
--   SELECT full_name, ticket_code, created_at
--     FROM evolve_treadmill_event_registrations WHERE sexo IS NULL;
