import jwt from 'jsonwebtoken';
import type { CookieOptions, Request } from 'express';

// Função em vez de constante de módulo: o TypeScript não propaga o
// estreitamento de tipo do `throw` acima para dentro das closures abaixo.
function segredo(): string {
  const valor = process.env.JWT_SECRET;
  if (!valor) throw new Error('JWT_SECRET não configurado.');
  return valor;
}

export const NOME_COOKIE = 'juriscalcsp_sessao';
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export function opcoesCookie(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: DURACAO_MS,
  };
}

export function assinarSessao(usuarioId: string): string {
  return jwt.sign({ sub: usuarioId }, segredo(), { expiresIn: '30d' });
}

export function usuarioIdDaRequisicao(req: Request): string | null {
  const token = req.cookies?.[NOME_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, segredo());
    if (typeof payload === 'object' && typeof payload.sub === 'string') {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
}
