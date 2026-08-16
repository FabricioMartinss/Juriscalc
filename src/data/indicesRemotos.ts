/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Índices servidos pela rede, com o bundle como piso.
 *
 * Motivo: a extensão publicada na Chrome Web Store carrega os fatores compilados
 * no bundle, e trocá-los exigiria republicar (com revisão da loja) todo mês.
 * Buscando `indices.json` em tempo de execução, um mês novo chega no mesmo dia.
 *
 * O dado passa a vir da rede e vira guia de custas, então ele é tratado como
 * não confiável: só substitui o embutido se reproduzir exatamente todo período
 * já conhecido e apenas acrescentar meses à frente. Na dúvida, fica o bundle.
 *
 * A API de consulta segue SÍNCRONA — `inicializarIndices()` roda antes do render
 * e o resto do app não muda.
 */

import { SERIE_ANTIGA, SERIE_IPCA_E, SERIE_NOVA } from './indices.generated';
import { SerieIndices, ultimoPeriodoSerie, valorSerie } from './serie';

export type ChaveSerie = 'SERIE_NOVA' | 'SERIE_ANTIGA' | 'SERIE_IPCA_E';

/** Fatores compilados no bundle. Servem de piso e de fallback. */
const EMBUTIDAS: Record<ChaveSerie, SerieIndices> = {
  SERIE_NOVA,
  SERIE_ANTIGA,
  SERIE_IPCA_E,
};

const CHAVES = Object.keys(EMBUTIDAS) as ChaveSerie[];

/** Versão de formato aceita. Um `indices.json` mais novo é ignorado. */
const VERSAO_SUPORTADA = 1;

/**
 * Onde a extensão busca o arquivo, em ordem de preferência.
 *
 * São dois porque o mesmo site responde no domínio próprio e no endereço do
 * Netlify. Tentar ambos evita que a extensão pare de receber índices se um sair
 * do ar — e a extensão publicada não se corrige sozinha: dependeria de nova
 * revisão da loja.
 *
 * Os dois precisam estar em `host_permissions` no manifest.
 */
const URLS_ABSOLUTAS = [
  'https://juriscalcsp.com/indices.json',
  'https://juriscalc2.netlify.app/indices.json',
];

const CHAVE_CACHE = 'juriscalc:indices';

/** Teto de espera antes de renderizar. Estourou, o bundle assume. */
const PRAZO_MS = 1500;

/** Mesma faixa de variação mês a mês usada por `scripts/sync-indices.mjs`. */
const VAR_MIN = -0.02;
const VAR_MAX = 0.04;

let remotas: Partial<Record<ChaveSerie, SerieIndices>> = {};

/** Série em vigor: a remota, se passou na validação; senão a do bundle. */
export function serieVigente(chave: ChaveSerie): SerieIndices {
  return remotas[chave] ?? EMBUTIDAS[chave];
}

/** Data de geração dos fatores em vigor, quando vieram da rede. */
let geradoEmRemoto: string | null = null;
export function geradoEm(): string | null {
  return geradoEmRemoto;
}

