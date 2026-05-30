/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculationInputs, CalculationResult, CalculatedItem, TipoTabelaCorrecao } from '../types';
import { UFESP_2026, CUTOFF_DATE, CODES } from '../data/tabelaPratica';
import { buscarIndiceOficial } from '../data/tabelasOficiais';

/**
 * Converte valor float em centavos inteiros para evitar quebra de ponto flutuante
 */
function paraCentavos(valor: number): number {
  return Math.round(valor * 100);
}

/**
 * Converte centavos inteiros de volta para float com duas casas decimais
 */
function paraReais(centavos: number): number {
  return parseFloat((centavos / 100).toFixed(2));
}

/**
 * Executa a correção monetária pelo cruzamento dos índices da Tabela Prática do TJSP.
 * Fórmula: Valor_Atualizado = Valor_Original * (Indice_Atual / Indice_Distribuicao)
 */
export function corrigirMonetariamente(
  valorOriginal: number,
  dataDistribuicao: string, // YYYY-MM
  tabela: TipoTabelaCorrecao = 'nova_tabela',
  dataAtual: string = '2026-05' // Mês Corrente do TJSP
): { valorAtualizado: number; indiceOrigem: number; indiceAtual: number; success: boolean } {
  if (!dataDistribuicao) {
    return { valorAtualizado: valorOriginal, indiceOrigem: 1, indiceAtual: 1, success: false };
  }

  const [anoOrigem, mesOrigem] = dataDistribuicao.split('-').map(Number);
  const [anoAtual, mesAtual] = dataAtual.split('-').map(Number);

  const idxOrigem = buscarIndiceOficial(tabela, anoOrigem, mesOrigem);
  const idxAtual = buscarIndiceOficial(tabela, anoAtual, mesAtual);

  if (!idxOrigem.found || !idxAtual.found) {
    // Retorna com aproximação, mas avisa
    const updatedRaw = paraCentavos(valorOriginal) * idxAtual.value / idxOrigem.value;
    return {
      valorAtualizado: paraReais(updatedRaw),
      indiceOrigem: idxOrigem.value,
      indiceAtual: idxAtual.value,
      success: false,
    };
  }

  const valorCentavos = paraCentavos(valorOriginal);
  const atualizadoCentavos = Math.round(valorCentavos * (idxAtual.value / idxOrigem.value));
  
  return {
    valorAtualizado: paraReais(atualizadoCentavos),
    indiceOrigem: idxOrigem.value,
    indiceAtual: idxAtual.value,
    success: true,
  };
}

/**
 * Função Central de Limitação Matemática (Clamp / Trava)
 * Garante que a taxa judiciária respeite um piso e teto em UFESPs.
 */
export function calcularTaxaComTrava(
  valorBase: number,
  aliquotaDecimal: number,
  minUFESP: number = 5,
  maxUFESP: number = 3000,
  ufespValor: number = UF_2026()
): { valorCalculado: number; isPiso: boolean; isTeto: boolean; valorBruto: number } {
  const baseCents = paraCentavos(valorBase);

  // Cálculo bruto em centavos: base_em_centavos * alíquota (ex.: 0,015).
  const brutoCents = Math.round(baseCents * aliquotaDecimal);
  
  const pisoCents = paraCentavos(minUFESP * ufespValor);
  const tetoCents = paraCentavos(maxUFESP * ufespValor);
  
  let finalCents = brutoCents;
  let isPiso = false;
  let isTeto = false;

  if (brutoCents < pisoCents) {
    finalCents = pisoCents;
    isPiso = true;
  } else if (brutoCents > tetoCents) {
    finalCents = tetoCents;
    isTeto = true;
  }

  return {
    valorCalculado: paraReais(finalCents),
    isPiso,
    isTeto,
    valorBruto: paraReais(brutoCents)
  };
}

function UF_2026(): number {
  return UFESP_2026;
}

