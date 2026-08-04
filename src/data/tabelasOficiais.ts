/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Camada de consulta das tabelas de correção monetária do TJSP.
 *
 * Os fatores vêm de duas fontes que nunca se sobrepõem:
 *   - `indicesHistoricos.ts`  — trecho imutável, mantido à mão;
 *   - `indices.generated.ts`  — trecho recente, mantido por `scripts/sync-indices.mjs`.
 *
 * Nenhum fator é digitado aqui. Os fallbacks de borda são derivados das próprias
 * séries, então acrescentar um mês novo não exige tocar em constante nenhuma.
 */

import { SERIE_COMUM_HISTORICA, SERIE_IPCA_E_HISTORICA } from './indicesHistoricos';
import { SERIE_ANTIGA, SERIE_IPCA_E, SERIE_NOVA } from './indices.generated';
import {
  SerieIndices,
  primeiroValorSerie,
  ultimoPeriodoSerie,
  ultimoValorSerie,
  valorSerie,
} from './serie';

// Tipo de Tabelas de Correção do TJSP
export type TipoTabelaCorrecao = 'nova_tabela' | 'antiga_tabela' | 'ipca_e';

export interface TabelaInfo {
  id: TipoTabelaCorrecao;
  nome: string;
  descricao: string;
  historicoInico: string;
}

export const LISTA_TABELAS: TabelaInfo[] = [
  {
    id: 'nova_tabela',
    nome: 'Nova Tabela Prática (Lei nº 14.905/2024)',
    descricao: 'Tabela oficial atualizada aplicada para correção de débitos judiciais cíveis em geral do TJSP, editada sob o Provimento CG nº 54/2024.',
    historicoInico: '10/1964'
  },
  {
    id: 'antiga_tabela',
    nome: 'Antiga Tabela Prática (Jurisprudência Predominante)',
    descricao: 'Tabela oficial baseada puramente nos índices anteriores à lei nº 14.905/2024 (INPC/TJSP tradicional) acumulando reajustes clássicos.',
    historicoInico: '10/1964'
  },
  {
    id: 'ipca_e',
    nome: 'Tabela IPCA-E (Precatórios e Cálculos)',
    descricao: 'Tabela prática editada pela Diretoria de Execução de Precatórios e Cálculos fundada no indexador oficial IPCA-E.',
    historicoInico: '01/1992'
  }
];

/** Série recente correspondente a cada tabela de débitos judiciais. */
const SERIE_RECENTE: Record<'nova_tabela' | 'antiga_tabela', SerieIndices> = {
  nova_tabela: SERIE_NOVA,
  antiga_tabela: SERIE_ANTIGA,
};

/**
 * Consulta encadeada: procura o período no trecho histórico e, não achando, no
 * trecho recente. Se estiver além do fim da série, devolve o último fator
 * publicado com `found: false` — o cálculo segue congelado no último índice
 * oficial em vez de extrapolar.
 */
function consultar(historica: SerieIndices, recente: SerieIndices, ano: number, mes: number) {
  const doHistorico = valorSerie(historica, ano, mes);
  if (doHistorico !== undefined) return { value: doHistorico, found: true };

  const doRecente = valorSerie(recente, ano, mes);
  if (doRecente !== undefined) return { value: doRecente, found: true };

  // Antes do início da série histórica: congela no primeiro fator.
  const inicio = historica.anoInicial * 12 + historica.mesInicial;
  if (ano * 12 + mes < inicio) {
    return { value: primeiroValorSerie(historica), found: false };
  }
  return { value: ultimoValorSerie(recente), found: false };
}

/**
 * Função de busca de índices oficiais do TJSP dinâmica por Tipo de Tabela.
 * Retorna o valor exato correspondente ao ano e mês informados.
 * Trata as datas limites de início e fim.
 */
export function buscarIndiceOficial(
  tabela: TipoTabelaCorrecao,
  ano: number,
  mes: number
): { value: number; found: boolean } {
  if (tabela === 'ipca_e') {
    return consultar(SERIE_IPCA_E_HISTORICA, SERIE_IPCA_E, ano, mes);
  }
  // Nova e Antiga compartilham o histórico até ago/2024 e bifurcam a partir de set/2024.
  return consultar(SERIE_COMUM_HISTORICA, SERIE_RECENTE[tabela], ano, mes);
}

/**
 * Retorna o último mês/ano com índice oficial disponível na tabela comum
 * (a mais recente das séries). Serve de limite superior para validar os
 * campos de data, acompanhando automaticamente as atualizações das tabelas.
 */
export function getUltimoPeriodoDisponivel(): { ano: number; mes: number } {
  return ultimoPeriodoSerie(SERIE_NOVA);
}
