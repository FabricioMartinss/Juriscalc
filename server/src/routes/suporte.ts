import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { Resend } from 'resend';
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
 * Envio por API HTTP (Resend), não SMTP -- trocado depois que o envio por
 * SMTP (nodemailer + Gmail) ficou pendurado pra sempre em produção: a porta
 * 587 de saída parece bloqueada/filtrada pela rede do host (comum em PaaS).
 * A API da Resend roda por HTTPS na 443, que nenhum PaaS bloqueia.
 *
 * Cliente sob demanda (não na carga do módulo): assim o servidor sobe
 * normalmente mesmo sem RESEND_API_KEY configurada, e só a rota de suporte
 * fica indisponível (503) até alguém configurar.
 */
function clienteResend(): Resend | null {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return null;
  return new Resend(chave);
}

interface LinhaUsuario {
  nome: string;
  email: string;
  telefone: string;
}

// Nome do usuário vem do cadastro sem restrição de caractere e entra tanto no
// assunto quanto no replyTo do e-mail -- uma quebra de linha ali seria
// injeção de cabeçalho (CRLF injection). Tirar CR/LF vale pros dois lugares.
function semQuebraDeLinha(texto: string): string {
  return texto.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Monta "Nome <email>" pro campo replyTo. O SDK da Resend só aceita string
 * aqui (ao contrário do nodemailer, que aceitava {name, address} e escapava
 * sozinho) -- então o escape é manual: nome-de-exibição entre aspas (RFC
 * 5322) aceita qualquer caractere desde que `\` e `"` internos sejam
 * escapados. Sem isso, um nome com `<` ou `"` quebraria o formato.
 */
function remetente(nome: string, email: string): string {
  const escapado = semQuebraDeLinha(nome).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escapado}" <${email}>`;
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

    const resend = clienteResend();
    // "De" precisa ser um endereço de domínio verificado na Resend (não dá
    // pra mandar "de" um Gmail alheio, ao contrário do SMTP autenticado) --
    // por isso vem de variável própria, separada do destino.
    const origem = process.env.SUPORTE_EMAIL_ORIGEM;
    if (!resend || !origem) {
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

    const { error } = await resend.emails.send({
      from: `JuriscalcSP <${origem}>`,
      to: destino,
      // Responder o e-mail já vai direto pro usuário, sem copiar contato
      // manualmente. Ver remetente() acima pra por que não é string solta.
      replyTo: remetente(usuario.nome, usuario.email),
      subject: `[Suporte JuriscalcSP] ${semQuebraDeLinha(usuario.nome)}`,
      text: `Usuário: ${usuario.nome}\nE-mail: ${usuario.email}\nTelefone: ${usuario.telefone}\n\nMensagem:\n${corpo.data.mensagem}`,
    });

    if (error) {
      // Detalhe do erro só no log do servidor -- pode vazar config/domínio.
      console.error('Falha ao enviar e-mail de suporte (Resend):', error.message);
      res.status(503).json({ erro: 'Não foi possível enviar sua mensagem agora. Tente novamente mais tarde.' });
      return;
    }

    res.status(200).json({ ok: true });
  }),
);
