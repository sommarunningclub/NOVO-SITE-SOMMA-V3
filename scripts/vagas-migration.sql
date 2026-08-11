-- ─────────────────────────────────────────────────────────────────────────────
-- Trabalhe Conosco (/trabalhe-conosco-vagas) — candidaturas + currículos
-- Rodar no SQL editor do Supabase de PRODUÇÃO (o mesmo da gestão/assessoria).
-- Seguro de re-rodar (IF NOT EXISTS / ON CONFLICT).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabela de candidaturas ---------------------------------------------------
CREATE TABLE IF NOT EXISTS candidatos_vagas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em       timestamptz NOT NULL DEFAULT now(),

  -- Vaga (a fonte é app/trabalhe-conosco-vagas/_vagas.ts)
  vaga_slug       text NOT NULL,
  vaga_titulo     text NOT NULL,

  -- Candidato
  nome            text NOT NULL,
  email           text NOT NULL,
  telefone        text NOT NULL,
  data_nascimento date,

  -- Endereço (CEP digitado; o resto vem da BrasilAPI)
  cep             text,
  logradouro      text,
  bairro          text,
  cidade          text,
  estado          text,
  complemento     text,

  -- Formação
  instituicao     text NOT NULL,
  semestre        text NOT NULL,

  -- Currículo: caminho dentro do bucket privado `curriculos`.
  -- O arquivo NÃO é público — gere URL assinada para ler.
  curriculo_path  text,
  curriculo_nome  text,

  -- Triagem
  status          text NOT NULL DEFAULT 'novo',
  observacoes     text,
  origem          text NOT NULL DEFAULT 'site'
);

CREATE INDEX IF NOT EXISTS candidatos_vagas_vaga_idx      ON candidatos_vagas (vaga_slug);
CREATE INDEX IF NOT EXISTS candidatos_vagas_criado_em_idx ON candidatos_vagas (criado_em DESC);
CREATE INDEX IF NOT EXISTS candidatos_vagas_status_idx    ON candidatos_vagas (status);
CREATE INDEX IF NOT EXISTS candidatos_vagas_email_idx     ON candidatos_vagas (email);

-- 2. RLS ----------------------------------------------------------------------
-- Ligada e SEM policy: nenhum acesso via anon key. A gravação acontece só pela
-- rota /api/trabalhe-conosco, que usa a service-role (bypassa RLS).
ALTER TABLE candidatos_vagas ENABLE ROW LEVEL SECURITY;

-- 3. Bucket privado dos currículos -------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'curriculos',
  'curriculos',
  false,
  5242880, -- 5 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public             = false,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Sem policies em storage.objects para este bucket: leitura e escrita só pela
-- service-role. Para baixar um currículo, use o painel do Supabase ou uma URL
-- assinada (a rota já envia uma no e-mail de aviso do time).

-- ─────────────────────────────────────────────────────────────────────────────
-- Conferência rápida
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT nome, email, vaga_titulo, semestre, criado_em
--   FROM candidatos_vagas ORDER BY criado_em DESC LIMIT 20;
