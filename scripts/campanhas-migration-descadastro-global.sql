-- ─────────────────────────────────────────────────────────────────────────────
-- Descadastro global (parte 3) — corrige um furo antes da 2ª campanha existir.
--
-- Até aqui, `campanha_contatos.descadastrado_em` vivia numa linha por
-- (campanha, email). Com uma campanha só isso nunca deu problema, mas ao abrir
-- a segunda (Desafio das Esteiras) o furo apareceria na prática: a pessoa que
-- pediu para sair da Evolve tem uma linha DIFERENTE na campanha nova (mesma
-- UNIQUE (campanha,email), chave diferente), e essa linha nasce com
-- descadastrado_em NULL — a pessoa voltaria a receber e-mail depois de ter
-- pedido pra sair. Não é o que "descadastrar" quer dizer para quem clicou.
--
-- A partir daqui o e-mail é a chave da decisão, não a linha da campanha.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS descadastros_globais (
  email             text PRIMARY KEY,
  descadastrado_em  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE descadastros_globais ENABLE ROW LEVEL SECURITY;

-- Migra quem já tinha pedido pra sair (hoje só existe a campanha Evolve).
INSERT INTO descadastros_globais (email, descadastrado_em)
SELECT email, descadastrado_em
FROM campanha_contatos
WHERE descadastrado_em IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Conferência
SELECT count(*) AS descadastros_migrados FROM descadastros_globais;
