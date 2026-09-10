/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COMARCAS_TJSP } from '../data/comarcasTJSP';
import { CLASSES_TJSP } from '../data/classesTJSP';
import { FOROS_POR_COMARCA } from '../data/forosPorComarca';
import { chaveTexto } from './camposEmissao';

/**
 * Ids do portal para o bloco "processo novo" (Petição Inicial, Execução de
 * Título Extrajudicial, Ação Penal Privada - Inicial — ver
 * data/servicosPortal.ts, CAMPOS_PROCESSO_NOVO). Os três serviços usam
 * exatamente os mesmos ids, então resolver aqui vale para qualquer um deles.
 */
export const IDS_PROCESSO_NOVO = {
  comarca: 'cmb_comarca1_ativa_alocacao',
  foro: 'cmb_foro1_ativo_alocacao',
  classe: 'cmb_classe',
} as const;

const COMARCA_POR_CHAVE = new Map(COMARCAS_TJSP.map((c) => [chaveTexto(c.rotulo), c.valor]));
const CLASSE_POR_CHAVE = new Map(CLASSES_TJSP.map((c) => [chaveTexto(c.rotulo), c.valor]));

/**
 * Casa a classe processual contra a lista do portal (`cmb_classe`).
 *
 * A tabela do CNJ e o `<select>` do portal nem sempre escrevem a classe igual.
 * O caso que mais aparece: o cabeçalho da petição traz "Procedimento Comum
 * Cível" (nome da tabela CNJ, e o exemplo que o próprio prompt de extração dá),
 * enquanto o portal lista só "Procedimento Comum". Quando o texto não casa
 * exato, tenta de novo sem o sufixo de competência ("Cível"/"Criminal") no
 * fim — só nesse sentido, porque tirar um sufixo que o portal não usa é seguro,
 * mas acrescentar um que ele usa escolheria "Cível" ou "Criminal" no chute.
 */
function resolverClasse(texto: string): string | undefined {
  const chave = chaveTexto(texto);
  const exato = CLASSE_POR_CHAVE.get(chave);
  if (exato) return exato;

  const semCompetencia = chave.replace(/(?:CIVEL|CRIMINAL)$/, '');
  if (semCompetencia !== chave && semCompetencia.length >= 4) {
    return CLASSE_POR_CHAVE.get(semCompetencia);
  }
  return undefined;
}

export interface DadosProcessoNovo {
  comarca?: string | null;
  classeProcessual?: string | null;
}

/**
 * Resolve texto de comarca/classe (lido de um documento ou digitado) para os
 * `value` internos do portal — só esses ids a extensão sabe selecionar, texto
 * livre não adianta nada na hora de preencher.
 *
 * Quando a comarca resolvida tem um único foro (caso da maioria), resolve o
 * foro também — mesmo atalho que o painel já usa quando o usuário escolhe a
 * comarca na mão. Sem match confiável, o campo simplesmente não entra no
 * resultado: melhor deixar em branco pro usuário completar do que mandar um
 * valor errado pro portal.
 */
export function resolverCamposProcessoNovo(dados: DadosProcessoNovo): Record<string, string> {
  const extras: Record<string, string> = {};

  const comarcaValor = dados.comarca ? COMARCA_POR_CHAVE.get(chaveTexto(dados.comarca)) : undefined;
  if (comarcaValor) {
    extras[IDS_PROCESSO_NOVO.comarca] = comarcaValor;
    const foros = FOROS_POR_COMARCA[comarcaValor];
    if (foros && foros.length === 1) {
      extras[IDS_PROCESSO_NOVO.foro] = foros[0];
    }
  }

  const classeValor = dados.classeProcessual ? resolverClasse(dados.classeProcessual) : undefined;
  if (classeValor) {
    extras[IDS_PROCESSO_NOVO.classe] = classeValor;
  }

  return extras;
}
