import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { pool } from '../db.js';
import { usuarioIdDaRequisicao } from '../lib/sessao.js';
import { asyncRota } from '../lib/asyncRota.js';
import { enviarEmail, envioDisponivel, remetente, semQuebraDeLinha } from '../lib/email.js';

export const suporteRouter = Router();

const mensagemSchema = z.object({
  mensagem: z
    .string()
    .trim()
    .min(10, 'Descreva a dúvida ou o problema com um pouco mais de detalhe.')
    .max(4000, 'Mensagem muito longa (máximo 4000 caracteres).'),
});

// Cada envio dispara um e-mail de verdade. A rota já exige login, mas trava
// forte assim mesmo -- 5 a cada 15 min é sobra pra uso legítimo e barra flood.
const limitadorSuporte = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

interface LinhaUsuario {
  nome: string;
  email: string;
  telefone: string;
}

suporteRouter.post(
  '/',
  limitadorSuporte,
  asyncRota(async (req, res) => {
    const usuarioId = usuarioIdDaRequisicao(req);
    if (!usuarioId) {
      res.status(401).json({ erro: 'Não autenticado.' });
      return;
    }

    const corpo = mensagemSchema.safeParse(req.body);
    if (!corpo.success) {
      res.status(400).json({ erro: corpo.error.issues[0]?.message ?? 'Dados inválidos.' });
      return;
    }

    if (!envioDisponivel()) {
      res.status(503).json({ erro: 'Envio de mensagem indisponível no momento. Tente novamente mais tarde.' });
      return;
    }

    const resultado = await pool.query<LinhaUsuario>(
      'SELECT nome, email, telefone FROM usuarios WHERE id = $1',
      [usuarioId],
    );
    const usuario = resultado.rows[0];
    if (!usuario) {
      res.status(401).json({ erro: 'Não autenticado.' });
      return;
    }

    const enviado = await enviarEmail({
      para: process.env.SUPORTE_EMAIL_DESTINO || 'suporte.juriscalcsp@gmail.com',
      // Responder o e-mail já vai direto pro usuário, sem copiar contato
      // manualmente.
      responderPara: remetente(usuario.nome, usuario.email),
      assunto: `[Suporte JuriscalcSP] ${semQuebraDeLinha(usuario.nome)}`,
      texto: `Usuário: ${usuario.nome}\nE-mail: ${usuario.email}\nTelefone: ${usuario.telefone}\n\nMensagem:\n${corpo.data.mensagem}`,
    });

    if (!enviado) {
      // Falha de rede/API não é "erro interno" -- é a mesma indisponibilidade
      // de "sem envio configurado", só que descoberta na hora de mandar.
      res.status(503).json({ erro: 'Não foi possível enviar sua mensagem agora. Tente novamente mais tarde.' });
      return;
    }

    res.status(200).json({ ok: true });
  }),
);
