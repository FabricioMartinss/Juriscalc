import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { assinarSessao, opcoesCookie, NOME_COOKIE, usuarioIdDaRequisicao } from '../lib/sessao.js';
import {
  cadastroSchema,
  loginSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
} from '../lib/validacao.js';
import { asyncRota } from '../lib/asyncRota.js';
import { enviarEmail } from '../lib/email.js';
import { LEITURAS_IA_GRATUITAS } from '../lib/limites.js';

export const authRouter = Router();

// Limita tentativa de login/cadastro por IP — é o ponto mais visado num login
// caseiro (força bruta de senha, enumeração de email).
const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Mais apertado que o de login: cada pedido válido dispara um e-mail de
// verdade, então serve tanto contra enumeração quanto contra usar a caixa de
// entrada de terceiro como alvo de flood.
const limitadorRecuperacao = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Quanto tempo o link de redefinição vale. */
const VALIDADE_TOKEN_MS = 60 * 60 * 1000; // 1 hora

/**
 * O token vai por e-mail em claro; no banco fica só este hash. SHA-256 basta
 * porque o token já nasce com 32 bytes aleatórios — ver o cabeçalho de
 * migrations/003_recuperacao_senha.sql.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Base do link que vai no e-mail. Sem barra no fim. */
function urlDoSite(): string {
  const explicita = process.env.SITE_URL?.trim();
  if (explicita) return explicita.replace(/\/+$/, '');
  // Sem SITE_URL, usa a primeira origem permitida — em produção é o site.
  const primeira = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',')[0]?.trim();
  return (primeira || 'http://localhost:3000').replace(/\/+$/, '');
}

interface LinhaUsuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  oab_numero: string | null;
  oab_uf: string | null;
  leituras_ia_usadas: number;
}

/** Colunas que `paraUsuarioPublico` espera — uma lista só, para os SELECTs não divergirem. */
const COLUNAS_USUARIO = 'id, nome, email, telefone, oab_numero, oab_uf, leituras_ia_usadas';

function paraUsuarioPublico(linha: LinhaUsuario) {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    telefone: linha.telefone,
    oabNumero: linha.oab_numero,
    oabUf: linha.oab_uf,
    // O front mostra quantas leituras de IA ainda cabem antes de ser preciso
    // pagar; o número de verdade é cobrado no servidor (routes/documentos.ts).
    leiturasIaUsadas: linha.leituras_ia_usadas,
    leiturasIaGratuitas: LEITURAS_IA_GRATUITAS,
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
    const oabNumeroValor = oabNumero ?? null;
    const oabUfValor = oabUf ?? null;

    const existente = await pool.query(
      'SELECT 1 FROM usuarios WHERE email = $1 OR (oab_numero = $2 AND oab_uf = $3)',
      [email, oabNumeroValor, oabUfValor],
    );
    if (existente.rowCount) {
      res.status(409).json({ erro: 'Já existe uma conta com este email ou OAB.' });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const resultado = await pool.query<LinhaUsuario>(
      `INSERT INTO usuarios (nome, email, telefone, oab_numero, oab_uf, senha_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUNAS_USUARIO}`,
      [nome, email, telefone, oabNumeroValor, oabUfValor, senhaHash],
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
      `SELECT ${COLUNAS_USUARIO}, senha_hash FROM usuarios WHERE email = $1`,
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
      `SELECT ${COLUNAS_USUARIO} FROM usuarios WHERE id = $1`,
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

/**
 * Pede o link de redefinição.
 *
 * Responde 200 mesmo quando o e-mail não tem conta, e a mensagem devolvida é
 * sempre a mesma: um "não existe" aqui transformaria esta rota num verificador
 * de quais e-mails estão cadastrados na plataforma.
 */
authRouter.post(
  '/recuperar-senha',
  limitadorRecuperacao,
  asyncRota(async (req, res) => {
    const corpo = recuperarSenhaSchema.safeParse(req.body);
    if (!corpo.success) {
      res.status(400).json({ erro: corpo.error.issues[0]?.message ?? 'Dados inválidos.' });
      return;
    }

    const resposta = {
      ok: true,
      mensagem: 'Se houver uma conta com esse e-mail, enviamos o link de redefinição.',
    };

    const encontrado = await pool.query<{ id: string; nome: string }>(
      'SELECT id, nome FROM usuarios WHERE email = $1',
      [corpo.data.email],
    );
    const usuario = encontrado.rows[0];
    if (!usuario) {
      res.status(200).json(resposta);
      return;
    }

    // Um link válido por vez: pedir de novo invalida o anterior, que é o que
    // a pessoa espera quando reenvia por não ter recebido o primeiro.
    await pool.query('DELETE FROM recuperacoes_senha WHERE usuario_id = $1 AND usado_em IS NULL', [
      usuario.id,
    ]);

    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO recuperacoes_senha (usuario_id, token_hash, expira_em) VALUES ($1, $2, $3)',
      [usuario.id, hashToken(token), new Date(Date.now() + VALIDADE_TOKEN_MS)],
    );

    const link = `${urlDoSite()}/redefinir-senha?token=${token}`;
    await enviarEmail({
      para: corpo.data.email,
      assunto: 'Redefinir sua senha — JuriscalcSP',
      texto:
        `Olá, ${usuario.nome}.\n\n` +
        'Recebemos um pedido para redefinir a senha da sua conta na JuriscalcSP. ' +
        'Abra o link abaixo para escolher uma nova senha:\n\n' +
        `${link}\n\n` +
        'O link vale por 1 hora e só pode ser usado uma vez.\n\n' +
        'Se não foi você que pediu, ignore este e-mail: sua senha continua a mesma.',
    });

    // Falha de envio também cai aqui como 200. Do contrário a resposta
    // denunciaria que o e-mail existe -- e o erro de envio já fica no log.
    res.status(200).json(resposta);
  }),
);

/** Troca a senha a partir do token recebido por e-mail. */
authRouter.post(
  '/redefinir-senha',
  limitadorRecuperacao,
  asyncRota(async (req, res) => {
    const corpo = redefinirSenhaSchema.safeParse(req.body);
    if (!corpo.success) {
      res.status(400).json({ erro: corpo.error.issues[0]?.message ?? 'Dados inválidos.' });
      return;
    }

    const senhaHash = await bcrypt.hash(corpo.data.senha, 12);
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');

      // Marcar como usado e ler o dono na MESMA instrução: dois pedidos
      // simultâneos com o mesmo token disputam esta linha, e só um sai com
      // resultado. Separar em SELECT + UPDATE deixaria a janela aberta.
      const consumo = await cliente.query<{ usuario_id: string }>(
        `UPDATE recuperacoes_senha
            SET usado_em = now()
          WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > now()
      RETURNING usuario_id`,
        [hashToken(corpo.data.token)],
      );
      const usuarioId = consumo.rows[0]?.usuario_id;
      if (!usuarioId) {
        await cliente.query('ROLLBACK');
        res.status(400).json({ erro: 'Link inválido ou expirado. Peça um novo.' });
        return;
      }

      await cliente.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [senhaHash, usuarioId]);
      await cliente.query('COMMIT');
    } catch (erro) {
      await cliente.query('ROLLBACK').catch(() => {});
      throw erro;
    } finally {
      cliente.release();
    }

    // Sem sessão automática de propósito: a pessoa entra com a senha nova,
    // o que confirma que ela ficou como esperado.
    res.status(200).json({ ok: true });
  }),
);
