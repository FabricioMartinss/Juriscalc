/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexMes, CalculationCategory } from '../types';

export const UFESP_2026 = 38.42;
export const CUTOFF_DATE = '2024-01-03';

// Códigos de Receita do TJSP
export const CODES = {
  DARE_TAXA_JUDICIARIA: '230-6',
  FEDTJ_DESPESAS: '120-1',
  GRD_DILIGENCIA_OFICIAL: 'GRD-Oficial', // Não tem código numérico simples no BB, é guia GRD específica
};

// Links para emissão física das guias
export const LINKS = {
  DARE_SP: 'https://portaldecustas.tjsp.jus.br/portaltjsp',
  FEDTJ_BB: 'https://www45.bb.com.br/fmc/frm/fw0707314_1.jsp',
  GRD_BB: 'https://www63.bb.com.br/portalbb/boleto/boletos/oficialjustica/entrada,802,2270,3617,15,0.bbx'
};

// Histórico de valores da UFESP para referência
export const HISTORICO_UFESP = [
  { ano: 2026, valor: 38.42 },
  { ano: 2025, valor: 35.36 },
  { ano: 2024, valor: 35.36 },
  { ano: 2023, valor: 34.26 },
  { ano: 2022, valor: 31.97 },
  { ano: 2021, valor: 29.09 },
  { ano: 2020, valor: 27.61 },
];

/**
 * Tabela Prática de Atualização Monetária do TJSP (Índices INPC/TJSP consolidado)
 * de Janeiro de 2020 a Maio de 2026 para fins de cálculo de correção financeira.
 */
