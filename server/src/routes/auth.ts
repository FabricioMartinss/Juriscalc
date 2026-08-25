import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { assinarSessao, opcoesCookie, NOME_COOKIE, usuarioIdDaRequisicao } from '../lib/sessao.js';
import { cadastroSchema, loginSchema } from '../lib/validacao.js';
import { asyncRota } from '../lib/asyncRota.js';

export const authRouter = Router();

// Limita tentativa de login/cadastro por IP — é o ponto mais visado num login
// caseiro (força bruta de senha, enumeração de email).
const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

interface LinhaUsuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  oab_numero: string;
  oab_uf: string;
}

function paraUsuarioPublico(linha: LinhaUsuario) {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    telefone: linha.telefone,
    oabNumero: linha.oab_numero,
    oabUf: linha.oab_uf,
  };
}

authRouter.post(
  '/cadastro',
  limitadorAuth,
  asyncRota(async (req, res) => {
    const corpo = cadastroSchema.safeParse(req.body);
    if (!corpo.success) {
      res.status(400).json({ erro: corpo.error.issues[0]?.message ?? 'Dados inválidos.' });
      return;
    }
    const { nome, email, telefone, oabNumero, oabUf, senha } = corpo.data;

    const existente = await pool.query(
      'SELECT 1 FROM usuarios WHERE email = $1 OR (oab_numero = $2 AND oab_uf = $3)',
      [email, oabNumero, oabUf],
    );
    if (existente.rowCount) {
      res.status(409).json({ erro: 'Já existe uma conta com este email ou OAB.' });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const resultado = await pool.query<LinhaUsuario>(
      `INSERT INTO usuarios (nome, email, telefone, oab_numero, oab_uf, senha_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, email, telefone, oab_numero, oab_uf`,
      [nome, email, telefone, oabNumero, oabUf, senhaHash],
    );
    const usuario = resultado.rows[0];
    res.cookie(NOME_COOKIE, assinarSessao(usuario.id), opcoesCookie());
    res.status(201).json({ usuario: paraUsuarioPublico(usuario) });
  }),
);

authRouter.post(
  '/login',
  limitadorAuth,
  asyncRota(async (req, res) => {
    const corpo = loginSchema.safeParse(req.body);
    if (!corpo.success) {
      res.status(400).json({ erro: corpo.error.issues[0]?.message ?? 'Dados inválidos.' });
      return;
    }
    const { email, senha } = corpo.data;

    const resultado = await pool.query<LinhaUsuario & { senha_hash: string }>(
      'SELECT id, nome, email, telefone, oab_numero, oab_uf, senha_hash FROM usuarios WHERE email = $1',
      [email],
    );
    const linha = resultado.rows[0];

    // Mensagem genérica nos dois casos (usuário não existe / senha errada) —
    // não dar pista de qual email já tem conta.
    if (!linha || !(await bcrypt.compare(senha, linha.senha_hash))) {
      res.status(401).json({ erro: 'Email ou senha incorretos.' });
      return;
    }

    res.cookie(NOME_COOKIE, assinarSessao(linha.id), opcoesCookie());
    res.status(200).json({ usuario: paraUsuarioPublico(linha) });
  }),
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(NOME_COOKIE, opcoesCookie());
  res.status(204).end();
});

authRouter.get(
  '/me',
  asyncRota(async (req, res) => {
    const usuarioId = usuarioIdDaRequisicao(req);
    if (!usuarioId) {
      res.status(401).json({ erro: 'Não autenticado.' });
      return;
    }

    const resultado = await pool.query<LinhaUsuario>(
      'SELECT id, nome, email, telefone, oab_numero, oab_uf FROM usuarios WHERE id = $1',
      [usuarioId],
    );
    const linha = resultado.rows[0];
    if (!linha) {
      res.status(401).json({ erro: 'Não autenticado.' });
      return;
    }

    res.status(200).json({ usuario: paraUsuarioPublico(linha) });
  }),
);
