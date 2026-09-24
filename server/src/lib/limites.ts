/**
 * Limites de uso das funcionalidades pagas.
 *
 * Compartilhado entre quem cobra o limite (routes/documentos.ts) e quem o
 * mostra ao usuário (routes/auth.ts, via `paraUsuarioPublico`) — os dois
 * precisam dizer o mesmo número.
 */

/**
 * Leituras de documento por IA que toda conta ganha ao se cadastrar.
 *
 * Quando existirem planos, este passa a ser o limite do plano gratuito e os
 * demais virão do plano da conta; o contador em `usuarios.leituras_ia_usadas`
 * segue igual.
 */
export const LEITURAS_IA_GRATUITAS = 1;
