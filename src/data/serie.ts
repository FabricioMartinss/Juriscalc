/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Representação de uma série mensal de fatores de atualização monetária.
 *
 * O array de `anoInicial` começa em `mesInicial`; os arrays dos demais anos
 * começam sempre em janeiro. O último ano costuma estar incompleto — o TJSP
 * publica um mês de cada vez.
 */
export interface SerieIndices {
  /** Rótulo humano da série, usado em mensagens e no cabeçalho do arquivo gerado. */
  nome: string;
  /** Ano do primeiro registro da série. */
  anoInicial: number;
  /** Mês (1-12) do primeiro registro, dentro de `anoInicial`. */
  mesInicial: number;
  /** Fatores por ano, em ordem cronológica. */
  valores: Record<number, number[]>;
}

/** Índice (0-based) que o mês ocupa dentro do array do respectivo ano. */
function offset(serie: SerieIndices, ano: number, mes: number): number {
  return ano === serie.anoInicial ? mes - serie.mesInicial : mes - 1;
}

/** Fator de `mes/ano`, ou `undefined` se o período estiver fora da série. */
export function valorSerie(serie: SerieIndices, ano: number, mes: number): number | undefined {
  const valores = serie.valores[ano];
  if (!valores) return undefined;
  const i = offset(serie, ano, mes);
  if (i < 0 || i >= valores.length) return undefined;
  return valores[i];
}

/** Último período (mais recente) com fator publicado. */
export function ultimoPeriodoSerie(serie: SerieIndices): { ano: number; mes: number } {
  const ano = Math.max(...Object.keys(serie.valores).map(Number));
  const base = ano === serie.anoInicial ? serie.mesInicial : 1;
  return { ano, mes: serie.valores[ano].length + base - 1 };
}

/**
 * Fator do último período publicado. Usado como fallback quando se pede um
 * período posterior ao fim da série: mantém o valor congelado no último índice
 * oficial em vez de depender de uma constante digitada à mão.
 */
export function ultimoValorSerie(serie: SerieIndices): number {
  const { ano, mes } = ultimoPeriodoSerie(serie);
  return valorSerie(serie, ano, mes)!;
}

/** Primeiro fator da série, usado como fallback para períodos anteriores ao início. */
export function primeiroValorSerie(serie: SerieIndices): number {
  return serie.valores[serie.anoInicial][0];
}
