/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { TipoTabelaCorrecao } from '../types';
import { corrigirMonetariamente } from '../utils/calculator';
import { getPrimeiroPeriodoDaTabela, getUltimoPeriodoDaTabela } from '../data/tabelasOficiais';

export default function IndexTableConsultant() {
  const [valorOriginal, setValorOriginal] = useState<string>('0.00');
  const [tipoTabela, setTipoTabela] = useState<TipoTabelaCorrecao>('nova_tabela');

  // Limites vindos das próprias tabelas: acompanham a sincronização mensal em vez
  // de depender de um ano fixo no código.
  const primeiro = getPrimeiroPeriodoDaTabela(tipoTabela);
  const ultimo = getUltimoPeriodoDaTabela(tipoTabela);

  const minYear = primeiro.ano;
  const anosDisponiveis = Array.from({ length: ultimo.ano - minYear + 1 }, (_, i) => ultimo.ano - i);

  /** Há índice oficial publicado para este mês/ano na tabela escolhida? */
  const periodoValido = (ano: number, mes: number) =>
    ano * 12 + mes >= primeiro.ano * 12 + primeiro.mes &&
    ano * 12 + mes <= ultimo.ano * 12 + ultimo.mes;

  /** Aproxima uma seleção para o período válido mais próximo. */
  const ajustar = (ano: number, mes: number): [number, number] => {
    if (ano * 12 + mes < primeiro.ano * 12 + primeiro.mes) return [primeiro.ano, primeiro.mes];
    if (ano * 12 + mes > ultimo.ano * 12 + ultimo.mes) return [ultimo.ano, ultimo.mes];
    return [ano, mes];
  };

  const mesesDisponiveis = [
    { num: 1, nome: 'Janeiro' },
    { num: 2, nome: 'Fevereiro' },
    { num: 3, nome: 'Março' },
    { num: 4, nome: 'Abril' },
    { num: 5, nome: 'Maio' },
    { num: 6, nome: 'Junho' },
    { num: 7, nome: 'Julho' },
    { num: 8, nome: 'Agosto' },
    { num: 9, nome: 'Setembro' },
    { num: 10, nome: 'Outubro' },
    { num: 11, nome: 'Novembro' },
    { num: 12, nome: 'Dezembro' }
  ];

  const [anoOrigem, setAnoOrigem] = useState<number>(2022);
  const [mesOrigem, setMesOrigem] = useState<number>(1);
  const [anoDestino, setAnoDestino] = useState<number>(2026);
  const [mesDestino, setMesDestino] = useState<number>(5);

  const [copiado, setCopiado] = useState<boolean>(false);

  // Trocar de tabela pode invalidar o que já estava escolhido: a IPCA-E começa em
  // 1992 e a Antiga costuma estar um mês atrás das outras.
  useEffect(() => {
    const [ao, mo] = ajustar(anoOrigem, mesOrigem);
    if (ao !== anoOrigem) setAnoOrigem(ao);
    if (mo !== mesOrigem) setMesOrigem(mo);

    const [ad, md] = ajustar(anoDestino, mesDestino);
    if (ad !== anoDestino) setAnoDestino(ad);
    if (md !== mesDestino) setMesDestino(md);
  }, [tipoTabela, anoOrigem, mesOrigem, anoDestino, mesDestino]);

  // Handlers for currency formatting
  const handleMoneyChange = (val: string, setter: (v: string) => void) => {
    const clean = val.replace(/[^0-9.,]/g, '');
    setter(clean);
  };

  const handleMoneyBlur = (val: string, setter: (v: string) => void) => {
    if (!val || val.trim() === '') {
      setter('0.00');
      return;
    }
    let clean = val.replace(',', '.');
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

  // Executa o cálculo
  const valFloat = parseFloat(valorOriginal) || 0;
  const dataOrigemStr = `${anoOrigem}-${String(mesOrigem).padStart(2, '0')}`;
  const dataDestinoStr = `${anoDestino}-${String(mesDestino).padStart(2, '0')}`;
  
  const res = corrigirMonetariamente(valFloat, dataOrigemStr, tipoTabela, dataDestinoStr);

  const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const nomeTabelaExtenso = tipoTabela === 'nova_tabela'
    ? 'Nova Tabela Prática (Lei nº 14.905/2024)'
    : tipoTabela === 'antiga_tabela'
    ? 'Antiga Tabela Prática (Jurisprudência Predominante)'
    : 'Tabela IPCA-E';

  // `success: false` significa que um dos períodos não tem índice publicado e o
  // cálculo caiu no último disponível. Isso precisa aparecer também no texto que
  // vai para a petição — não só na tela.
  const avisoAproximacao = res.success
    ? ''
    : `
*** ATENCAO: VALOR APROXIMADO ***
Nao ha indice oficial publicado para um dos periodos informados nesta tabela.
O calculo utilizou o ultimo indice disponivel (${String(ultimo.mes).padStart(2, '0')}/${ultimo.ano}).
Confira antes de protocolar.
`;

  const textoPeticao = `=====================================================
DEMONSTRATIVO DE CORREÇÃO MONETÁRIA - ${nomeTabelaExtenso.toUpperCase()}
=====================================================
Tabela Utilizada: ${nomeTabelaExtenso}
Valor de Origem (Histórico): ${formatBRL(valFloat)}
Mês/Ano de Origem (Distribuição): ${String(mesOrigem).padStart(2, '0')}/${anoOrigem}
Índice de Origem: ${res.indiceOrigem.toFixed(6)}

Mês/Ano de Atualização (Cálculo): ${String(mesDestino).padStart(2, '0')}/${anoDestino}
Índice de Atualização: ${res.indiceAtual.toFixed(6)}

Fórmula Aplicada: Valor_Atualizado = Valor_Original * (Índice_Atual / Índice_Origem)
Fator Multiplicador: ${(res.indiceAtual / res.indiceOrigem).toFixed(6)}

VALOR TOTAL DA CAUSA CORRIGIDO: ${formatBRL(res.valorAtualizado)}
-----------------------------------------------------${avisoAproximacao}
Demonstrativo emitido automaticamente via JURISCALC SP conforme jurisprudência e Súmula 14 do STJ.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(textoPeticao);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col h-full justify-between" id="index-table-consultant">
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <RefreshCw className="h-5 w-5 text-slate-700" id="lucide-refresh-cw" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-slate-900 tracking-tight text-base">Atualizador Monetário TJSP</h3>
            <p className="font-sans text-xs text-slate-500">Correção direta baseada nas tabelas práticas oficiais do TJSP</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Escolha da Tabela de Correção */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tabela de Atualização Oficial
            </label>
            <select
              value={tipoTabela}
              onChange={(e) => setTipoTabela(e.target.value as TipoTabelaCorrecao)}
              className="block w-full px-3 py-2 border border-slate-300 bg-white rounded-md text-xs font-sans font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-950 focus:border-slate-950"
              id="select-tipo-tabela-consultant"
            >
              <option value="nova_tabela">Nova Tabela Prática (Lei nº 14.905/2024)</option>
              <option value="antiga_tabela">Antiga Tabela Prática (Jurisprudência Predominante)</option>
              <option value="ipca_e">Tabela IPCA-E (Precatórios/Cálculos)</option>
            </select>
          </div>

          {/* Valor a Atualizar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Valor de Origem (R$)
            </label>
            <div className="relative rounded-md shadow-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-mono font-semibold">
                R$
              </span>
              <input
                type="text"
                value={valorOriginal}
                onChange={(e) => handleMoneyChange(e.target.value, setValorOriginal)}
                onBlur={(e) => handleMoneyBlur(e.target.value, setValorOriginal)}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-hidden focus:border-slate-950 focus:ring-1 focus:ring-slate-950 font-mono text-sm font-bold text-slate-800"
                placeholder="0.00"
                id="input-valor-original"
              />
            </div>
          </div>

          {/* Seleção do Período de Origem */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data de Origem (Distribuição)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={mesOrigem}
                onChange={(e) => setMesOrigem(Number(e.target.value))}
                className="block w-full px-2 py-1.5 border border-slate-300 bg-white rounded-md text-xs font-sans text-slate-700 focus:outline-hidden focus:border-slate-900"
                id="select-mes-origem"
              >
                {mesesDisponiveis.map(m => (
                  <option key={m.num} value={m.num} disabled={!periodoValido(anoOrigem, m.num)}>
                    {m.nome}
                  </option>
                ))}
              </select>
              <select
                value={anoOrigem}
                onChange={(e) => setAnoOrigem(Number(e.target.value))}
                className="block w-full px-2 py-1.5 border border-slate-300 bg-white rounded-md text-xs font-sans text-slate-700 focus:outline-hidden focus:border-slate-900"
                id="select-ano-origem"
              >
                {anosDisponiveis.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Seleção do Período de Destino */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data de Atualização (Pagamento)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={mesDestino}
                onChange={(e) => setMesDestino(Number(e.target.value))}
                className="block w-full px-2 py-1.5 border border-slate-300 bg-white rounded-md text-xs font-sans text-slate-700 focus:outline-hidden focus:border-slate-900"
                id="select-mes-destino"
              >
                {mesesDisponiveis.map(m => (
                  <option key={m.num} value={m.num} disabled={!periodoValido(anoDestino, m.num)}>
                    {m.nome}
                  </option>
                ))}
              </select>
              <select
                value={anoDestino}
                onChange={(e) => setAnoDestino(Number(e.target.value))}
                className="block w-full px-2 py-1.5 border border-slate-300 bg-white rounded-md text-xs font-sans text-slate-700 focus:outline-hidden focus:border-slate-900"
                id="select-ano-destino"
              >
                {anosDisponiveis.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Informação e Multiplicador */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-600 space-y-2">
          <div className="flex justify-between">
            <span>Índice Origem ({String(mesOrigem).padStart(2,'0')}/{anoOrigem}):</span>
            <span className="font-semibold">{res.indiceOrigem.toFixed(6)}</span>
          </div>
          <div className="flex justify-between">
            <span>Índice Atual ({String(mesDestino).padStart(2,'0')}/{anoDestino}):</span>
            <span className="font-semibold">{res.indiceAtual.toFixed(6)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5 text-slate-900 font-sans text-sm font-medium">
            <span>Causa Corrigida:</span>
            <span>{formatBRL(res.valorAtualizado)}</span>
          </div>
        </div>

        {!res.success && (
          <div
            className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-300"
            id="aviso-indice-aproximado"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug text-amber-900 font-sans">
              <strong className="font-bold">Valor aproximado.</strong> Não há índice oficial
              publicado para um dos períodos nesta tabela — o cálculo usou o último disponível
              ({String(ultimo.mes).padStart(2, '0')}/{ultimo.ano}). O demonstrativo copiado
              traz esse aviso.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer"
          id="btn-copy-demonstrative"
        >
          {copiado ? (
            <>
              <Check className="h-4 w-4 text-green-400" id="lucide-check" />
              <span>Copiado Demonstrativo!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" id="lucide-copy" />
              <span>Copiar Memória de Atualização</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
