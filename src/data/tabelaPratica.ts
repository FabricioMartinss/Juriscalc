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
  { ano: 2025, valor: 37.02 },
  { ano: 2024, valor: 35.36 },
  { ano: 2023, valor: 34.26 },
  { ano: 2022, valor: 31.97 },
  { ano: 2021, valor: 29.09 },
  { ano: 2020, valor: 27.61 },
];

/**
 * Tabela Prática de Atualização Monetária do TJSP (Índices INPC/TJSP consolidado)
 * de Janeiro de 2020 a Julho de 2026 para fins de cálculo de correção financeira.
 */
export const TABELA_PRATICA_TJSP: IndexMes[] = [
  // 2020
  { ano: 2020, mes: 1, indexValue: 73.008384 },
  { ano: 2020, mes: 2, indexValue: 73.147099 },
  { ano: 2020, mes: 3, indexValue: 73.271449 },
  { ano: 2020, mes: 4, indexValue: 73.403337 },
  { ano: 2020, mes: 5, indexValue: 73.234509 },
  { ano: 2020, mes: 6, indexValue: 73.051422 },
  { ano: 2020, mes: 7, indexValue: 73.270576 },
  { ano: 2020, mes: 8, indexValue: 73.592966 },
  { ano: 2020, mes: 9, indexValue: 73.857900 },
  { ano: 2020, mes: 10, indexValue: 74.500463 },
  { ano: 2020, mes: 11, indexValue: 75.163517 },
  { ano: 2020, mes: 12, indexValue: 75.877570 },
  
  // 2021
  { ano: 2021, mes: 1, indexValue: 76.985382 },
  { ano: 2021, mes: 2, indexValue: 77.193242 },
  { ano: 2021, mes: 3, indexValue: 77.826226 },
  { ano: 2021, mes: 4, indexValue: 78.495531 },
  { ano: 2021, mes: 5, indexValue: 78.793814 },
  { ano: 2021, mes: 6, indexValue: 79.550234 },
  { ano: 2021, mes: 7, indexValue: 80.027535 },
  { ano: 2021, mes: 8, indexValue: 80.843815 },
  { ano: 2021, mes: 9, indexValue: 81.555240 },
  { ano: 2021, mes: 10, indexValue: 82.533902 },
  { ano: 2021, mes: 11, indexValue: 83.491295 },
  { ano: 2021, mes: 12, indexValue: 84.192621 },

  // 2022
  { ano: 2022, mes: 1, indexValue: 84.807227 },
  { ano: 2022, mes: 2, indexValue: 85.375435 },
  { ano: 2022, mes: 3, indexValue: 86.229189 },
  { ano: 2022, mes: 4, indexValue: 87.703708 },
  { ano: 2022, mes: 5, indexValue: 88.615826 },
  { ano: 2022, mes: 6, indexValue: 89.014597 },
  { ano: 2022, mes: 7, indexValue: 89.566487 },
  { ano: 2022, mes: 8, indexValue: 89.029088 },
  { ano: 2022, mes: 9, indexValue: 88.753097 },
  { ano: 2022, mes: 10, indexValue: 88.469087 },
  { ano: 2022, mes: 11, indexValue: 88.884891 },
  { ano: 2022, mes: 12, indexValue: 89.222653 },

  // 2023
  { ano: 2023, mes: 1, indexValue: 89.838289 },
  { ano: 2023, mes: 2, indexValue: 90.251545 },
  { ano: 2023, mes: 3, indexValue: 90.946481 },
  { ano: 2023, mes: 4, indexValue: 91.528538 },
  { ano: 2023, mes: 5, indexValue: 92.013639 },
  { ano: 2023, mes: 6, indexValue: 92.344888 },
  { ano: 2023, mes: 7, indexValue: 92.252543 },
  { ano: 2023, mes: 8, indexValue: 92.169515 },
  { ano: 2023, mes: 9, indexValue: 92.353854 },
  { ano: 2023, mes: 10, indexValue: 92.455443 },
  { ano: 2023, mes: 11, indexValue: 92.566389 },
  { ano: 2023, mes: 12, indexValue: 92.658955 },

  // 2024
  { ano: 2024, mes: 1, indexValue: 93.168579 },
  { ano: 2024, mes: 2, indexValue: 93.699639 },
  { ano: 2024, mes: 3, indexValue: 94.458606 },
  { ano: 2024, mes: 4, indexValue: 94.638077 },
  { ano: 2024, mes: 5, indexValue: 94.988237 },
  { ano: 2024, mes: 6, indexValue: 95.425182 },
  { ano: 2024, mes: 7, indexValue: 95.663744 },
  { ano: 2024, mes: 8, indexValue: 95.912469 },
  { ano: 2024, mes: 9, indexValue: 96.094702 },
  { ano: 2024, mes: 10, indexValue: 96.219625 },
  { ano: 2024, mes: 11, indexValue: 96.739210 },
  { ano: 2024, mes: 12, indexValue: 97.338993 },

  // 2025
  { ano: 2025, mes: 1, indexValue: 97.669945 },
  { ano: 2025, mes: 2, indexValue: 97.777381 },
  { ano: 2025, mes: 3, indexValue: 98.980042 },
  { ano: 2025, mes: 4, indexValue: 99.613514 },
  { ano: 2025, mes: 5, indexValue: 100.041852 },
  { ano: 2025, mes: 6, indexValue: 100.402002 },
  { ano: 2025, mes: 7, indexValue: 100.663047 },
  { ano: 2025, mes: 8, indexValue: 100.995235 },
  { ano: 2025, mes: 9, indexValue: 100.853841 },
  { ano: 2025, mes: 10, indexValue: 101.337939 },
  { ano: 2025, mes: 11, indexValue: 101.520347 },
  { ano: 2025, mes: 12, indexValue: 101.723387 },

  // 2026
  { ano: 2026, mes: 1, indexValue: 101.977695 },
  { ano: 2026, mes: 2, indexValue: 102.181650 },
  { ano: 2026, mes: 3, indexValue: 103.039975 },
  { ano: 2026, mes: 4, indexValue: 103.493350 },
  { ano: 2026, mes: 5, indexValue: 104.414440 },
  { ano: 2026, mes: 6, indexValue: 105.061809 },
  { ano: 2026, mes: 7, indexValue: 105.492562 }, // Último índice oficial disponível 07/2026
];

export function buscarIndiceTJSP(ano: number, mes: number): { value: number; found: boolean } {
  const item = TABELA_PRATICA_TJSP.find((idx) => idx.ano === ano && idx.mes === mes);
  if (item) {
    return { value: item.indexValue, found: true };
  }
  // Fallback: se for antes de 2020, retorna o primeiro índice. Se pós-2026, retorna o último.
  if (ano < 2020) {
    return { value: 73.008384, found: false };
  }
  return { value: 105.492562, found: false };
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
