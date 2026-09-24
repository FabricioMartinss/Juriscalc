-- Pedidos de redefinição de senha ("esqueci minha senha").
--
-- Guarda só o HASH do token (SHA-256), nunca o token em si: se este banco
-- vazar, os hashes não servem para redefinir senha nenhuma -- mesma razão pela
-- qual `usuarios.senha_hash` existe em vez da senha.
--
-- SHA-256 e não bcrypt aqui de propósito. O token é gerado aleatório com 32
-- bytes de entropia, então não há o que uma função lenta proteja (não existe
-- "token fraco" para adivinhar por força bruta), e um hash determinístico
-- permite achar a linha por índice -- com bcrypt seria varredura da tabela.
CREATE TABLE IF NOT EXISTS recuperacoes_senha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  -- Uso único: preenchido quando a senha é trocada. A linha fica no lugar em
  -- vez de ser apagada, para que reusar o mesmo link dê "link já usado".
  usado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recuperacoes_token_hash ON recuperacoes_senha (token_hash);
CREATE INDEX IF NOT EXISTS idx_recuperacoes_usuario ON recuperacoes_senha (usuario_id);
