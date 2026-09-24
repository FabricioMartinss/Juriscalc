import { Resend } from 'resend';

/**
 * Envio de e-mail transacional por API HTTP (Resend), não SMTP.
 *
 * A escolha tem história: o envio por SMTP (nodemailer + Gmail) ficava
 * pendurado para sempre em produção -- a porta 587 de saída parece
 * bloqueada/filtrada pela rede do host, como é comum em PaaS. A API da Resend
 * roda por HTTPS na 443, que nenhum PaaS bloqueia.
 *
 * Cliente criado sob demanda, não na carga do módulo: assim o servidor sobe
 * normalmente sem RESEND_API_KEY configurada, e só as rotas que mandam e-mail
 * ficam indisponíveis (503) até alguém configurar.
 */

function clienteResend(): Resend | null {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return null;
  return new Resend(chave);
}

/**
 * Endereço "de" das mensagens. Precisa ser de um domínio VERIFICADO na Resend
 * (não dá para mandar "de" um Gmail alheio, ao contrário do SMTP autenticado).
 */
function origem(): string | null {
  return process.env.SUPORTE_EMAIL_ORIGEM || null;
}

/** true quando dá para enviar — as rotas usam isto para responder 503 cedo. */
export function envioDisponivel(): boolean {
  return Boolean(clienteResend() && origem());
}

// Nome de usuário vem do cadastro sem restrição de caractere e entra em
// assunto e cabeçalhos do e-mail -- uma quebra de linha ali seria injeção de
// cabeçalho (CRLF injection).
export function semQuebraDeLinha(texto: string): string {
  return texto.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Monta "Nome <email>" para replyTo. O SDK da Resend só aceita string aqui
 * (ao contrário do nodemailer, que aceitava {name, address} e escapava
 * sozinho), então o escape é manual: nome-de-exibição entre aspas (RFC 5322)
 * aceita qualquer caractere desde que `\` e `"` internos sejam escapados. Sem
 * isso, um nome com `<` ou `"` quebraria o formato.
 */
export function remetente(nome: string, email: string): string {
  const escapado = semQuebraDeLinha(nome).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escapado}" <${email}>`;
}

export interface Mensagem {
  para: string;
  assunto: string;
  texto: string;
  /** "Nome <email>" já escapado por `remetente()`, quando houver. */
  responderPara?: string;
}

/**
 * Envia e devolve `true` em caso de sucesso. Nunca lança: falha de rede ou
 * recusa da API vira `false`, com o detalhe apenas no log do servidor (pode
 * conter configuração/domínio). Quem chama decide o que responder.
 */
export async function enviarEmail(msg: Mensagem): Promise<boolean> {
  const resend = clienteResend();
  const de = origem();
  if (!resend || !de) return false;

  try {
    const { error } = await resend.emails.send({
      from: `JuriscalcSP <${de}>`,
      to: msg.para,
      replyTo: msg.responderPara,
      subject: semQuebraDeLinha(msg.assunto),
      text: msg.texto,
    });
    if (error) {
      console.error('Falha ao enviar e-mail (Resend):', error.message);
      return false;
    }
    return true;
  } catch (erro) {
    console.error('Falha ao enviar e-mail:', erro instanceof Error ? erro.message : erro);
    return false;
  }
}
