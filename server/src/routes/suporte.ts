import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { pool } from '../db.js';
import { usuarioIdDaRequisicao } from '../lib/sessao.js';
import { asyncRota } from '../lib/asyncRota.js';

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

/**
 * Transporte SMTP sob demanda (não na carga do módulo): assim o servidor
 * sobe normalmente mesmo sem as variáveis configuradas, e só a rota de
 * suporte fica indisponível (503) até alguém configurar.
 */
function transporteSmtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const porta = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host,
    port: porta,
    secure: porta === 465,
    auth: { user, pass },
    // Sem isto, uma porta de SMTP bloqueada/filtrada pela rede de saída do
    // host (comum em PaaS) deixa a conexão TCP pendurada indefinidamente --
    // a requisição HTTP nunca responde, e quem preencheu o formulário fica
    // olhando o botão girando pra sempre. Com o timeout, vira um erro em
    // ~10s, tratado abaixo como o mesmo 503 de "SMTP não configurado".
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
}

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

    const transporte = transporteSmtp();
    if (!transporte) {
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

    const destino = process.env.SUPORTE_EMAIL_DESTINO || 'suporte.juriscalcsp@gmail.com';

    try {
      await transporte.sendMail({
        from: `JuriscalcSP <${process.env.SMTP_USER}>`,
        to: destino,
        // Objeto {name, address}, não string interpolada: o nome do usuário é
        // dado dele (sem restrição de caractere no cadastro) -- um nome com
        // "<" ou "," dentro quebraria o parsing de "Nome <email>" como texto
        // solto. O nodemailer monta e escapa o cabeçalho certo a partir do
        // objeto. Responder o e-mail já vai direto pro usuário, sem copiar
        // contato manualmente.
        replyTo: { name: usuario.nome, address: usuario.email },
        subject: `[Suporte JuriscalcSP] ${usuario.nome}`,
        text: `Usuário: ${usuario.nome}\nE-mail: ${usuario.email}\nTelefone: ${usuario.telefone}\n\nMensagem:\n${corpo.data.mensagem}`,
      });
    } catch (erro) {
      // Falha de rede/SMTP (porta bloqueada, host fora do ar, timeout) não é
      // "erro interno" -- é a mesma indisponibilidade de "sem SMTP
      // configurado", só que descoberta na hora de mandar em vez de antes.
      // Não expõe detalhe da falha (pode vazar host/config); fica só no log
      // do servidor.
      console.error('Falha ao enviar e-mail de suporte:', erro instanceof Error ? erro.message : erro);
      res.status(503).json({ erro: 'Não foi possível enviar sua mensagem agora. Tente novamente mais tarde.' });
      return;
    }

    res.status(200).json({ ok: true });
  }),
);
