-- Fechamento da plataforma: cadastro deixa de ser aberto ao público e passa a
-- exigir que o e-mail esteja nesta lista antes de criar conta -- ver o uso em
-- server/src/routes/auth.ts (POST /cadastro).
--
-- A lista é alimentada por fora (importação manual de CSV do parceiro, por
-- enquanto -- ver server/src/scripts/importarListaPermitida.ts). Guardar aqui
-- e não como uma coluna extra em `usuarios` porque o e-mail pode entrar na
-- lista antes de a pessoa nunca ter se cadastrado.
CREATE TABLE IF NOT EXISTS emails_permitidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  -- De onde veio a liberação (ex.: "parceiro-oab-conecta"), só para auditoria
  -- -- não afeta nada na aplicação.
  origem TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Preenchido quando o e-mail é de fato usado num cadastro -- distingue
  -- "liberado mas nunca veio" de "já é conta" sem precisar cruzar com
  -- `usuarios` toda vez.
  usado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emails_permitidos_email ON emails_permitidos (email);