function ehNumero(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Confere uma série candidata contra a embutida. Devolve `null` se algo não
 * fecha — e aí o candidato inteiro é descartado, não só a série.
 */
function validarSerie(chave: ChaveSerie, bruto: unknown): SerieIndices | null {
  const embutida = EMBUTIDAS[chave];
  if (typeof bruto !== 'object' || bruto === null) return null;

  const c = bruto as Record<string, unknown>;
  if (typeof c.nome !== 'string') return null;
  // O índice depende de onde a série começa: divergiu, o alinhamento quebra.
  if (c.anoInicial !== embutida.anoInicial || c.mesInicial !== embutida.mesInicial) return null;
  if (typeof c.valores !== 'object' || c.valores === null) return null;

  const valores: Record<number, number[]> = {};
  for (const [anoStr, lista] of Object.entries(c.valores as Record<string, unknown>)) {
    const ano = Number(anoStr);
    if (!Number.isInteger(ano) || ano < 1900 || ano > 2200) return null;
    if (!Array.isArray(lista) || lista.length === 0 || !lista.every(ehNumero)) return null;
    valores[ano] = lista as number[];
  }

  const anos = Object.keys(valores).map(Number).sort((a, b) => a - b);
  if (anos.length === 0 || anos[0] !== embutida.anoInicial) return null;

  // Anos consecutivos, e todo ano que não é o último precisa estar completo.
  for (let i = 0; i < anos.length; i++) {
    const ano = anos[i];
    if (ano !== anos[0] + i) return null;
    const base = ano === embutida.anoInicial ? embutida.mesInicial : 1;
    const cheio = 12 - base + 1;
    const tamanho = valores[ano].length;
    if (tamanho > cheio) return null;
    if (i < anos.length - 1 && tamanho !== cheio) return null;
  }

  const candidata: SerieIndices = {
    nome: c.nome,
    anoInicial: embutida.anoInicial,
    mesInicial: embutida.mesInicial,
    valores,
  };

  // Todo período já conhecido tem que bater exatamente.
  const fimEmbutido = ultimoPeriodoSerie(embutida);
  for (let ano = embutida.anoInicial; ano <= fimEmbutido.ano; ano++) {
    const base = ano === embutida.anoInicial ? embutida.mesInicial : 1;
    for (let mes = base; mes <= 12; mes++) {
      const conhecido = valorSerie(embutida, ano, mes);
      if (conhecido === undefined) continue;
      if (valorSerie(candidata, ano, mes) !== conhecido) return null;
    }
  }

  // Nunca aceitar uma série mais curta que a do bundle.
  const fimCandidato = ultimoPeriodoSerie(candidata);
  if (fimCandidato.ano * 12 + fimCandidato.mes < fimEmbutido.ano * 12 + fimEmbutido.mes) return null;

  // Variação mês a mês plausível ao longo de toda a série.
  let anterior: number | null = null;
  for (let ano = candidata.anoInicial; ano <= fimCandidato.ano; ano++) {
    const base = ano === candidata.anoInicial ? candidata.mesInicial : 1;
    for (let mes = base; mes <= 12; mes++) {
      const v = valorSerie(candidata, ano, mes);
      if (v === undefined) continue;
      if (v <= 0) return null;
      if (anterior !== null) {
        const variacao = v / anterior - 1;
        if (variacao < VAR_MIN || variacao > VAR_MAX) return null;
      }
      anterior = v;
    }
  }

  return candidata;
}

/** Valida o payload inteiro. Uma série reprovada invalida tudo. */
function validarPayload(bruto: unknown): { series: Record<ChaveSerie, SerieIndices>; geradoEm: string } | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const p = bruto as Record<string, unknown>;
  if (p.versao !== VERSAO_SUPORTADA) return null;
  if (typeof p.series !== 'object' || p.series === null) return null;

  const series = p.series as Record<string, unknown>;
  const validadas = {} as Record<ChaveSerie, SerieIndices>;
  for (const chave of CHAVES) {
    const serie = validarSerie(chave, series[chave]);
    if (!serie) return null;
    validadas[chave] = serie;
  }
  return { series: validadas, geradoEm: typeof p.geradoEm === 'string' ? p.geradoEm : '' };
}

function aplicar(bruto: unknown): boolean {
  const ok = validarPayload(bruto);
  if (!ok) return false;
  remotas = ok.series;
  geradoEmRemoto = ok.geradoEm || null;
  return true;
}

interface ChromeStorage {
  storage?: { local?: { get(k: string): Promise<Record<string, unknown>>; set(i: Record<string, unknown>): Promise<void> } };
}

function chromeStorage() {
  return (globalThis as { chrome?: ChromeStorage }).chrome?.storage?.local;
}

const noContextoDaExtensao = () => location.protocol === 'chrome-extension:';

async function lerCache(): Promise<unknown | null> {
  const store = chromeStorage();
  if (store) {
    const dados = await store.get(CHAVE_CACHE);
    return dados?.[CHAVE_CACHE] ?? null;
  }
  const bruto = localStorage.getItem(CHAVE_CACHE);
  return bruto ? JSON.parse(bruto) : null;
}

async function gravarCache(dados: unknown): Promise<void> {
  const store = chromeStorage();
  if (store) {
    await store.set({ [CHAVE_CACHE]: dados });
    return;
  }
  localStorage.setItem(CHAVE_CACHE, JSON.stringify(dados));
}

async function buscarRemoto(): Promise<unknown> {
  // No app web o arquivo vem da própria origem, seja qual for o domínio. Na
  // extensão é preciso host absoluto, liberado em `host_permissions`.
  const urls = noContextoDaExtensao() ? URLS_ABSOLUTAS : ['/indices.json'];

  let ultimoErro: unknown;
  for (const url of urls) {
    try {
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (erro) {
      ultimoErro = erro; // tenta o próximo host antes de desistir
    }
  }
  throw ultimoErro ?? new Error('nenhum host respondeu');
}

function prazo(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Carrega os índices mais recentes disponíveis. Deve ser chamada — e aguardada —
 * antes do render.
 *
 * Aplica o cache local na hora e dá à rede até `PRAZO_MS`. Se estourar, o render
 * segue com o que já havia; a busca continua em segundo plano e deixa o cache
 * pronto para a próxima abertura. Nunca lança: falha aqui só significa
 * continuar com os fatores do bundle.
 */
export async function inicializarIndices(): Promise<void> {
  try {
    const doCache = await lerCache();
    if (doCache) aplicar(doCache);
  } catch {
    // Cache corrompido ou indisponível: segue com o bundle.
  }

  const daRede = buscarRemoto()
    .then(async (dados) => {
      if (aplicar(dados)) await gravarCache(dados);
    })
    .catch(() => {
      // Offline, host fora do ar ou payload reprovado: o bundle cobre.
    });

  await Promise.race([daRede, prazo(PRAZO_MS)]);
}