export const TABELA_PRATICA_TJSP: IndexMes[] = [
  // 2020
  { ano: 2020, mes: 1, indexValue: 72.8415 },
  { ano: 2020, mes: 2, indexValue: 72.9799 },
  { ano: 2020, mes: 3, indexValue: 73.1039 },
  { ano: 2020, mes: 4, indexValue: 73.2355 },
  { ano: 2020, mes: 5, indexValue: 73.0660 },
  { ano: 2020, mes: 6, indexValue: 72.8833 },
  { ano: 2020, mes: 7, indexValue: 73.1021 },
  { ano: 2020, mes: 8, indexValue: 73.4238 },
  { ano: 2020, mes: 9, indexValue: 73.6881 },
  { ano: 2020, mes: 10, indexValue: 74.3285 },
  { ano: 2020, mes: 11, indexValue: 75.0003 },
  { ano: 2020, mes: 12, indexValue: 75.7153 },
  
  // 2021
  { ano: 2021, mes: 1, indexValue: 76.8207 },
  { ano: 2021, mes: 2, indexValue: 77.0281 },
  { ano: 2021, mes: 3, indexValue: 77.6601 },
  { ano: 2021, mes: 4, indexValue: 78.3279 },
  { ano: 2021, mes: 5, indexValue: 78.6255 },
  { ano: 2021, mes: 6, indexValue: 79.3795 },
  { ano: 2021, mes: 7, indexValue: 79.8558 },
  { ano: 2021, mes: 8, indexValue: 80.6703 },
  { ano: 2021, mes: 9, indexValue: 81.3802 },
  { ano: 2021, mes: 10, indexValue: 82.3568 },
  { ano: 2021, mes: 11, indexValue: 83.3121 },
  { ano: 2021, mes: 12, indexValue: 84.0120 },

  // 2022
  { ano: 2022, mes: 1, indexValue: 84.6253 },
  { ano: 2022, mes: 2, indexValue: 85.2431 },
  { ano: 2022, mes: 3, indexValue: 86.0955 },
  { ano: 2022, mes: 4, indexValue: 87.5677 },
  { ano: 2022, mes: 5, indexValue: 88.4796 },
  { ano: 2022, mes: 6, indexValue: 88.8876 },
  { ano: 2022, mes: 7, indexValue: 89.4476 },
  { ano: 2022, mes: 8, indexValue: 88.9115 },
  { ano: 2022, mes: 9, indexValue: 88.6237 },
  { ano: 2022, mes: 10, indexValue: 88.3391 },
  { ano: 2022, mes: 11, indexValue: 88.7543 },
  { ano: 2022, mes: 12, indexValue: 89.0916 },

  // 2023
  { ano: 2023, mes: 1, indexValue: 89.5727 },
  { ano: 2023, mes: 2, indexValue: 90.0474 },
  { ano: 2023, mes: 3, indexValue: 90.7408 },
  { ano: 2023, mes: 4, indexValue: 91.3201 },
  { ano: 2023, mes: 5, indexValue: 91.8041 },
  { ano: 2023, mes: 6, indexValue: 92.1346 },
  { ano: 2023, mes: 7, indexValue: 92.0425 },
  { ano: 2023, mes: 8, indexValue: 92.0149 },
  { ano: 2023, mes: 9, indexValue: 92.1989 },
  { ano: 2023, mes: 10, indexValue: 92.3003 },
  { ano: 2023, mes: 11, indexValue: 92.4111 },
  { ano: 2023, mes: 12, indexValue: 92.5035 },

  // 2024
  { ano: 2024, mes: 1, indexValue: 93.0125 },
  { ano: 2024, mes: 2, indexValue: 93.5422 },
  { ano: 2024, mes: 3, indexValue: 94.3015 },
  { ano: 2024, mes: 4, indexValue: 94.4851 },
  { ano: 2024, mes: 5, indexValue: 94.8347 },
  { ano: 2024, mes: 6, indexValue: 95.2709 },
  { ano: 2024, mes: 7, indexValue: 95.5186 },
  { ano: 2024, mes: 8, indexValue: 95.6523 },
  { ano: 2024, mes: 9, indexValue: 95.7862 },
  { ano: 2024, mes: 10, indexValue: 96.1118 },
  { ano: 2024, mes: 11, indexValue: 96.7021 },
  { ano: 2024, mes: 12, indexValue: 97.4124 },

  // 2025
  { ano: 2025, mes: 1, indexValue: 97.9015 },
  { ano: 2025, mes: 2, indexValue: 98.3125 },
  { ano: 2025, mes: 3, indexValue: 98.8124 },
  { ano: 2025, mes: 4, indexValue: 99.1123 },
  { ano: 2025, mes: 5, indexValue: 99.4012 },
  { ano: 2025, mes: 6, indexValue: 99.8124 },
  { ano: 2025, mes: 7, indexValue: 100.1245 },
  { ano: 2025, mes: 8, indexValue: 100.2515 },
  { ano: 2025, mes: 9, indexValue: 100.3524 },
  { ano: 2025, mes: 10, indexValue: 100.7511 },
  { ano: 2025, mes: 11, indexValue: 101.2145 },
  { ano: 2025, mes: 12, indexValue: 101.9515 },

  // 2026
  { ano: 2026, mes: 1, indexValue: 102.3214 },
  { ano: 2026, mes: 2, indexValue: 102.7125 },
  { ano: 2026, mes: 3, indexValue: 103.1114 },
  { ano: 2026, mes: 4, indexValue: 103.4514 },
  { ano: 2026, mes: 5, indexValue: 103.7842 }, // Mês atual da requisição 05/2026
];

export function buscarIndiceTJSP(ano: number, mes: number): { value: number; found: boolean } {
  const item = TABELA_PRATICA_TJSP.find((idx) => idx.ano === ano && idx.mes === mes);
  if (item) {
    return { value: item.indexValue, found: true };
  }
  // Fallback: se for antes de 2020, retorna o primeiro índice. Se pós-2026, retorna o último.
  if (ano < 2020) {
    return { value: 72.8415, found: false };
  }
  return { value: 103.7842, found: false };
}

export interface CategoriaMeta {
  id: CalculationCategory;
  name: string;
  section: 'Procedimento Comum e Execuções' | 'Juizados Especiais Cíveis (JEC)';
  baseLegal: string;
  defaultCode: string;
  source: 'DARE' | 'FEDTJ' | 'GRD' | 'Múltiplas' | 'Isento';
  legalExplanation: string;
}

