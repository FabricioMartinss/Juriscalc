/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Subsystem = 'esaj' | 'eproc';

export type CalculationCategory =
  // Módulo I: Procedimento Comum e Execuções
  | 'iniciais'                  // 1) Petições iniciais, reconvenção e embargos (inclusive à Execução Fiscal)
  | 'exec_titulo_extrajudicial' // 2) Distribuição da Execução de Título Extrajudicial
  | 'apelacao_recurso_adesivo'  // 3) Interposição de Apelação e Recurso Adesivo
  | 'cumprimento_autos'         // 4) Instauração de Cumprimento de Sentença (nos próprios autos ou incidente)
  | 'cumprimento_div_orgao'     // 5) Distribuição de Cumprimento de Sentença (título de outro órgão / arbitral)
  | 'satisfacao_exec_cumpr'     // 6) Satisfação da Execução ou Cumprimento de Sentença
  | 'execucao_fiscal'           // 7) Execução Fiscal
  | 'agravo_instrumento'        // 8) Agravo de Instrumento
  | 'cartas_prec_ord_arb'       // 9) Cartas de Ordem, Arbitrais e Precatórias
  | 'partilha_inventario'       // 10) Adjudicação ou Homologação de Partilha (Inventário, Arrolamento, Divórcio)
  | 'habilitacao_credito'       // 11) Habilitação Retardatária de Crédito (Recuperação e Falência)
  | 'acao_penal_geral'          // 12) Ações Penais em Geral (Salvo competência do JECRIM)
  | 'acao_penal_privada'        // 13) Ações Penais Privadas
  | 'litisconsorcio_ativo'      // 14) Litisconsórcio Ativo Voluntário
  | 'litiscorso_ulterior'       // 15) Litisconsorte Ativo Voluntário Ulterior e Assistente
  // Módulo II: Juizados Especiais Cíveis (JEC)
  | 'jec_recurso_inominado'     // 1) Recurso Inominado (JEC) - Ingresso + Preparo
  | 'jec_cumprimento_sentenca'  // 2) Cumprimento de Sentença (JEC)
  | 'jec_ausencia_audiencia'    // 3) Taxa de Ingresso por Ausência Injustificada (JEC)
  | 'jec_despesas_finais';       // 4) Despesas Pendentes ao Final (JEC)

export type TipoTabelaCorrecao = 'nova_tabela' | 'antiga_tabela' | 'ipca_e';

export interface CalculationInputs {
  category: CalculationCategory;
  subsystem: Subsystem;
  
  // Opção de Tabela de Correção Monetária do TJSP
  tipoTabelaCorrecao?: TipoTabelaCorrecao;
  
  // Datas e Épocas
  dataPeticionamento: string; // YYYY-MM-DD
  isPosCutoff: boolean;       // Se a partir de 03/01/2024
  
  // Valores da Causa e Condenação
  valorCausa: number;         // R$ valor bruto
  valorCausaAtualizadoOptional?: number; // Valor apurado pós correção
  isCausaAtualizada: boolean;
  dataDistribuicaoCausa?: string; // YYYY-MM para correção financeira
  
  valorCondenacao: number;    // R$ se houver
  isCondenacaoLiquida: boolean;
  valorCreditoExigido?: number; // Para cumprimento de sentença
  
  // Condições especiais do JEC ou Execuções
  isTituloExtrajudicial: boolean;
  isRecursoMeritoIntegral: boolean; // Para Agravo de Instrumento que decide mérito
  
  // Dados de Litisconsórcio / Partilha / Quantidades
  quantidadeAutores: number;     // Para item 14 de Litisconsórcio
  valorMonteMor: number;         // Para item 10 de Inventário/Partilha
  quantidadeEnderecos: number;   // Para despesas postais (FEDTJ)
  quantidadeAtosOficial: number; // Para diligências (GRD)
  
  // Caso de Borda / Exceções Jurídicas
  tipoExcecao: 'nenhuma' | 'isencao_legal' | 'embargos_declaracao' | 'justica_gratuita_integral' | 'justica_gratuita_parcial';
  porcentagemDescontoGratuita: number; // E.g., 50% de desconto
  isPreparoEmDobro: boolean;           // Art. 1007, § 4º CPC
  
  // Filtros de JEC específicos
  jecCumprimentoIsMaféOuImprovido: boolean; // Boolean para a exceção do JEC
}

export interface CalculatedItem {
  name: string;
  source: string;       // E.g., "DARE", "FEDTJ", "GRD"
  description: string;
  value: number;        // em Reais (BRL)
  code: string;         // Código de receita da guia (ex: 230-6, 120-1)
  baseLegal: string;
}

export interface CalculationResult {
  itens: CalculatedItem[];
  valorTotal: number;
  isDesertoOuImpossivel: boolean;
  mensagemBloqueio?: string;
  detalheMemoria: string; // Memo / Espelho de cálculo formatado em plain text para colar na petição
}

export interface IndexMes {
  ano: number;
  mes: number; // 1-indexed
  indexValue: number; // Índice da tabela prática do TJSP
}