export function fazerCalculoCompleto(inputs: CalculationInputs): CalculationResult {
  const ufesp = UFESP_2026;
  const isPos2024 = inputs.isPosCutoff || (inputs.dataPeticionamento >= CUTOFF_DATE);

  const itens: CalculatedItem[] = [];
  let isDesertoOuImpossivel = false;
  let mensagemBloqueio: string | undefined = undefined;
  let detalheMemoria = ``;

  // --- TRATAMENTO DOS CASOS DE BLOQUEIO / EXCEÇÕES UNITÁRIAS ---
  if (inputs.tipoExcecao === 'justica_gratuita_integral') {
    return {
      itens: [],
      valorTotal: 0,
      isDesertoOuImpossivel: false,
      mensagemBloqueio: 'Beneficiário de Justiça Gratuita INTEGRAL. Todas as taxas judiciárias e despesas processuais estão legalmente isentas (Art. 98, § 1º, CPC). Nenhuma guia deve ser emitida.',
      detalheMemoria: `=====================================================
EMISSÃO DE GUIAS BLOQUEADA - EXCESSÃO JURÍDICA
=====================================================
Parte: Beneficiária de Gratuidade de Justiça Integral
Base Legal: Art. 98, CPC (Isenção Integral de custas)
Ação Recomendada: Não emitir guias. Juntar declaração/decisão que deferiu o benefício.`
    };
  }

  if (inputs.tipoExcecao === 'embargos_declaracao') {
    return {
      itens: [],
      valorTotal: 0,
      isDesertoOuImpossivel: true,
      mensagemBloqueio: 'Alerta Processual: Conforme o Art. 1.023 do CPC, os Embargos de Declaração não possuem exigência de recolhimento de preparo ou taxa judiciária no TJSP. Travado para evitar pagamentos indevidos.',
      detalheMemoria: `=====================================================
EMISSÃO DE GUIAS BLOQUEADA - EMBARGOS DE DECLARAÇÃO
=====================================================
Recurso selecionado: Embargos de Declaração
Fundamentação Técnica: Art. 1.023 do Código de Processo Civil.
Observação: Não há exigência de preparo no Tribunal de Justiça de São Paulo.`
    };
  }

  if (inputs.tipoExcecao === 'isencao_legal') {
    return {
      itens: [],
      valorTotal: 0,
      isDesertoOuImpossivel: false,
      mensagemBloqueio: 'Isenção Legal Detectada: A Fazenda Pública (União, Estados, Municípios e autarquias) bem como o Ministério Público são isentas do recolhimento de taxas judiciárias prévias (Art. 1.007, § 1º, do CPC).',
      detalheMemoria: `=====================================================
MEMÓRIA DE ISENÇÃO LEGAL - FAZENDA PÚBLICA / MP
=====================================================
Parte Isenta: Fazenda Pública / Ministério Público
Fundamentação: Artigo 1.007, § 1º do Código de Processo Civil.
Observação: Isento do recolhimento de custas prévias. Custas serão cobradas ao final do vencido particular, se houver.`
    };
  }

  // Se houver correção monetária da causa solicitada:
  let valorCausaEfetivo = inputs.valorCausa;
  let memoCorrecao = '';
  
  if (inputs.isCausaAtualizada && inputs.dataDistribuicaoCausa) {
    const tabelaSelecionada = inputs.tipoTabelaCorrecao || 'nova_tabela';
    const { valorAtualizado, indiceOrigem, indiceAtual } = corrigirMonetariamente(
      inputs.valorCausa,
      inputs.dataDistribuicaoCausa,
      tabelaSelecionada
    );
    valorCausaEfetivo = valorAtualizado;
    const nomeTabela = tabelaSelecionada === 'nova_tabela'
      ? 'Nova Tabela Prática - Lei n. 14.905/2024'
      : tabelaSelecionada === 'antiga_tabela'
      ? 'Antiga Tabela Prática - Jurisprudência Predominante'
      : 'Tabela IPCA-E';
    memoCorrecao = `\n- Correção Financeira da Causa:\n  * Valor Inicial: R$ ${inputs.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n  * Data da Distribuição: ${inputs.dataDistribuicaoCausa}\n  * Índice Origem: ${indiceOrigem}\n  * Índice Atual (05/2026): ${indiceAtual}\n  * Valor Atualizado: R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${nomeTabela})`;
  }

  let baseCaculoExplanacao = `Valor da Causa Base: R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (UFESP 2026: R$ ${ufesp})`;

  // --- CÁLCULO GERAL SECUNDÁRIO E POSTAIS (SEMPRE FEDTJ E GRD) ---
  const tarifaPostalFlat = 38.30; // Tarifa TJSP Envelopamento AR em 2026
  const tarifaDiligenciaOficial = 3 * ufesp; // 3 UFESPs por ato em 2026

  if (inputs.quantidadeEnderecos > 0) {
    const valorPostalTotal = paraReais(inputs.quantidadeEnderecos * paraCentavos(tarifaPostalFlat));
    itens.push({
      name: 'Despesas Postais (Citação/Intimação por AR)',
      source: 'FEDTJ',
      description: `${inputs.quantidadeEnderecos} Citações/Intimações postais pela via dos Correios (AR).`,
      value: valorPostalTotal,
      code: CODES.FEDTJ_DESPESAS,
      baseLegal: 'Provimento CSM nº 2.516/2019 e Comunicado CGJ nº 951/2023'
    });
  }

  if (inputs.quantidadeAtosOficial > 0) {
    const valorDiligenciaTotal = paraReais(inputs.quantidadeAtosOficial * paraCentavos(tarifaDiligenciaOficial));
    itens.push({
      name: 'Diligências do Oficial de Justiça (GRD)',
      source: 'GRD',
      description: `${inputs.quantidadeAtosOficial} Atos de diligência externa por Oficial de Justiça.`,
      value: valorDiligenciaTotal,
      code: CODES.GRD_DILIGENCIA_OFICIAL,
      baseLegal: 'Normas de Serviço da CGJ e Provimento vigente (3 UFESPs por ato em comarca comum)'
    });
  }

  // --- MÓDULO I: PROCEDIMENTO COMUM E EXECUÇÕES (Formula Certa) ---
  switch (inputs.category) {
    case 'iniciais': {
      const aliquota = isPos2024 ? 0.015 : 0.01;
      const { valorCalculado, isPiso, isTeto } = calcularTaxaComTrava(valorCausaEfetivo, aliquota, 5, 3000, ufesp);
      
      itens.push({
        name: 'Taxa Judiciária Inicial',
        source: 'DARE',
        description: `Petição Inicial/Reconvenção. Alíquota de ${(aliquota * 100).toFixed(1)}% sobre valor da causa${isPiso ? ' (aplicado valor mínimo)' : isTeto ? ' (aplicado teto legal)' : ''}.`,
        value: valorCalculado,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: isPos2024 ? 'Art. 4º, I, Lei nº 11.608/03 (Redação dada pela Lei nº 17.785/23)' : 'Art. 4º, I, Lei nº 11.608/03 (Redação anterior)'
      });

      detalheMemoria = `MEMÓRIA DE CÁLCULO - INICIAIS, RECONVENÇÃO E EMBARGOS (TJSP)
-----------------------------------------------------------------
Enquadramento Legal: Art. 4º, I da Lei Paulista nº 11.608/2003
Época de Peticionamento: ${isPos2024 ? 'PÓS-03/01/2024 (Lei nº 17.785/2023)' : 'PRÉ-03/01/2024'}
Alíquota Aplicável: ${(aliquota * 100).toFixed(1)}%${memoCorrecao}
Base de Cálculo Tributária: R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
UFESP do Exercício Corrente (2026): R$ ${ufesp}
Trava de Segurança: Piso de 5 UFESPs (R$ ${(u_calc(5)).toFixed(2)}) e Teto de 3.000 UFESPs (R$ ${(u_calc(3000)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
Cálculo Bruto: R$ ${(valorCausaEfetivo * aliquota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Resultado Concluído: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isPiso ? '[MÍNIMO EXIGIDO]' : isTeto ? '[TETO LIMITADOR]' : ''}`;
      break;
    }

    case 'exec_titulo_extrajudicial': {
      if (!isPos2024) {
        // Pré-2024: 1% na distribuição e 1% ao final (satisfação)
        const d1 = calcularTaxaComTrava(valorCausaEfetivo, 0.01, 5, 3000, ufesp).valorCalculado;
        itens.push({
          name: 'Taxa Judiciária - Distribuição de Execução',
          source: 'DARE',
          description: 'Distribuição de Título Extrajudicial (Regra Pré-2024). Alíquota de 1% (Piso 5, Teto 3000 UFESP).',
          value: d1,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, I, Lei nº 11.608/03'
        });
        detalheMemoria = `MEMÓRIA DE CÁLCULO - EXECUÇÃO EXTRAJUDICIAL (CONTRATO PRÉ-2024)
-----------------------------------------------------------------
Diretrizes: Alíquota de 1% devida na distribuição, mais 1% ao final (satisfação - item 6).
Base de Cálculo: R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
UFESP: R$ ${ufesp}
Distribuição Inicial a Pagar: R$ ${d1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else {
        // Pós-2024: Unificado 2% sobre valor atualizado da causa (que deve somar honorários se sugerido, vamos focar no valorCausa)
        // O valor da causa em execuções de título extrajudicial já integra a dívida e acessórios
        const { valorCalculado, isPiso, isTeto } = calcularTaxaComTrava(valorCausaEfetivo, 0.02, 5, 3000, ufesp);
        itens.push({
          name: 'Taxa Judiciária - Distribuição Execução Extrajudicial',
          source: 'DARE',
          description: 'Distribuição de Execução Unificada (Regra Pós-2024). Alíquota de 2% do valor global.',
          value: valorCalculado,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, § 3º, Lei nº 11.608/03 (acrescido pela Lei nº 17.785/23)'
        });
        detalheMemoria = `MEMÓRIA DE CÁLCULO - EXECUÇÃO EXTRAJUDICIAL (CONTRATO PÓS-2024)
-----------------------------------------------------------------
Norma Legal: Art. 4º, § 3º da Lei nº 11.608/2003 (Unificado)
Alíquota Aplicável: 2% sobre o valor da causa executada
Base de Cálculo: R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${memoCorrecao}
Piso/Teto: Min de 5 UFESPs (R$ ${(u_calc(5)).toFixed(2)}) / Max de 3.000 UFESPs (R$ ${(u_calc(3000)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
Resultado Concluído: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isPiso ? '[MÍNIMO]' : isTeto ? '[MÁXIMO]' : ''}`;
      }
      break;
    }

    case 'apelacao_recurso_adesivo': {
      // 4% do valor da condenação substancial ou, na falta dela, sobre o valor da causa atualizado
      const temCondenacao = inputs.valorCondenacao > 0;
      const baseRecurso = temCondenacao ? inputs.valorCondenacao : valorCausaEfetivo;
      const { valorCalculado, isPiso, isTeto } = calcularTaxaComTrava(baseRecurso, 0.04, 5, 3000, ufesp);

      itens.push({
        name: 'Taxa Judiciária - Preparo de Apelação',
        source: 'DARE',
        description: `Preparo Recursal (Apelação ou Recurso Adesivo). Alíquota de 4.0% sobre o valor ${temCondenacao ? 'de condenação fixado' : 'da causa atualizado'}.`,
        value: valorCalculado,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: 'Art. 4º, II, Lei Estadual nº 11.608/2003'
      });

      detalheMemoria = `MEMÓRIA DE CÁLCULO - PREPARO DE APELAÇÃO / RECURSO ADESIVO (TJSP)
-----------------------------------------------------------------
Fundamentação Legal: Artigo 4º, II, da Lei Estadual nº 11.608/2003
Base Escolhida: ${temCondenacao ? `Valor da Condenação (Líquido: R$ ${inputs.valorCondenacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : `Ausência de Condenação. Aplicado valor da causa atualizado: R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}${memoCorrecao}
Alíquota de Preparo: 4.0%
UFESP (2026): R$ ${ufesp}
Limites Exigidos: Mínimo de 5 UFESPs (R$ ${(u_calc(5)).toFixed(2)}) e Máximo de 3.000 UFESPs (R$ ${(u_calc(3000)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
Cálculo Bruto Encontrado: R$ ${(baseRecurso * 0.04).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total de Preparo: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isPiso ? '[MÍNIMO INCIDENTE]' : isTeto ? '[TETO INCIDENTE]' : ''}`;
      break;
    }

    case 'cumprimento_autos': {
      if (!isPos2024) {
        // Isento na frentaria antes de 2024
        detalheMemoria = `CÁLCULO - INSTAURAÇÃO DE CUMPRIMENTO DE SENTENÇA (AUTOS PRÓPRIOS - PRÉ 2024)
-----------------------------------------------------------------
Diretrizes: Conforme Lei anterior, a instauração nos próprios autos é ISENTA de recolhimento inicial, cobrando-se apenas taxa de satisfação final (item 6) correspondente a 1% se houver atos efetivos.`;
      } else {
        const credito = inputs.valorCreditoExigido || valorCausaEfetivo;
        const { valorCalculado, isPiso, isTeto } = calcularTaxaComTrava(credito, 0.02, 5, 3000, ufesp);
        itens.push({
          name: 'Taxa Judiciária - Instauração de Cumprimento de Sentença',
          source: 'DARE',
          description: 'Cumprimento de Sentença em autos próprios (Pós-2024). Alíquota de 2% cobrada no início sobre o valor do crédito.',
          value: valorCalculado,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, Lei nº 11.608/03'
        });
        detalheMemoria = `MEMÓRIA DE CÁLCULO - CUMPRIMENTO DE SENTENÇA (INCIDENTE PÓS 2024)
-----------------------------------------------------------------
Classificação Legal: Art. 4º, Nova redação pela Lei Paulista nº 17.785/2023
Base do Crédito Informada: R$ ${credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Alíquota Judiciária: 2.0% cobrados na instauração
Piso / Teto: de 5 UFESPs (R$ ${(u_calc(5)).toFixed(2)}) a 3.000 UFESPs (R$ ${(u_calc(3000)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
Total do Cumprimento: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isPiso ? '[MÍNIMO]' : isTeto ? '[MÁXIMO]' : ''}`;
      }
      break;
    }

    case 'cumprimento_div_orgao': {
      if (!isPos2024) {
        const d1 = calcularTaxaComTrava(valorCausaEfetivo, 0.01, 5, 3000, ufesp).valorCalculado;
        itens.push({
          name: 'Taxa Judiciária - Distribuição Cumprimento Título Externo',
          source: 'DARE',
          description: 'Cumprimento de Julgado Externo/Arbitral. Alíquota de 1% na distribuição.',
          value: d1,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, Lei 11.608/2003'
        });
        detalheMemoria = `MEMÓRIA - CUMPRIMENTO DE JULGADO DE JUIZO DISTINTO O ARBITRAL (PRÉ 2024)
-----------------------------------------------------------------
Alíquota: 1.0% do valor do crédito no início (piso 5 UFESP)
Pagar inicial: R$ ${d1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else {
        const credito = inputs.valorCreditoExigido || valorCausaEfetivo;
        const { valorCalculado, isPiso, isTeto } = calcularTaxaComTrava(credito, 0.02, 5, 3000, ufesp);
        itens.push({
          name: 'Taxa Judiciária - Distribuição Cumprimento Título Externo',
          source: 'DARE',
          description: 'Cumprimento de Julgado Externo/Arbitral (Pós 2024). Alíquota unificada de 2.0% cobrada no início.',
          value: valorCalculado,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º da Lei Estadual 11.608/2003 (Lei nº 17.785/23)'
        });
        detalheMemoria = `MEMÓRIA DE CÁLCULO - CUMPRIMENTO DE JULGADO EXTERNO (PÓS 2024)
-----------------------------------------------------------------
Alíquota cobrada: 2.0% da quantia demandada.
Base Calculada: R$ ${credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total de Guia de Distribuição: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      break;
    }

    case 'satisfacao_exec_cumpr': {
      if (isPos2024) {
        detalheMemoria = `CÁLCULO - SATISFAÇÃO DA EXECUÇÃO (PÓS-2024)
-----------------------------------------------------------------
Observação de Isenção: De acordo com a reforma legal paulista, se o processo foi instaurado ou distribuído a partir de 03/01/2024 com o pagamento de 2%, a satisfação do julgado ao final é ISENTA de novas custas judiciárias.`;
      } else {
        // Pré-2024: 1% sobre valor da satisfação do crédito
        const baseSat = inputs.valorCreditoExigido || valorCausaEfetivo;
        const { valorCalculado, isPiso } = calcularTaxaComTrava(baseSat, 0.01, 5, 3000, ufesp);
        itens.push({
          name: 'Taxa Judiciária - Satisfação de Sentença/Execução',
          source: 'DARE',
          description: 'Taxa judiciária devida na extinção pelo pagamento ou adjudicação (Regras Pré-2024). Alíquota de 1% da satisfação.',
          value: valorCalculado,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, III, Lei Estadual nº 11.608/03 (Anterior)'
        });
        detalheMemoria = `MEMÓRIA DE CÁLCULO - SATISFAÇÃO DO CRÉDITO (REGRAS PRÉ-2024)
-----------------------------------------------------------------
Fundamento: Artigo 4º, III (versão antiga) - 1.0% do valor pago/satisfeito.
Base da Satisfação: R$ ${baseSat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total Devido: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isPiso ? '[LIMITADO AO PISO 5 UFESPs]' : ''}`;
      }
      break;
    }

    case 'execucao_fiscal': {
      if (!isPos2024) {
        // 1% inicial + 1% final, cada um com limite de 5 a 3000
        const v1 = calcularTaxaComTrava(valorCausaEfetivo, 0.01, 5, 3000, ufesp).valorCalculado;
        itens.push({
          name: 'Taxa Judiciária Finais Devedor (Distribuição)',
          source: 'DARE',
          description: 'Taxa devida pelo devedor vencido referente ao ato de distribuição da execução fiscal.',
          value: v1,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, Lei nº 11.608/03'
        });
        detalheMemoria = `MEMÓRIA DE CÁLCULO - EXECUÇÃO FISCAL (PRÉ-2024)
-----------------------------------------------------------------
Regra: 1% na distribuição inicial, cobrada ao final do executado vencido.
Base Tributável: R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total DARE: R$ ${v1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Piso 5 UFESP: R$ ${(u_calc(5)).toFixed(2)})`;
      } else {
        // 2% sobre valor do crédito
        const { valorCalculado, isPiso } = calcularTaxaComTrava(valorCausaEfetivo, 0.02, 5, 3000, ufesp);
        itens.push({
          name: 'Taxa Judiciária Única - Execução Fiscal',
          source: 'DARE',
          description: 'Taxa devida pelo vencido ao final de Execução Fiscal (Regra Pós-2024). Alíquota única de 2%.',
          value: valorCalculado,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, Lei Estadual 11.608/03 (Lei nº 17.785/23)'
        });
        detalheMemoria = `MEMÓRIA DE CÁLCULO - EXECUÇÃO FISCAL (PÓS-2024)
-----------------------------------------------------------------
Regra Atual: Unificado em 2% da execução, devido ao final ou no arquivamento.
Dívida totalizada: R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Valor Geral a Recolher: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      break;
    }

    case 'agravo_instrumento': {
      if (inputs.isRecursoMeritoIntegral) {
        // Regra do Artigo 4º, § 5º: se versar sobre mérito recursal definitivo, calcula igual à apelação (4%)
        const baseRecurso = inputs.valorCondenacao > 0 ? inputs.valorCondenacao : valorCausaEfetivo;
        const { valorCalculado, isPiso, isTeto } = calcularTaxaComTrava(baseRecurso, 0.04, 5, 3000, ufesp);
        itens.push({
          name: 'Taxa Judiciária - Agravo de Instrumento de Mérito Integral',
          source: 'DARE',
          description: 'Preparo de Agravo de Instrumento que versa sobre mérito de forma definitiva (Equiparado à Apelação - 4%).',
          value: valorCalculado,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, § 5º da Lei nº 11.608/03 (Redação dada pela Lei nº 17.785/23)'
        });
        detalheMemoria = `MEMÓRIA DE CÁLCULO - AGRAVO DE INSTRUMENTO (MÉRITO INTEGRAL)
-----------------------------------------------------------------
Equiparado por Força de Lei à Apelação Cível: Decisão que versa sobre o mérito integral.
Alíquota Judiciária: 4.0%
Base de Incidência: R$ ${baseRecurso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Valor Geral a Pagar: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isPiso ? '[MÍNIMO]' : isTeto ? '[MÁXIMO]' : ''}`;
      } else {
        // Taxa fixa em UFESPs
        const qtdUfesps = isPos2024 ? 15 : 10;
        const totalFixo = paraReais(qtdUfesps * paraCentavos(ufesp));
        itens.push({
          name: 'Taxa Judiciária - Agravo de Instrumento',
          source: 'DARE',
          description: `Preparo Recursal com valor fixo para Agravo de Instrumento ordinário: ${qtdUfesps} UFESPs.`,
          value: totalFixo,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, § 5º, Lei nº 11.608/2003'
        });
        detalheMemoria = `MEMÓRIA DE CÁLCULO - AGRAVO DE INSTRUMENTO ORDINÁRIO (TAXA FIXA)
-----------------------------------------------------------------
Enquadramento: Preparo fixado em UFESPs para agravo interlocutório comum.
Época: ${isPos2024 ? 'Pós-2024 (15 UFESPs)' : 'Pré-2024 (10 UFESPs)'}
Variação Monetária: R$ ${ufesp} por UFESP
Totalizador Fixo da Guia DARE: R$ ${totalFixo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem travas variáveis adicionais)`;
      }
      break;
    }

    case 'cartas_prec_ord_arb': {
      const fixoUfesps = 10;
      const totalFixo = paraReais(fixoUfesps * paraCentavos(ufesp));
      itens.push({
        name: 'Taxa Judiciária - Cartas Precatórias / Arbitrais / de Ordem',
        source: 'DARE',
        description: `Taxa judiciária obrigatória para o recebimento de Carta de outra comarca. Fixo: 10 UFESPs.`,
        value: totalFixo,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: 'Art. 4º, § 2º, Lei Estadual nº 11.608/03'
      });
      detalheMemoria = `MEMÓRIA DE CÁLCULO - CARTAS DE PROCESSO (DESPACHADAS NO SP)
-----------------------------------------------------------------
Taxa fixa estipulada em Lei: 10 UFESPs
UFESP Vigente em São Paulo: R$ ${ufesp}
Total da Guia DARE: R$ ${totalFixo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem aplicação de teto tributário)`;
      break;
    }

    case 'partilha_inventario': {
      // Baseado em faixas do Monte-mor
      const monteMor = inputs.valorMonteMor;
      let ufespQtd = 0;
      let faixaMsg = '';

      if (monteMor <= 50000) {
        ufespQtd = 10;
        faixaMsg = 'Até R$ 50.000,00';
      } else if (monteMor <= 500000) {
        ufespQtd = 100;
        faixaMsg = 'De R$ 50.001,00 até R$ 500.000,00';
      } else if (monteMor <= 2000000) {
        ufespQtd = 300;
        faixaMsg = 'De R$ 500.001,00 até R$ 2.000.000,00';
      } else if (monteMor <= 5000000) {
        ufespQtd = 1000;
        faixaMsg = 'De R$ 2.000.001,00 até R$ 5.000.000,00';
      } else {
        ufespQtd = 3000;
        faixaMsg = 'Acima de R$ 5.000.000,00';
      }

      const totalPartilha = paraReais(ufespQtd * paraCentavos(ufesp));
      itens.push({
        name: `Taxa Judiciária Partilha/Inventário (${faixaMsg})`,
        source: 'DARE',
        description: `Homologação de Partilha ou Inventário sobre Monte-mor de R$ ${monteMor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${ufespQtd} UFESPs).`,
        value: totalPartilha,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: 'Art. 4º, § 7º, Lei Estadual nº 11.608/2003'
      });

      detalheMemoria = `MEMÓRIA DE CÁLCULO - ADJUDICAÇÃO OU INVENTÁRIO (TAXA TIERED)
-----------------------------------------------------------------
Normativo Legal: Artigo 4º, § 7º da Lei Paulista de Custas
Valor do Monte-mor Informado (Ativo Inventariado): R$ ${monteMor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Faixa de Enquadramento: ${faixaMsg}
Quantidade de UFESPs Exigidas: ${ufespQtd} UFESPs
Valor da UFESP Corrente (2026): R$ ${ufesp}
Total Consolidado da Guia DARE: R$ ${totalPartilha.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      break;
    }

    case 'habilitacao_credito': {
      // Mesma lógica de petição inicial: Alíquota inicial de 1% (pré-2024) ou 1.5% (pós)
      const aliquota = isPos2024 ? 0.015 : 0.01;
      const { valorCalculado, isPiso } = calcularTaxaComTrava(valorCausaEfetivo, aliquota, 5, 3000, ufesp);
      
      itens.push({
        name: 'Taxa Judiciária - Habilitação Retardatária de Crédito',
        source: 'DARE',
        description: `Habilitação de Crédito em inventário/recuperação judicial. Alíquota de ${(aliquota * 100).toFixed(1)}% do valor do crédito reclamado.`,
        value: valorCalculado,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: 'Art. 4º, I, Lei nº 11.608/23'
      });

      detalheMemoria = `MEMÓRIA DE CÁLCULO - HABILITAÇÃO RETARDATÁRIA DE CRÉDITO
-----------------------------------------------------------------
Equiparação Legal: Segue a regência de petição inicial comum (Art. 4, I)
Alíquota Aplicável: ${(aliquota * 100).toFixed(1)}% do valor do crédito demandado
Crédito Reclamado (Base): R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Valor Geral a Recolher: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isPiso ? '[MÍNIMO EXIGIDO DE 5 UFESPs]' : ''}`;
      break;
    }

    case 'acao_penal_geral': {
      const totalGeral = paraReais(100 * paraCentavos(ufesp));
      itens.push({
        name: 'Ações Penais Públicas (Custas do Réu Condenado)',
        source: 'DARE',
        description: 'Custas finais devidas unicamente em caso de condenação pelo réu ao fim do processo (100 UFESPs).',
        value: totalGeral,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: 'Art. 4º, IX, Lei Estadual nº 11.608/2003'
      });
      detalheMemoria = `CÁLCULO - AÇÃO PENAL REGULAR (TJSP)
-----------------------------------------------------------------
Natureza: Custas de sucumbência penal devidas exclusivamente pelo réu condenado.
Exigibilidade: Ao final da lide (trânsito em julgado).
Valoração: R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Fixado em 100 UFESPs)`;
      break;
    }

    case 'acao_penal_privada': {
      const valorD1 = paraReais(50 * paraCentavos(ufesp));
      itens.push({
        name: 'Taxa Queixa-Crime Privada (Abertura)',
        source: 'DARE',
        description: 'Recolhimento prévio obrigatório na distribuição da Queixa-crime (50 UFESPs).',
        value: valorD1,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: 'Art. 4º, § 11, Lei nº 11.608/2003'
      });
      detalheMemoria = `MEMÓRIA - AÇÕES PENAIS DE INICIATIVA PRIVADA
-----------------------------------------------------------------
Custas Estipuladas: 50 UFESPs no ato de distribuição e adicionais 50 UFESPs na interposição de recursos.
Valor Devido Inicialmente: R$ ${valorD1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (50 UFESPs)`;
      break;
    }

    case 'litisconsorcio_ativo': {
      // 10 UFESPs por grupo ou fração de 10 autores que superarem os primeiros 10 autores
      // Use Math.ceil(quantidadeAutores / 10). Wait, 15 authors: group size 2 (first 10, then next 5).
      // A lei diz: "fração que exceder esse número de 10 autores"
      // Então, se autores <= 10, o acréscimo é zero!
      // Se autores > 10, o número excedente é (autores - 10). Dividimos esse excedente por 10, arredondamos para cima, e multiplicamos por 10 UFESPs.
      let taxaExtra = 0;
      let gruposExcedentes = 0;

      if (inputs.quantidadeAutores > 10) {
        gruposExcedentes = Math.ceil((inputs.quantidadeAutores - 10) / 10);
        taxaExtra = paraReais(gruposExcedentes * 10 * paraCentavos(ufesp));
      }

      if (taxaExtra > 0) {
        itens.push({
          name: 'Taxa Adicional de Litisconsórcio Ativo Voluntário',
          source: 'DARE',
          description: `Custas extras de litisconsórcio. ${inputs.quantidadeAutores} autores, gerando ${gruposExcedentes} lote(s) de excesso (10 UFESPs por lote ou fração do excedente).`,
          value: taxaExtra,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 4º, § 10, Lei Paulista nº 11.608/2003'
        });
      }

      detalheMemoria = `MEMÓRIA DE CÁLCULO - TAXA DE EXCESSO LITISCONSORCIAL
-----------------------------------------------------------------
Dispositivo Regulador: Artigo 4º, § 10 da Lei Estadual nº 11.608/2003
Quantidade Total de Autores Qualificados: ${inputs.quantidadeAutores}
Autores Isentos de Sobretaxa: Primeiros 10 autores
Autores Excedentes: ${Math.max(0, inputs.quantidadeAutores - 10)}
Grupos ou frações calculadas (Math.ceil(excedente / 10)): ${gruposExcedentes} grupo(s)
Taxa Adicional Devida: R$ ${taxaExtra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Equivalente a ${gruposExcedentes * 10} UFESPs)`;
      break;
    }

    case 'litiscorso_ulterior': {
      const aliquota = isPos2024 ? 0.015 : 0.01;
      const { valorCalculado } = calcularTaxaComTrava(inputs.valorCausa, aliquota, 5, 3000, ufesp);
      
      itens.push({
        name: 'Taxa Judiciária Assistente / Litisconsorte Ulterior',
        source: 'DARE',
        description: `Ingresso do litisconsorte ulterior. Paga o equivalente que o autor original já houver desembolsado nesta lide.`,
        value: valorCalculado,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: 'Art. 4º, § 1º, Lei nº 11.608/2003'
      });
      detalheMemoria = `CÁLCULO - LITISCONSORTE ULTERIOR O ENTRADA DE ASSISTENTE
-----------------------------------------------------------------
Regulamento: O interveniente retardatário paga o mesmo que o autor inicial.
Base Recenseada: R$ ${inputs.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total de Guia de Entrada: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      break;
    }

    // --- MÓDULO II: JUIZADOS ESPECIAIS CÍVEIS (JEC) (Lógica Blindada de Pisos Isolados) ---
    case 'jec_recurso_inominado': {
      // ⚠️ CRÍTICO: Não se pode somar as alíquotas (ex: 1.5% + 4% = 5.5%).
      // O sistema deve calcular individualmente a Parcela A (Ingresso) e a Parcela B (Preparo).
      // Aplicar o piso mínimo de 5 UFESPs em cada uma de forma correspondente isolada.
      // E só no final somar as duas taxas na Guia Única DARE-SP!

      // 1) Parcela A - Ingresso (Taxa antes dispensada)
      let aliqIngresso = 0.015;
      let aliqLabel = '1.5%';
      
      if (!isPos2024) {
        aliqIngresso = 0.01;
        aliqLabel = '1.0%';
      } else if (inputs.isTituloExtrajudicial) {
        aliqIngresso = 0.02;
        aliqLabel = '2.0% (Título Extrajudicial)';
      }

      const { valorCalculado: valorIngresso, isPiso: ingressoIsPiso, valorBruto: ingressoBruto } = 
        calcularTaxaComTrava(inputs.valorCausa, aliqIngresso, 5, Infinity, ufesp); // Sem teto superior no JEC

      // 2) Parcela B - Preparo Recursal
      const basePreparo = inputs.valorCondenacao > 0 ? inputs.valorCondenacao : valorCausaEfetivo;
      const { valorCalculado: valorPreparo, isPiso: preparoIsPiso, valorBruto: preparoBruto } = 
        calcularTaxaComTrava(basePreparo, 0.04, 5, Infinity, ufesp); // Sem teto superior no JEC

      // Total DARE da taxa judiciária JEC
      const totalDareJec = paraReais(paraCentavos(valorIngresso) + paraCentavos(valorPreparo));

      itens.push({
        name: 'Guia Única DARE-SP (Ingresso JEC + Preparo)',
        source: 'DARE',
        description: `Preparo de Recurso Inominado somando: Parcela Ingresso (R$ ${valorIngresso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) + Parcela Recursal (R$ ${valorPreparo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Ambos os pisos de 5 UFESPs aplicados isoladamente.`,
        value: totalDareJec,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: 'Art. 54, parágrafo único, Lei n. 9.099/95 c/c Art. 4, I e II, Lei Estadual n. 11.608/03'
      });

      detalheMemoria = `=====================================================
MEMÓRIA DE PREPARO RETROATIVO - RECURSO INOMINADO JEC
=====================================================
Fundamentação: Artigo 54, parágrafo único da Lei Federal nº 9.099/1995.
Regra de Cálculo: Soma de duas parcelas com aplicação INDIVIDUAL de piso de 5 UFESPs.

PARCELA A: TAXA DE INGRESSO DISPENSADA NO 1º GRAU
-------------------------------------------------
Base de cálculo (Causa): R$ ${inputs.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Regra do Período: ${isPos2024 ? 'Pós-03/01/2024' : 'Pré-03/01/2024'}
Alíquota Aplicável: ${aliqLabel}
Valor Bruto Calculado: R$ ${ingressoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
UFESP Corrente (2026): R$ ${ufesp}
Piso Exigido isoladamente (5 UFESPs): R$ ${(u_calc(5)).toFixed(2)}
Valor Homologado para a Parcela A: R$ ${valorIngresso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${ingressoIsPiso ? '[TRAVA DO PISO APLICADA]' : ''}

PARCELA B: PREPARO RECURSAL
---------------------------
Base de cálculo: ${inputs.valorCondenacao > 0 ? `Valor da Sentença Condenatória (R$ ${inputs.valorCondenacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : `Ausência de Condenação. Aplicado valor da causa atualizado (R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}${memoCorrecao}
Alíquota de Preparo: 4.0%
Valor Bruto Calculado: R$ ${preparoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Piso Exigido isoladamente (5 UFESPs): R$ ${(u_calc(5)).toFixed(2)}
Valor Homologado para a Parcela B: R$ ${valorPreparo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${preparoIsPiso ? '[TRAVA DO PISO APLICADA]' : ''}

RESULTADO CONSOLIDADO DO PREPARO JEC
------------------------------------
Soma Legal (Parcela A + Parcela B): R$ ${valorIngresso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + R$ ${valorPreparo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total de Preparo em Guia DARE: R$ ${totalDareJec.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Código 230-6)`;
      break;
    }

    case 'jec_cumprimento_sentenca': {
      if (!inputs.jecCumprimentoIsMaféOuImprovido) {
        detalheMemoria = `CÁLCULO - EXECUÇÃO JEC (DISTRITO MINEIRO REGULAR)
-----------------------------------------------------------------
Regra Geral de Gratuidade: Conforme as diretrizes constitucionais e o art. 54 da Lei n. 9.099/95, a fase executória das sentenças no Juizado Especial Cível é TOTALMENTE ISENTA de taxas judiciárias e despesas na instauração.`;
      } else {
        // Exceção: má-fé penalizada cobra 1% (pré-2024) ou 2% (pós-2024) sobre o crédito
        const credito = inputs.valorCreditoExigido || valorCausaEfetivo;
        const aliq = isPos2024 ? 0.02 : 0.01;
        const { valorCalculado, isPiso } = calcularTaxaComTrava(credito, aliq, 5, Infinity, ufesp);

        itens.push({
          name: 'Taxa Judiciária Penalidade - Execução JEC (Má-fé ou Improvido)',
          source: 'DARE',
          description: `Cobrança excepcional por litigância de má-fé ou derrota recursal. Alíquota de ${(aliq * 100).toFixed(1)}% do crédito (Piso 5 UFESPs).`,
          value: valorCalculado,
          code: CODES.DARE_TAXA_JUDICIARIA,
          baseLegal: 'Art. 54 da Lei nº 9.099/1995 c/c Provimento TJSP'
        });
        detalheMemoria = `MEMÓRIA DE PENALIDADE - CUMPRIMENTO DE SENTENÇA JEC
-----------------------------------------------------------------
Ponto Forçado: Detecção de Litigância de Má-Fé ou Recurso Improvido
Alíquota de Multa-Taxa: ${(aliq * 100).toFixed(1)}%
Total Guia DARE: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isPiso ? '[PISO MÍNIMO 5 UFESP EMITIDO]' : ''}`;
      }
      break;
    }

    case 'jec_ausencia_audiencia': {
      let aliq = 0.015;
      if (!isPos2024) aliq = 0.01;
      else if (inputs.isTituloExtrajudicial) aliq = 0.02;

      const { valorCalculado, isPiso } = calcularTaxaComTrava(valorCausaEfetivo, aliq, 5, Infinity, ufesp);
      itens.push({
        name: 'Taxa Judiciária JEC - Custas por Ausência do Autor',
        source: 'DARE',
        description: `Taxa judiciária de penalização aplicada pela extinção decorrente da ausência desculpada do autor à sessão. Alíquota de ${(aliq * 100).toFixed(1)}%.`,
        value: valorCalculado,
        code: CODES.DARE_TAXA_JUDICIARIA,
        baseLegal: 'Artigo 51, I, § 2º da Lei Federal nº 9.099/1995'
      });
      detalheMemoria = `MEMÓRIA - CUSTAS POR AUSÊNCIA EM AUDIÊNCIA DE CONCILIAÇÃO JEC
-----------------------------------------------------------------
Fator Extintivo: Falta injustificada da parte reclamante.
Alíquota Geral Punitiva: ${(aliq * 100).toFixed(1)}% do valor atualizado da causa
Base de Incidência: R$ ${valorCausaEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total de Custas a Recolher: R$ ${valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isPiso ? '[PISO DE 5 UFESP APLICADO]' : ''}`;
      break;
    }

    case 'jec_despesas_finais': {
      // Reune despesas processuais não recolhidas a liquidar
      const correiosCents = inputs.quantidadeEnderecos * paraCentavos(tarifaPostalFlat);
      const atosCents = inputs.quantidadeAtosOficial * paraCentavos(tarifaDiligenciaOficial);
      const totalDespesas = paraReais(correiosCents + atosCents);

      if (totalDespesas > 0) {
        itens.push({
          name: 'Liquidação de Despesas Processuais Pendentes (JEC)',
          source: 'FEDTJ',
          description: `Acúmulo de custas com ARs de correio e diligências internas do Juizado em caso de encerramento.`,
          value: totalDespesas,
          code: CODES.FEDTJ_DESPESAS,
          baseLegal: 'Art. 54, parágrafo único, Lei 9.099/95'
        });
      }
      detalheMemoria = `MEMÓRIA DE LIQUIDAÇÃO DE DESPESAS ACUMULADAS NO JEC
-----------------------------------------------------------------
Serviço Postal: R$ ${(inputs.quantidadeEnderecos * tarifaPostalFlat).toFixed(2)} (${inputs.quantidadeEnderecos} lotes)
Oficial de Justiça: R$ ${(inputs.quantidadeAtosOficial * tarifaDiligenciaOficial).toFixed(2)} (${inputs.quantidadeAtosOficial} diligências)
Total das Custas Administrativas Pendentes: R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      break;
    }
  }

  // --- COMPILADOR FINAL DE SUCUMBÊNCIA E PARCIALIDADES JURÍDICAS ---
  let valorFinalApurado = 0;
  itens.forEach((it) => {
    valorFinalApurado = paraReais(paraCentavos(valorFinalApurado) + paraCentavos(it.value));
  });

  // Aplicação da Justiça Gratuita Parcial (Se houver desconto)
  if (inputs.tipoExcecao === 'justica_gratuita_parcial' && inputs.porcentagemDescontoGratuita > 0) {
    const descontoRatio = (100 - inputs.porcentagemDescontoGratuita) / 100;
    
    // Atualiza o valor de cada item e recalculao total
    itens.forEach((it) => {
      // Converte para centavos reais, aplica desconto, e arredonda
      const itemCents = paraCentavos(it.value);
      const itemComDescontoCents = Math.round(itemCents * descontoRatio);
      it.value = paraReais(itemComDescontoCents);
      it.description += ` [Desconto Gratuidade Parcial de ${inputs.porcentagemDescontoGratuita}% aplicado]`;
    });

    // Recalcula total com desconto
    valorFinalApurado = 0;
    itens.forEach((it) => {
      valorFinalApurado = paraReais(paraCentavos(valorFinalApurado) + paraCentavos(it.value));
    });

    detalheMemoria += `\n\n-------------------------------------------------
APLICAÇÃO DE CONCESSÃO DE GRATUIDADE PARCIAL (Art. 98, § 5º, CPC)
-------------------------------------------------
Porcentagem de Desconto Concedida pelo Juiz: ${inputs.porcentagemDescontoGratuita}%
Fator de Redução Matemática: ${inputs.porcentagemDescontoGratuita}% (paga-se ${100 - inputs.porcentagemDescontoGratuita}%)
Total Final Consolidado Geral com Redução: R$ ${valorFinalApurado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  // Se houver Preparo em Dobro (Deserção Relevada) CPC 1007, § 4
  if (inputs.isPreparoEmDobro) {
    // Altera apenas itens de DARE (taxas judiciárias/preparos) ou duplica o montante final? 
    // O CPC diz que "o recorrente que deixar de comprovar preparo no ato será intimado a realizar o recolhimento EM DOBRO"
    // Trata-se de duplicar todo o valor das taxas judiciárias/despesas correspondentes ao preparo.
    itens.forEach((it) => {
      if (it.source === 'DARE') {
        const d_cents = paraCentavos(it.value);
        it.value = paraReais(d_cents * 2);
        it.description += ` [PREPARO INTEMPESTIVO CALCULADO EM DOBRO - Art. 1.007, § 4º, CPC]`;
      }
    });

    // Recalcula total
    valorFinalApurado = 0;
    itens.forEach((it) => {
      valorFinalApurado = paraReais(paraCentavos(valorFinalApurado) + paraCentavos(it.value));
    });

    detalheMemoria += `\n\n-------------------------------------------------
PREPARO INTEMPESTIVO DETECTADO (Art. 1.007, § 4º, CPC)
-------------------------------------------------
Fator de Penalidade: Recolhimento de Taxa Judiciária EM DOBRO.
Total Geral a Recolher Duplicado (DARE): R$ ${valorFinalApurado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  // Auxiliares rápidos
  function u_calc(qtd: number): number {
    return qtd * ufesp;
  }

  return {
    itens,
    valorTotal: valorFinalApurado,
    isDesertoOuImpossivel,
    mensagemBloqueio,
    detalheMemoria
  };
}