export const CATEGORIAS_METADATA: CategoriaMeta[] = [
  {
    id: 'iniciais',
    name: '1) Iniciais, Reconvenção e Embargos',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, I, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Petições iniciais, reconvenções e oposições de embargos. Alíquota de 1% até 02/01/2024; a partir de 03/01/2024 sobe para 1,5% sobre o valor da causa. Piso de 5 UFESPs e Teto de 3.000 UFESPs.'
  },
  {
    id: 'exec_titulo_extrajudicial',
    name: '2) Distribuição de Execução de Título Extrajudicial',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, I & § 3º, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Distribuição de execução de título executivo extrajudicial. Até 02/01/2024 aplicava-se 1% na distribuição (piso 5, teto 3.000) + 1% na satisfação. A partir de 03/01/2024 unifica-se em 2% na distribuição inicial, devendo a base de cálculo somar o valor da dívida com honorários advocatícios sugeridos de 10%.'
  },
  {
    id: 'apelacao_recurso_adesivo',
    name: '3) Interposição de Apelação e Recurso Adesivo',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, II, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Preparo recursal para o Tribunal de Justiça. Alíquota de 4% sobre o valor da condenação líquida fixada. Se não houver condenação líquida, a alíquota de 4% incide sobre o valor atualizado da causa. Sujeito a Piso de 5 UFESPs e Teto de 3.000 UFESPs.'
  },
  {
    id: 'cumprimento_autos',
    name: '4) Instauração de Cumprimento de Sentença (Próprios Autos)',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, Lei Estadual nº 11.608/2003 (alterações de 2024)',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Instauração da fase executiva fundada em sentença. Até 02/01/2024: Isento de custas de distribuição (paga-se 1% à satisfação final). A partir de 03/01/2024: Taxa judiciária de 2% do valor do crédito a ser satisfeito cobrada no início. Piso de 5 UFESPs e Teto de 3.000.'
  },
  {
    id: 'cumprimento_div_orgao',
    name: '5) Cumprimento de Sentença (Título de outro Órgão/Arbitral)',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Cumprimento de título formado em outro órgão jurisdicional ou sentença arbitral. Até 02/01/2024: 1% na distribuição e 1% ao final. A partir de 03/01/2024: Unificada em 2% sobre o valor do crédito, recolhido no início.'
  },
  {
    id: 'satisfacao_exec_cumpr',
    name: '6) Satisfação da Execução ou Cumprimento de Sentença',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, III, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Anteriormente (peticionado até 02/01/2024), cobrava-se 1% sobre o valor da satisfação do crédito ao final (piso de 5 UFESPs). Pela lei atual (03/01/2024 em diante), caso a taxa de 2% já tenha sido recolhida no momento da instauração/distribuição, não há cobrança de satisfação.'
  },
  {
    id: 'execucao_fiscal',
    name: '7) Execução Fiscal (Custas Finais do Vencido)',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, Lei 11.608/2003 e regulamentos específicos',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'Múltiplas',
    legalExplanation: 'Até 02/01/2024: Cobrado 1% relativo à distribuição inicial + 1% sobre a satisfação (ambos de 5 a 3000 UFESPs), mais despesas processuais. A partir de 03/01/2024: Taxa única de 2% do valor do crédito a cargo do devedor vencido, além do repasse de despesas administrativas.'
  },
  {
    id: 'agravo_instrumento',
    name: '8) Agravo de Instrumento',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, § 5º, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Recurso contra decisões interlocutórias de primeiro grau. Até 02/01/2024: Taxa fixa de 10 UFESPs. A partir de 03/01/2024: Taxa fixa de 15 UFESPs. Caso o agravo encerre mérito integral do processo, aplica-se o critério da Apelação (4%, limites de 5 a 3.000).'
  },
  {
    id: 'cartas_prec_ord_arb',
    name: '9) Cartas de Ordem, Arbitrais e Precatórias',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, § 2º, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Processamento de atos deprecados entre comarcas paulistas ou outros tribunais. Taxa fixa de 10 UFESPs indômita de data. Isenta em competência criminal pública e menores regulados.'
  },
  {
    id: 'partilha_inventario',
    name: '10) Adjudicação ou Homologação de Partilha (Inventários)',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, § 7º, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Custas judiciais de Inventário, Divórcio Consensual Judicial e Partilhas de Bens em geral. Paga-se antes do julgamento final da partilha sobre o Monte-mor (inventariado): até 50k (10 UFESPs); 50k-500k (100 UFESPs); 500k-2M (300 UFESPs); 2M-5M (1.000 UFESPs); acima de 5M (3.000 UFESPs).'
  },
  {
    id: 'habilitacao_credito',
    name: '11) Habilitação Retardatária de Crédito',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Lei nº 11.101/2005 e Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Petito para habilitar crédito atrasado no concurso de credores. Segue exatamente a mesma regra monetária da petição inicial (1% ou 1.5% da causa, min 5 UFESPs) e, se houver recursos secundários, o preparo de 4%.'
  },
  {
    id: 'acao_penal_geral',
    name: '12) Ações Penais em Geral',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, IX, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Taxa judiciária devida ao final do processo exclusivamente pelo réu vencido/condenado. Taxa judiciária equivalente a 100 UFESPs.'
  },
  {
    id: 'acao_penal_privada',
    name: '13) Ações Penais Privadas (Queixa-crime)',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, § 11, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Taxa judiciária de recolhimento inicial e incidental obrigatório nas queixas-crime particulares: 50 UFESPs na distribuição inicial + 50 UFESPs no momento da interposição de recursos.'
  },
  {
    id: 'litisconsorcio_ativo',
    name: '14) Litisconsórcio Ativo Voluntário',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, § 10, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Adição de autores facultativa. Além do valor próprio da inicial, calcula-se e soma-se uma taxa penalizadora de 10 UFESPs extras por cada lote ou fração de 10 autores que superem os primeiros 10 autores.'
  },
  {
    id: 'litiscorso_ulterior',
    name: '15) Litisconsorte Ulterior e Assistência',
    section: 'Procedimento Comum e Execuções',
    baseLegal: 'Art. 4º, § 1º, Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Intervenções tardias voluntárias. O terceiro interveniente que se habilita paga exatamente a mesma quantia retroativa que o autor inicial já houver recolhido à comarca tributada até aquele momento.'
  },
  
  // Juizados Especiais Cíveis (JEC)
  {
    id: 'jec_recurso_inominado',
    name: 'JEC - 1) Recurso Inominado (Preparo)',
    section: 'Juizados Especiais Cíveis (JEC)',
    baseLegal: 'Art. 54, parágrafo único, Lei Federal nº 9.099/1995 c/c Lei Estadual nº 11.608/2003',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'Múltiplas',
    legalExplanation: 'No JEC, as taxas iniciais são isentas. Todavia, ao interpor o Recurso Inominado, o preparo engloba cumulativamente duas taxas de formas isoladas: 1) Taxa de ingresso dispensada (1.5% ou 2% ou 1% sobre valor da causa, piso de 5 UFESPs) MAIS 2) Taxa recursal de preparo (4% sobre condenação ou causa, piso de 5 UFESPs). O piso de 5 se aplica separadamente nas parcelas antes de somá-las! Não há teto de 3.000 UFESPs no JEC.'
  },
  {
    id: 'jec_cumprimento_sentenca',
    name: 'JEC - 2) Cumprimento de Sentença',
    section: 'Juizados Especiais Cíveis (JEC)',
    baseLegal: 'Lei Federal nº 9.099/1995',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'DARE',
    legalExplanation: 'Totalmente isento de custas no Juizado Cível por norma basilar, com a única exceção no caso de devedor punido judicialmente por má-fé ou se a parte perder algum recurso interlocutório secundário (2% do crédito pós-2024).'
  },
  {
    id: 'jec_ausencia_audiencia',
    name: 'JEC - 3) Taxa por Ausência Injustificada em Audiência',
    section: 'Juizados Especiais Cíveis (JEC)',
    baseLegal: 'Art. 51, I, § 2º, Lei nº 9.099/1995',
    defaultCode: CODES.DARE_TAXA_JUDICIARIA,
    source: 'Múltiplas',
    legalExplanation: 'Se a parte autora deixar de comparecer à audiência de conciliação ou instrução injustificadamente, o processo é extinto e ela deve pagar a taxa de ingresso integral como punição (1% pré-2024, 1.5% ou 2% pós-2024, mínimo de 5 UFESPs), além de despesas processuais.'
  },
  {
    id: 'jec_despesas_finais',
    name: 'JEC - 4) Despesas Pendentes ao Final do Processo',
    section: 'Juizados Especiais Cíveis (JEC)',
    baseLegal: 'Portaria e Provimentos do Conselho do JEC',
    defaultCode: CODES.FEDTJ_DESPESAS,
    source: 'FEDTJ',
    legalExplanation: 'Consolidação de cobrança de correios (AR), oficial de justiça (GRD) ou editais que não foram previamente satisfeitos por deferimento ou isenção na frentaria.'
  }
];
