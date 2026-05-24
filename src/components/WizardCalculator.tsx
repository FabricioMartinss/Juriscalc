/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  HelpCircle, 
  Layers, 
  FileText, 
  ArrowRight, 
  ShieldAlert, 
  Info, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  UserPlus,
  Compass,
  DollarSign
} from 'lucide-react';
import { CalculationInputs, CalculationCategory, Subsystem, TipoTabelaCorrecao } from '../types';
import { UFESP_2026, CATEGORIAS_METADATA } from '../data/tabelaPratica';
import { fazerCalculoCompleto, corrigirMonetariamente } from '../utils/calculator';

export default function WizardCalculator() {
  const [subsystem, setSubsystem] = useState<Subsystem>('esaj');
  const [category, setCategory] = useState<CalculationCategory>('iniciais');
  
  // Datas e Época
  const [dataPeticionamento, setDataPeticionamento] = useState<string>('24'); // '24' = A partir de 03/01/2024, '23' = Até 02/01/2024
  const [tipoTabelaCorrecao, setTipoTabelaCorrecao] = useState<TipoTabelaCorrecao>('nova_tabela');

  // Valores de Entrada de Dinheiro
  const [valorCausaRaw, setValorCausaRaw] = useState<string>('0.00');
  const [isCausaAtualizada, setIsCausaAtualizada] = useState<boolean>(false);
  const [anoDistribuicao, setAnoDistribuicao] = useState<number>(2023);
  const [mesDistribuicao, setMesDistribuicao] = useState<number>(1);
  
  const [temCondenacao, setTemCondenacao] = useState<boolean>(false);
  const [valorCondenacaoRaw, setValorCondenacaoRaw] = useState<string>('0.00');

  // Valores de Execução / Créditos
  const [valorCreditoRaw, setValorCreditoRaw] = useState<string>('0.00');

  // Litisconsórcio / Partilhas / Envelopes
  const [quantidadeAutores, setQuantidadeAutores] = useState<number>(1);
  const [valorMonteMorRaw, setValorMonteMorRaw] = useState<string>('0.00');
  const [quantidadeEnderecos, setQuantidadeEnderecos] = useState<number>(0);
  const [quantidadeAtosOficial, setQuantidadeAtosOficial] = useState<number>(0);

  // Exceções e Casos de Borda
  const [tipoExcecao, setTipoExcecao] = useState<CalculationInputs['tipoExcecao']>('nenhuma');
  const [porcentagemDesconto, setPorcentagemDesconto] = useState<number>(50);
  const [isPreparoEmDobro, setIsPreparoEmDobro] = useState<boolean>(false);
  const [isTituloExtrajudicial, setIsTituloExtrajudicial] = useState<boolean>(false);
  const [isRecursoMeritoIntegral, setIsRecursoMeritoIntegral] = useState<boolean>(false);
  const [jecCumprimentoIsMafe, setJecCumprimentoIsMafe] = useState<boolean>(false);

  // Feedback de Cópia
  const [copiado, setCopiado] = useState<boolean>(false);

  // Executa o cálculo toda vez que um estado muda
  const valorCausa = parseFloat(valorCausaRaw) || 0;
  const valorCondenacao = temCondenacao ? (parseFloat(valorCondenacaoRaw) || 0) : 0;
  const valorCreditoExigido = parseFloat(valorCreditoRaw) || undefined;
  const valorMonteMor = parseFloat(valorMonteMorRaw) || 0;

  const dataPeticionamentoStr = dataPeticionamento === '24' ? '2026-05-23' : '2023-01-01';
  const isPosCutoff = dataPeticionamento === '24';
  const dataDistribuicaoStr = `${anoDistribuicao}-${String(mesDistribuicao).padStart(2,'0')}`;

  const inputs: CalculationInputs = {
    category,
    subsystem,
    tipoTabelaCorrecao,
    dataPeticionamento: dataPeticionamentoStr,
    isPosCutoff,
    valorCausa,
    isCausaAtualizada,
    dataDistribuicaoCausa: isCausaAtualizada ? dataDistribuicaoStr : undefined,
    valorCondenacao,
    isCondenacaoLiquida: temCondenacao,
    valorCreditoExigido,
    isTituloExtrajudicial,
    isRecursoMeritoIntegral,
    quantidadeAutores,
    valorMonteMor,
    quantidadeEnderecos,
    quantidadeAtosOficial,
    tipoExcecao,
    porcentagemDescontoGratuita: porcentagemDesconto,
    isPreparoEmDobro,
    jecCumprimentoIsMaféOuImprovido: jecCumprimentoIsMafe
  };

  const result = fazerCalculoCompleto(inputs);

  const previewCorrecao = corrigirMonetariamente(
    valorCausa,
    dataDistribuicaoStr,
    tipoTabelaCorrecao,
    '2026-05'
  );

  // Handlers
  // Currency input formatters and helpers
  const handleMoneyChange = (val: string, setter: (v: string) => void) => {
    // Only allow numbers, dots, and commas
    const clean = val.replace(/[^0-9.,]/g, '');
    setter(clean);
  };

  const handleMoneyBlur = (val: string, setter: (v: string) => void) => {
    if (!val || val.trim() === '') {
      setter('0.00');
      return;
    }
    // Convert comma to dot
    let clean = val.replace(',', '.');
    // If there are multiple dots, preserve only the last/correct one
    const parts = clean.split('.');
    if (parts.length > 2) {
      const last = parts.pop();
      clean = parts.join('') + '.' + last;
    }
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) {
      setter('0.00');
    } else {
      setter(parsed.toFixed(2));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(result.detalheMemoria);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Se alterar o subsistema, limpa as mensagens de erro se houver
  useEffect(() => {
    // Altera categorias padrão se o subsistema mudar para polir a UX
    if (subsystem === 'eproc') {
      // eproc também suporta todos os itens, mas vamos dar foco nos judiciais
    }
  }, [subsystem]);

  useEffect(() => {
    const minAno = tipoTabelaCorrecao === 'ipca_e' ? 1992 : 1964;
    if (anoDistribuicao < minAno) {
      setAnoDistribuicao(minAno);
    }
  }, [tipoTabelaCorrecao, anoDistribuicao]);

  const listAnos = Array.from(
    { length: 2026 - (tipoTabelaCorrecao === 'ipca_e' ? 1992 : 1964) + 1 },
    (_, i) => 2026 - i
  );
  const listMeses = [
    { n: 1, label: '01 - Jan' },
    { n: 2, label: '02 - Fev' },
    { n: 3, label: '03 - Mar' },
    { n: 4, label: '04 - Abr' },
    { n: 5, label: '05 - Mai' },
    { n: 6, label: '06 - Jun' },
    { n: 7, label: '07 - Jul' },
    { n: 8, label: '08 - Ago' },
    { n: 9, label: '09 - Set' },
    { n: 10, label: '10 - Out' },
    { n: 11, label: '11 - Nov' },
    { n: 12, label: '12 - Dez' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="wizard-calculator-root">
      {/* Coluna do Formulário de Entrada (7/12) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        {/* Toggle do Subsistema judicial */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-sans mb-3">
            Sistema do Tribunal de Justiça de SP
          </label>
          <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setSubsystem('esaj')}
              className={`py-2.5 px-3 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                subsystem === 'esaj'
                  ? 'bg-white shadow-sm text-slate-900 border border-slate-300'
                  : 'text-slate-550 hover:text-slate-800 border border-transparent'
              }`}
              id="subsystem-toggle-esaj"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span>e-SAJ (Guia DARE)</span>
            </button>
            <button
              onClick={() => setSubsystem('eproc')}
              className={`py-2.5 px-3 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                subsystem === 'eproc'
                  ? 'bg-slate-900 text-white border border-slate-850 shadow-sm'
                  : 'text-slate-550 hover:text-slate-800 border border-transparent'
              }`}
              id="subsystem-toggle-eproc"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span>E-PROC (Boleto Único)</span>
            </button>
          </div>
        </div>

        {/* Categoria do Cálculo */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-705 font-sans">
              Ato Processual / Matéria
            </label>
            <span className="text-[10px] text-slate-400 font-sans font-medium uppercase tracking-wider">Todos os Itens TJSP Inclusos</span>
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as CalculationCategory);
              // Limpacondicionais básicas para evitar lixo mental
              setTemCondenacao(false);
              setValorCondenacaoRaw('0.00');
              setIsTituloExtrajudicial(false);
              setIsRecursoMeritoIntegral(false);
              setJecCumprimentoIsMafe(false);
            }}
            className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-xs"
            id="select-category-main"
          >
            <optgroup label="Módulo I: Procedimento Comum e Execuções">
              <option value="iniciais">1) Iniciais, Reconvenção e Embargos</option>
              <option value="exec_titulo_extrajudicial">2) Execução de Título Extrajudicial</option>
              <option value="apelacao_recurso_adesivo">3) Preparo de Apelação / Recurso Adesivo</option>
              <option value="cumprimento_autos">4) Cumprimento de Sentença (Próprios Autos)</option>
              <option value="cumprimento_div_orgao">5) Cumprimento de Sentença (Título de Outro Órgão)</option>
              <option value="satisfacao_exec_cumpr">6) Satisfação da Execução/Cumprimento ao Final</option>
              <option value="execucao_fiscal">7) Execução Fiscal (Custas do Vencido ao Final)</option>
              <option value="agravo_instrumento">8) Agravo de Instrumento</option>
              <option value="cartas_prec_ord_arb">9) Cartas Precatórias / Arbitrais / de Ordem</option>
              <option value="partilha_inventario">10) Homologação de Partilha / Inventários</option>
              <option value="habilitacao_credito">11) Habilitação Retardatária de Crédito</option>
              <option value="acao_penal_geral">12) Ações Penais em Geral</option>
              <option value="acao_penal_privada">13) Ações Penais Privadas (Queixa-crime)</option>
              <option value="litisconsorcio_ativo">14) Litisconsórcio Ativo Voluntário</option>
              <option value="litiscorso_ulterior">15) Litisconsorte Ulterior / Assistência</option>
            </optgroup>
            <optgroup label="Módulo II: Juizado Especial Cível (JEC)">
              <option value="jec_recurso_inominado">1) JEC - Recurso Inominado (Ingresso + Preparo)</option>
              <option value="jec_cumprimento_sentenca">2) JEC - Cumprimento de Sentença</option>
              <option value="jec_ausencia_audiencia">3) JEC - Custas por Ausência em Audiência</option>
              <option value="jec_despesas_finais">4) JEC - Despesas Administrativas Finais</option>
            </optgroup>
          </select>
        </div>

        {/* Inputs Financeiros e de Causa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Valor da Causa */}
          {category !== 'partilha_inventario' && category !== 'jec_despesas_finais' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Valor Atribuído à Causa (R$)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-mono font-bold">
                  R$
                </span>
                <input
                  type="text"
                  value={valorCausaRaw}
                  onChange={(e) => handleMoneyChange(e.target.value, setValorCausaRaw)}
                  onBlur={(e) => handleMoneyBlur(e.target.value, setValorCausaRaw)}
                  onFocus={handleFocus}
                  onKeyDown={handleKeyDown}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono text-sm font-bold text-slate-800 shadow-xs"
                  placeholder="0.00"
                  id="input-valor-causa"
                />
              </div>
            </div>
          )}

          {/* Época de Peticionamento / Data */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Época do Peticionamento
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 border border-slate-200 rounded-lg shadow-xs h-[42px] items-center">
              <button
                type="button"
                onClick={() => setDataPeticionamento('24')}
                className={`h-8 text-center text-xs font-sans font-bold rounded-md transition-all cursor-pointer ${
                  dataPeticionamento === '24' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                id="peticionamento-pos"
              >
                A partir de 03/01/24
              </button>
              <button
                type="button"
                onClick={() => setDataPeticionamento('23')}
                className={`h-8 text-center text-xs font-sans font-bold rounded-md transition-all cursor-pointer ${
                  dataPeticionamento === '23' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                id="peticionamento-pre"
              >
                Até 02/01/2024
              </button>
            </div>
          </div>
        </div>

        {/* Seção Condicional: Correção Financeira da Causa */}
        {category !== 'partilha_inventario' && category !== 'jec_despesas_finais' && (
          <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Aplicar Atualização Monetária da Causa?</span>
                <span className="text-[10px] text-slate-400 font-medium">Corrige desde a data de distribuição pela Tabela Prática</span>
              </div>
              <input
                type="checkbox"
                checked={isCausaAtualizada}
                onChange={(e) => setIsCausaAtualizada(e.target.checked)}
                className="h-4.5 w-4.5 text-slate-900 border-slate-300 rounded-md focus:ring-slate-900 cursor-pointer"
                id="chk-causa-atualizada"
              />
            </div>

            {isCausaAtualizada && (
              <div className="space-y-3 pt-2 border-t border-slate-200 animate-fadeIn">
                <div>
                  <span className="block text-[10px] text-slate-500 mb-1 font-sans font-semibold">Tabela de Correção TJSP:</span>
                  <select
                    value={tipoTabelaCorrecao}
                    onChange={(e) => setTipoTabelaCorrecao(e.target.value as TipoTabelaCorrecao)}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-sans font-bold text-slate-700 focus:outline-hidden focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                    id="select-tipo-tabela-correcao"
                  >
                    <option value="nova_tabela">Nova Tabela Prática (Lei nº 14.905/2024)</option>
                    <option value="antiga_tabela">Antiga Tabela Prática (Jurisprudência Predominante)</option>
                    <option value="ipca_e">Tabela IPCA-E (Precatórios/Cálculos)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-sans font-semibold">Mês da Distribuição:</span>
                    <select
                      value={mesDistribuicao}
                      onChange={(e) => setMesDistribuicao(Number(e.target.value))}
                      className="block w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-sans font-bold text-slate-700"
                      id="select-mes-dist"
                    >
                      {listMeses.map((m) => (
                        <option key={m.n} value={m.n}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-sans font-semibold">Ano da Distribuição:</span>
                    <select
                      value={anoDistribuicao}
                      onChange={(e) => setAnoDistribuicao(Number(e.target.value))}
                      className="block w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-sans font-bold text-slate-700"
                      id="select-ano-dist"
                    >
                      {listAnos.map((ano) => (
                        <option key={ano} value={ano}>{ano}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* VISUAL PREVIEW OF MONETARY CORRECTION */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 shadow-2xs font-sans mt-2.5 animate-fadeIn text-xs">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Apurado na Simulação:</span>
                    <span className="font-mono text-slate-400">Ref: 05/2026</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-slate-500 text-xs">Valor da Causa Original:</span>
                    <span className="font-mono text-slate-700 font-bold">
                      R$ {valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 text-xs">Valor da Causa Atualizado:</span>
                    <span className="font-mono text-emerald-700 font-bold text-sm bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg">
                      R$ {previewCorrecao.valorAtualizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-1.5 flex flex-wrap justify-between">
                    <span>Fator: <strong className="font-mono font-bold text-slate-600">{(previewCorrecao.indiceAtual / previewCorrecao.indiceOrigem).toFixed(6)}</strong></span>
                    <span>Índices (Origem/Atual): <strong className="font-mono font-bold text-slate-600">{previewCorrecao.indiceOrigem.toFixed(6)} / {previewCorrecao.indiceAtual.toFixed(6)}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seção Condicional: Sentença e Condenação */}
        {(category === 'apelacao_recurso_adesivo' || category === 'jec_recurso_inominado' || category === 'agravo_instrumento') && (
          <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Houve Condenação em Dinheiro (Verba Líquida)?</span>
                <span className="text-[10px] text-slate-400 font-medium font-sans">Se sim, a alíquota de reparo (4%) incide sobre a condenação</span>
              </div>
              <input
                type="checkbox"
                checked={temCondenacao}
                onChange={(e) => setTemCondenacao(e.target.checked)}
                className="h-4.5 w-4.5 text-slate-900 border-slate-300 rounded-md focus:ring-slate-900 cursor-pointer"
                id="chk-tem-condenacao"
              />
            </div>

            {temCondenacao && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Valor da Condenação Líquida (R$)
                </label>
                <div className="relative rounded-lg shadow-xs max-w-xs">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-mono font-bold">
                    R$
                  </span>
                  <input
                    type="text"
                    value={valorCondenacaoRaw}
                    onChange={(e) => handleMoneyChange(e.target.value, setValorCondenacaoRaw)}
                    onBlur={(e) => handleMoneyBlur(e.target.value, setValorCondenacaoRaw)}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    className="block w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono text-sm font-bold text-slate-800"
                    placeholder="0.00"
                    id="input-valor-condenacao"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inputs Específicos Adicionais por Categoria */}
        {category === 'cumprimento_autos' && isPosCutoff && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Valor do Crédito a Satisfazer (R$)
            </label>
            <div className="relative rounded-lg shadow-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-mono font-bold">
                R$
              </span>
              <input
                type="text"
                value={valorCreditoRaw}
                onChange={(e) => handleMoneyChange(e.target.value, setValorCreditoRaw)}
                onBlur={(e) => handleMoneyBlur(e.target.value, setValorCreditoRaw)}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-bold text-slate-800 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-xs"
                placeholder="0.00"
                id="input-credito-cumprimento"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-sans font-medium">Deixe em branco para usar o próprio valor da causa atribulado.</p>
          </div>
        )}

        {category === 'partilha_inventario' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Valor Total do Monte-mor (R$)
            </label>
            <div className="relative rounded-lg shadow-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-mono font-bold">
                R$
              </span>
              <input
                type="text"
                value={valorMonteMorRaw}
                onChange={(e) => handleMoneyChange(e.target.value, setValorMonteMorRaw)}
                onBlur={(e) => handleMoneyBlur(e.target.value, setValorMonteMorRaw)}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-bold text-slate-800 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-xs"
                id="input-monte-mor"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-sans font-medium font-serif italic">Soma de todos os ativos sujeitos à transmissão do espólio ou divórcio.</p>
          </div>
        )}

        {category === 'litisconsorcio_ativo' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Quantidade de Autores Litisconsortes
            </label>
            <input
              type="number"
              min="1"
              value={quantidadeAutores}
              onChange={(e) => setQuantidadeAutores(Math.max(1, Number(e.target.value)))}
              className="block w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 text-center font-mono font-bold"
              id="input-quantidade-autores"
            />
          </div>
        )}

        {/* Toggles de Borda Adicionais / Exceções específicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {category === 'jec_recurso_inominado' && (
            <div className="flex items-center space-x-2.5 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="chk-extrajudicial-jec"
                checked={isTituloExtrajudicial}
                onChange={(e) => setIsTituloExtrajudicial(e.target.checked)}
                className="h-4.5 w-4.5 text-slate-900 border-slate-300 rounded-md cursor-pointer"
              />
              <label htmlFor="chk-extrajudicial-jec" className="text-xs font-bold text-slate-700 cursor-pointer">
                Recurso sobre Título Executivo Extrajudicial?
              </label>
            </div>
          )}

          {category === 'agravo_instrumento' && (
            <div className="flex items-center space-x-2.5 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="chk-merito-integral"
                checked={isRecursoMeritoIntegral}
                onChange={(e) => setIsRecursoMeritoIntegral(e.target.checked)}
                className="h-4.5 w-4.5 text-slate-900 border-slate-300 rounded-md cursor-pointer"
              />
              <label htmlFor="chk-merito-integral" className="text-xs font-bold text-slate-705 cursor-pointer">
                Agravo versando sobre o mérito definitivo?
              </label>
            </div>
          )}

          {category === 'jec_cumprimento_sentenca' && (
            <div className="flex items-center space-x-2.5 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="chk-mafe-jec"
                checked={jecCumprimentoIsMafe}
                onChange={(e) => setJecCumprimentoIsMafe(e.target.checked)}
                className="h-4.5 w-4.5 text-slate-900 border-slate-300 rounded-md cursor-pointer"
              />
              <label htmlFor="chk-mafe-jec" className="text-xs font-bold text-slate-705 cursor-pointer">
                Houve litigância de má-fé / recurso improvido?
              </label>
            </div>
          )}
        </div>

        {/* Tabela de Despesas Administrativas (FEDTJ e GRD) */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <span className="block text-xs font-bold text-slate-400 font-sans uppercase tracking-widest">
            Despesas Administrativas Adicionais
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Atos de Postagem Correios (Guia FEDTJ)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  value={quantidadeEnderecos}
                  onChange={(e) => setQuantidadeEnderecos(Math.max(0, Number(e.target.value)))}
                  className="block w-20 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-center text-slate-800 shadow-xs"
                  id="input-qt-envelopes"
                />
                <span className="text-xs text-slate-450 font-medium">Endereços (R$ 38,30 cada)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-707 mb-1.5">
                Diligências do Oficial (Guia GRD)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  value={quantidadeAtosOficial}
                  onChange={(e) => setQuantidadeAtosOficial(Math.max(0, Number(e.target.value)))}
                  className="block w-20 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-center text-slate-800 shadow-xs"
                  id="input-qt-oficiais"
                />
                <span className="text-xs text-slate-450 font-medium font-sans">Atos (3 UFESPs = R$ 115,26 cada)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Casos de Borda e Exceções Gerais Jurídicas */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <span className="block text-xs font-bold text-slate-400 font-sans uppercase tracking-widest">
            Exceções e Casos de Borda Jurídicos
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exceção Geral */}
            <div>
              <label className="block text-xs font-bold text-slate-705 mb-1.5">
                Benefício de Justiça Especial / Partes
              </label>
              <select
                value={tipoExcecao}
                onChange={(e) => setTipoExcecao(e.target.value as any)}
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden"
                id="select-excecao"
              >
                <option value="nenhuma">Nenhuma / Regular (Recolhimento Integral)</option>
                <option value="justica_gratuita_integral">Justiça Gratuita Integral (Guia Isenta)</option>
                <option value="justica_gratuita_parcial">Justiça Gratuita Parcial / Desconto (%)</option>
                <option value="isencao_legal">Isenção Legal (Fazenda Pública / MP)</option>
                <option value="embargos_declaracao">Verificar se Embargos de Declaração</option>
              </select>
            </div>

            {/* Desconto de Gratuidade Parcial */}
            {tipoExcecao === 'justica_gratuita_parcial' && (
              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1.5">
                  Porcentagem de Desconto Concedida (%)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={porcentagemDesconto}
                    onChange={(e) => setPorcentagemDesconto(Math.min(99, Math.max(1, Number(e.target.value))))}
                    className="block w-20 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-center text-slate-800 shadow-xs"
                  />
                  <span className="text-xs text-slate-450 font-medium">Desconto Concedido</span>
                </div>
              </div>
            )}

            {/* Preparo em Dobro Checklist */}
            {tipoExcecao === 'nenhuma' && (category === 'apelacao_recurso_adesivo' || category === 'jec_recurso_inominado' || category === 'agravo_instrumento') && (
              <div className="flex items-start space-x-2.5 bg-amber-50/50 p-3 rounded-xl border border-amber-200 col-span-1 md:col-span-2 mt-2">
                <input
                  type="checkbox"
                  id="chk-recurso-dobro"
                  checked={isPreparoEmDobro}
                  onChange={(e) => setIsPreparoEmDobro(e.target.checked)}
                  className="h-4.5 w-4.5 text-slate-900 border-amber-300 rounded-md cursor-pointer mt-0.5"
                />
                <label htmlFor="chk-recurso-dobro" className="text-xs text-slate-700 font-sans cursor-pointer flex flex-col">
                  <span className="font-bold text-amber-950">Preparo Intempestivo / Recolhimento em Dobro?</span>
                  <span className="text-[10px] text-amber-900 font-medium">Art. 1.007, § 4º do CPC. Duplica o valor do preparo caso omitido previamente.</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coluna da Saída dos Resultados de Emissão (5/12) */}
      <div className="lg:col-span-5 flex flex-col space-y-6" id="wizard-calculator-output">
        
        {/* Card do Resumo e Valores */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl flex flex-col justify-between border border-slate-800 relative overflow-hidden" id="card-sum-values">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Cálculo de Custas Processuais</span>
              <div className="px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wide">
                {subsystem === 'esaj' ? 'e-SAJ SP' : 'E-PROC TJSP'}
              </div>
            </div>

            {/* Bloco de Mensagem de Travamento/Isenção */}
            {result.mensagemBloqueio ? (
              <div className="my-4 p-4 bg-amber-950/20 border border-amber-800/40 rounded-lg text-amber-300 text-xs font-sans flex flex-col space-y-2">
                <strong className="font-bold">Informação de Processamento:</strong>
                <p className="leading-relaxed font-semibold">{result.mensagemBloqueio}</p>
              </div>
            ) : null}

            {/* Totalizador */}
            <div className="space-y-1 mb-6">
              <span className="text-[10px] text-slate-400 font-sans font-bold tracking-widest uppercase">VALOR TOTAL ATRIBUÍDO DE CUSTAS</span>
              <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-amber-400">
                R$ {result.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-slate-400 font-sans font-medium">
                Referência Tributária TJSP (Exercício 2026 - UFESP {UFESP_2026})
              </p>
            </div>

            {/* Listagem de itens calculados */}
            {result.itens.length > 0 ? (
              <div className="space-y-3">
                <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Detalhamento das Guias</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {result.itens.map((it, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs space-y-1.5 font-sans">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-200">{it.name}</span>
                        <span className="font-mono text-amber-400 font-bold text-sm">
                          R$ {it.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-sans border-t border-slate-850 pt-1.5">
                        <span>Guia: <strong className="text-slate-350 font-mono font-bold">{it.source} ({it.code})</strong></span>
                        <span className="text-[9px] text-slate-450 text-right truncate max-w-xs">{it.baseLegal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !result.mensagemBloqueio ? (
              <div className="py-8 text-center text-slate-550 font-sans text-xs font-semibold">
                Nenhuma guia adicionada para esta classe.
              </div>
            ) : null}
          </div>

          {/* Tutorial e Comportamento por Sistema (e-SAJ vs E-PROC) */}
          <div className="mt-6 border-t border-slate-800 pt-4 space-y-3">
            {subsystem === 'esaj' ? (
              <div className="space-y-2.5">
                <span className="block text-xs font-sans font-bold text-slate-200">
                  Ações de Emissão pelo Portal de Custas (e-SAJ)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium">
                  No e-SAJ, as guias de recolhimento devem ser geradas externamente usando os valores liquidados acima. Use os portais de arrecadação do tribunal paulista:
                </p>
                <div className="grid grid-cols-1 gap-2 pt-1 font-sans">
                  {result.itens.some(it => it.source === 'DARE') && (
                    <a
                      href="https://portaldecustas.tjsp.jus.br/portaltjsp"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors font-bold"
                    >
                      <span>Gerar Guia DARE (Código 230-6)</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" id="lucide-external-link-dare" />
                    </a>
                  )}
                  {result.itens.some(it => it.source === 'FEDTJ') && (
                    <a
                      href="https://www45.bb.com.br/fmc/frm/fw0707314_1.jsp"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors font-bold"
                    >
                      <span>Gerar Guia FEDTJ (Código 120-1)</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" id="lucide-external-link-fedtj" />
                    </a>
                  )}
                  {result.itens.some(it => it.source === 'GRD') && (
                    <a
                      href="https://www63.bb.com.br/portalbb/boleto/boletos/oficialjustica/entrada,802,2270,3617,15,0.bbx"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors font-bold"
                    >
                      <span>Gerar Guia Diligência GRD</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" id="lucide-external-link-grd" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              // E-PROC tutorial
              <div className="space-y-2.5 p-3.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="block text-xs font-sans font-bold text-slate-200 flex items-center">
                  <Info className="h-4 w-4 mr-1.5 text-orange-400" id="lucide-info-eproc" />
                  Roteiro de Guia Única (E-PROC)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium">
                  No E-PROC do TJSP, as guias não usam o portal externo. A geração e pagamento ocorrem **dentro do próprio sistema** em um boleto único. Use os valores calculados para validar a cobrança do tribunal paulista:
                </p>
                <ol className="list-decimal list-inside text-[11px] text-slate-350 space-y-1.5 font-sans font-medium pl-1">
                  <li>Acesse o processo pelo login do E-PROC</li>
                  <li>Vá no menu do processo: <strong className="text-slate-100">"Ações &gt; Custas &gt; Emitir Guia"</strong></li>
                  <li>Confira se o montante de <strong className="text-amber-400">R$ {result.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> gerado condiz com nossa auditoria.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Text Area copyable do Espelho Técnico */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-between" id="area-memo-custom">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-sans font-bold text-slate-900 text-sm tracking-tight">Memória Justificada de Custas</h4>
                <p className="font-sans text-[11px] text-slate-400">Pronta para copiar e colar na sua petição oficial</p>
              </div>
              <button
                onClick={handleCopyMemo}
                className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg border border-slate-900 hover:bg-slate-50 text-slate-900 text-xs transition-all cursor-pointer font-sans font-bold shadow-xs"
                id="btn-copy-memo-court"
              >
                {copiado ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600 font-bold" id="lucide-check-memo" />
                    <span className="font-bold text-green-600">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-700" id="lucide-copy-memo" />
                    <span>Copiar Memória</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              readOnly
              value={result.detalheMemoria}
              className="w-full h-64 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10.5px] font-mono text-slate-600 focus:outline-hidden resize-none leading-relaxed shadow-xs"
              id="txt-memo-detail"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
