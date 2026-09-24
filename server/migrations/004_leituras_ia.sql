-- Quantas leituras de documento por IA a conta já consumiu.
--
-- Cada leitura custa uma chamada paga à Anthropic, então a conta ganha uma
-- gratuita e daí em diante o uso é pago. O LIMITE não mora aqui de propósito:
-- por enquanto é uma constante do código (lib/limites.ts). Quando existirem
-- planos, o limite passa a vir do plano da conta -- e aí esta coluna continua
-- sendo o contador, sem precisar de mudança.
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS leituras_ia_usadas INTEGER NOT NULL DEFAULT 0;
