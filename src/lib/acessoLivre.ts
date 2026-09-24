/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Degustação antes do cadastro: as duas primeiras visitas à plataforma são
 * livres, a terceira pede login.
 *
 * Conta VISITA, não cálculo: recarregar a página, trocar de aba ou refazer o
 * cálculo não gasta nada. Cada visita só é contada uma vez por sessão do
 * navegador (`sessionStorage`), enquanto o total acumulado vive no
 * `localStorage` — fechar o navegador e voltar depois é a segunda visita.
 *
 * O leitor de documento (IA) fica de fora desta conta: ele exige login desde a
 * primeira vez, porque cada uso custa uma chamada paga à Anthropic. Ver
 * UploadProcessoTab.tsx.
 *
 * Isto não é controle de acesso — é um convite ao cadastro. Quem souber mexer
 * no armazenamento do navegador zera a conta, e tudo bem: a calculadora roda
 * inteira no cliente e não tem o que proteger aqui. O que é de verdade
 * protegido (extração de documento, suporte) é verificado no servidor, pela
 * sessão.
 */

const CHAVE_TOTAL = 'juds_visitas';
const CHAVE_SESSAO = 'juds_visita_contada';

/** Visitas livres antes de o login ser pedido. */
export const VISITAS_LIVRES = 2;

/**
 * `localStorage`/`sessionStorage` lançam em navegação anônima com cookies
 * bloqueados. Nesses casos a contagem simplesmente não acontece e o acesso
 * segue livre — melhor errar para o lado de deixar usar.
 */
function lerTotal(): number {
  try {
    const bruto = window.localStorage.getItem(CHAVE_TOTAL);
    const n = Number(bruto);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function gravarTotal(n: number): void {
  try {
    window.localStorage.setItem(CHAVE_TOTAL, String(n));
  } catch {
    // sem armazenamento: segue sem contar
  }
}

/**
 * Conta esta visita (uma vez por sessão do navegador) e devolve o total
 * acumulado. Chamar de novo na mesma sessão devolve o mesmo número.
 */
export function registrarVisita(): number {
  try {
    if (window.sessionStorage.getItem(CHAVE_SESSAO)) return lerTotal();
    window.sessionStorage.setItem(CHAVE_SESSAO, '1');
  } catch {
    // sem sessionStorage não dá para saber se esta visita já foi contada;
    // conta assim mesmo, é o comportamento menos surpreendente.
  }

  const total = lerTotal() + 1;
  gravarTotal(total);
  return total;
}

/**
 * true quando as visitas livres acabaram e o login passa a ser exigido.
 *
 * A contagem não é zerada ao entrar na conta de propósito: quem entrou e
 * depois saiu (computador compartilhado, por exemplo) volta a encontrar o
 * pedido de login, em vez de ganhar mais duas visitas a cada logout.
 */
export function excedeuVisitasLivres(total: number): boolean {
  return total > VISITAS_LIVRES;
}
