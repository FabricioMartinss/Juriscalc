-- Cadastro de usuários (advogados) da plataforma.
--
-- Guarda só o necessário pra autenticar e identificar a conta. Nenhum dado de
-- processo/PDF passa perto deste banco — isso nunca é persistido em lugar
-- nenhum, por decisão de produto (sigilo profissional).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  oab_numero TEXT NOT NULL,
  oab_uf CHAR(2) NOT NULL,
  senha_hash TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (oab_numero, oab_uf)
);
