/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  FileText,
  ShieldAlert,
  Info,
  Copy,
  Check,
  ExternalLink,
  Compass,
  TrendingUp,
  Percent,
  RefreshCw,
  X,
  Chrome,
  Zap
} from 'lucide-react';
import { UFESP_2026 } from '../data/tabelaPratica';
import { buscarIndiceOficial, getUltimoPeriodoDisponivel, TipoTabelaCorrecao } from '../data/tabelasOficiais';

// Constants
const TARIFA_POSTAL_AR = 35.75; // Tarifa de envelopamento/AR dos Correios (TJSP 2026)

// Mapeia a categoria de cálculo do app para o texto do "Tipo de Serviço" no
// Portal de Custas (o autofill casa por trecho do texto, sem acento). Cada
// valor é um trecho que identifica de forma única a opção correta do portal.
// Vazio/ausente = usuário seleciona o serviço no portal.
const PORTAL_TIPO_SERVICO: Record<string, string> = {
  comum_1: 'Petição Inicial',                         // Petição Inicial - 230-6
  comum_2: 'Execução de Título Extrajudicial',        // Execução de Título Extrajudicial - 230-6
  comum_3: 'Preparo da Apelação',                     // Preparo da Apelação - 230-6 (validado)
  comum_4: 'Cumprimento de Sentença',                 // Cumprimento de Sentença - 230-6
  comum_5: 'Cumprimento de Sentença',                 // idem (título de outro órgão)
  comum_6: 'Satisfação da Execução',                  // Satisfação da Execução - 230-6
  comum_7: 'Execução Fiscal',                         // Taxa Judiciária - Execução Fiscal - 230-6
  comum_8: 'Agravo de Instrumento',                   // Agravo de Instrumento - 234-3
  comum_9: 'Cartas Precatórias - Processo Origem TJSP', // padrão p/ cartas (usuário troca se for Ordem/Outros)
  comum_10: 'Causa em que Haja Partilha',             // Causa em que Haja Partilha - 230-6
  comum_11: 'Habilitação Retardatária de Crédito',    // Habilitação Retardatária de Crédito em Concordata - 230-6
  comum_12: 'Ações Penais em Geral',                  // Ações Penais em Geral, Salvo Competência JECRIM - 230-6
  comum_13: 'Ação Penal Privada - Inicial',           // padrão (distribuição); recurso o usuário troca
  comum_15: 'Litisconsórcio Ativo Voluntário Ulterior', // Litisconsórcio Ativo Voluntário Ulterior - 230-6
  jec_1: 'Recurso Inominado',                         // Recurso Inominado em Juizado Especial Cível - 230-6
};
function mapServicoPortal(id: string): string {
  return PORTAL_TIPO_SERVICO[id] || '';
}

// ---- Máscaras e validação dos campos de emissão automática ----
function soDigitos(s: string): string {
  return (s || '').replace(/\D/g, '');
}
// CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00), conforme a quantidade de dígitos.
function mascaraCpfCnpj(v: string): string {
  const d = soDigitos(v).slice(0, 14);
  if (d.length <= 11) {
    let out = d.slice(0, 3);
    if (d.length > 3) out += '.' + d.slice(3, 6);
    if (d.length > 6) out += '.' + d.slice(6, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }
  let out = d.slice(0, 2) + '.' + d.slice(2, 5);
  if (d.length > 5) out += '.' + d.slice(5, 8);
  if (d.length > 8) out += '/' + d.slice(8, 12);
  if (d.length > 12) out += '-' + d.slice(12, 14);
  return out;
}
// Telefone (00) 0000-0000 ou (00) 00000-0000.
function mascaraTelefone(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length === 0) return '';
  let out = '(' + d.slice(0, 2);
  if (d.length >= 3) {
    const resto = d.slice(2);
    out += ') ' + (resto.length > 4 ? resto.slice(0, resto.length - 4) + '-' + resto.slice(-4) : resto);
  } else if (d.length === 2) {
    out += ') ';
  }
  return out;
}
// Número do processo (CNJ): 0000000-00.0000.0.00.0000 (20 dígitos).
function mascaraProcesso(v: string): string {
  const d = soDigitos(v).slice(0, 20);
  let out = d.slice(0, 7);
  if (d.length > 7) out += '-' + d.slice(7, 9);
  if (d.length > 9) out += '.' + d.slice(9, 13);
  if (d.length > 13) out += '.' + d.slice(13, 14);
  if (d.length > 14) out += '.' + d.slice(14, 16);
  if (d.length > 16) out += '.' + d.slice(16, 20);
  return out;
}

type CampoEmissaoKey = 'cpf' | 'nome' | 'telefone' | 'endereco' | 'municipio' | 'processo';
interface CampoEmissaoDef {
  campo: CampoEmissaoKey;
  label: string;
  mask?: (v: string) => string;
  valido: (v: string) => boolean;
  numerico?: boolean;
  maxLength?: number;
}
const CAMPOS_EMISSAO: CampoEmissaoDef[] = [
  { campo: 'cpf', label: 'CPF/CNPJ', mask: mascaraCpfCnpj, numerico: true, maxLength: 18,
    valido: (v) => { const n = soDigitos(v).length; return n === 11 || n === 14; } },
  { campo: 'nome', label: 'Nome', valido: (v) => v.trim().length >= 2 },
  { campo: 'telefone', label: 'Telefone', mask: mascaraTelefone, numerico: true, maxLength: 16,
    valido: (v) => { const n = soDigitos(v).length; return n === 10 || n === 11; } },
  { campo: 'endereco', label: 'Endereço', valido: (v) => v.trim().length >= 3 },
  { campo: 'municipio', label: 'Município', valido: (v) => v.trim().length >= 2 },
  { campo: 'processo', label: 'Nº do Processo', mask: mascaraProcesso, numerico: true, maxLength: 25,
    valido: (v) => soDigitos(v).length === 20 },
];

// ===== Validação de campos de data (MM/AAAA) =====
// Limite superior derivado das tabelas oficiais, para acompanhar atualizações.
const ULTIMO_PERIODO = getUltimoPeriodoDisponivel();
const ULTIMO_PERIODO_LABEL = `${String(ULTIMO_PERIODO.mes).padStart(2, '0')}/${ULTIMO_PERIODO.ano}`;
// As tabelas práticas do TJSP começam em outubro de 1964.
const PRIMEIRO_ANO = 1964;
const PRIMEIRO_MES = 10;

// Máscara progressiva: mantém apenas dígitos e insere a barra (MM/AAAA).
function formatMonthYearInput(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + '/' + digits.slice(2);
}

// Valida formato (MM/AAAA), mês 01-12 e período dentro da cobertura das tabelas.
function isValidMonthYear(val: string): boolean {
  const m = /^(\d{2})\/(\d{4})$/.exec(val.trim());
  if (!m) return false;
  const mes = parseInt(m[1], 10);
  const ano = parseInt(m[2], 10);
  if (mes < 1 || mes > 12) return false;
  if (ano < PRIMEIRO_ANO || ano > ULTIMO_PERIODO.ano) return false;
  if (ano === PRIMEIRO_ANO && mes < PRIMEIRO_MES) return false;
  if (ano === ULTIMO_PERIODO.ano && mes > ULTIMO_PERIODO.mes) return false;
  return true;
}

// Input de mês/ano com máscara e validação visual. Recebe o className base de
// cada contexto e aplica realce de erro (borda/fundo vermelhos) quando inválido.
function MonthYearInput({
  value,
  onChange,
  className,
  placeholder = 'MM/AAAA',
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  className: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const valido = isValidMonthYear(value);
  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        maxLength={7}
        value={value}
        aria-label={ariaLabel}
        aria-invalid={!valido}
        placeholder={placeholder}
        onChange={(e) => onChange(formatMonthYearInput(e.target.value))}
        className={`${className}${!valido ? ' !border-red-400 !bg-red-50 focus:!border-red-500' : ''}`}
      />
      {!valido && (
        <span className="block text-[9px] font-bold text-red-600 leading-tight pt-0.5">
          Use MM/AAAA entre {String(PRIMEIRO_MES).padStart(2, '0')}/{PRIMEIRO_ANO} e {ULTIMO_PERIODO_LABEL}.
        </span>
      )}
    </>
  );
}

// Tipos de diligência do Oficial de Justiça (GRD) e respectivo custo em UFESPs
const DILIGENCIA_TIPOS = {
  deslocamento: { ufesps: 3, label: 'Com deslocamento (3 UFESPs)' },
  remoto: { ufesps: 1, label: 'Remoto / sede do Juízo (1 UFESP)' },
  convertido: { ufesps: 2, label: 'Remoto convertido em deslocamento (2 UFESPs)' },
} as const;
const PISO_REAIS = 5 * UFESP_2026; // Piso legal de 5 UFESPs
const TETO_REAIS = 3000 * UFESP_2026; // Teto legal de 3.000 UFESPs

// Helper function to clamp value respecting Floor and Ceiling
function clamp(valor: number): number {
  if (valor < PISO_REAIS) return PISO_REAIS;
  if (valor > TETO_REAIS) return TETO_REAIS;
  return valor;
}

// Maps the UI table ids ('padrao' | 'ipcae' | 'antiga_inpc') to the official
// TJSP table identifiers used by buscarIndiceOficial.
function mapTabelaOficial(tabela: string): TipoTabelaCorrecao {
  if (tabela === 'ipcae') return 'ipca_e';
  if (tabela === 'antiga_inpc') return 'antiga_tabela';
  return 'nova_tabela';
}

// Core monetary correction calculator for TJSP.
// Uses the official practical index tables (the same source as the "Atualizador"
// sidebar) instead of a flat estimated monthly rate, so both views agree.
// Fórmula: Valor_Atualizado = Valor_Original * (Índice_Final / Índice_Inicial)
export function calculateMonetaryCorrection(
  valor: number,
  dataIni: string,
  dataFim: string,
  tabela: string
) {
  const parseMesAno = (s: string, mDefault: number, yDefault: number) => {
    const parts = (s || '').split('/');
    if (parts.length !== 2) return { m: mDefault, y: yDefault };
    return {
      m: parseInt(parts[0], 10) || mDefault,
      y: parseInt(parts[1], 10) || yDefault
    };
  };

  const { m: mIni, y: yIni } = parseMesAno(dataIni, 1, 2024);
  const { m: mFim, y: yFim } = parseMesAno(dataFim, 5, 2026);

  const tIni = yIni * 12 + (mIni - 1);
  const tFim = yFim * 12 + (mFim - 1);
  const diffMonths = Math.max(0, tFim - tIni);

  const tabelaOficial = mapTabelaOficial(tabela);
  const idxIni = buscarIndiceOficial(tabelaOficial, yIni, mIni);
  const idxFim = buscarIndiceOficial(tabelaOficial, yFim, mFim);

  const tableName =
    tabelaOficial === 'ipca_e' ? 'Tabela IPCA-E' :
    tabelaOficial === 'antiga_tabela' ? 'Antiga Tabela Prática (INPC)' :
    'Tabela Prática - Lei 14.905/2024 (INPC/IPCA-15)';

  // Sem retroceder valor: se o índice inicial for inválido, mantém o valor original.
  const fator = idxIni.value > 0 ? idxFim.value / idxIni.value : 1;
  const valorCorrigido = valor * fator;

  return {
    valorCorrigido,
    fatorInicial: idxIni.value,
    fatorFinal: idxFim.value,
    resumo: `Atualização feita via ${tableName}. Período: ${dataIni} a ${dataFim} (${diffMonths} meses).`,
    baseDesc: `Índices oficiais do TJSP (${tableName}).`
  };
}

// 4 Color Palettes mapping
const PALETTES = {
  slate: {
    id: 'slate',
    name: 'Gelo Executivo',
    primary: 'bg-slate-900',
    primaryText: 'text-slate-900',
    border: 'border-slate-200',
    ring: 'focus:ring-slate-900 focus:border-slate-900',
    accentText: 'text-slate-500',
    accentBg: 'bg-slate-900',
    accentBorder: 'border-slate-300 font-bold',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    highlight: 'bg-slate-50',
    buttonColor: 'bg-slate-900 hover:bg-slate-800 text-white',
    badgeHeader: 'bg-slate-800 text-slate-300 border-slate-700',
    cardBorder: 'border-slate-200',
    colorDot: 'bg-slate-400',
  },
  emerald: {
    id: 'emerald',
    name: 'Forense Prussiano',
    primary: 'bg-[#1e2e3e]',
    primaryText: 'text-[#1e2e3e]',
    border: 'border-slate-200',
    ring: 'focus:ring-[#1e2e3e] focus:border-[#1e2e3e]',
    accentText: 'text-[#385370]',
    accentBg: 'bg-[#1e2e3e]',
    accentBorder: 'border-slate-300',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    highlight: 'bg-slate-50',
    buttonColor: 'bg-[#1e2e3e] hover:bg-[#203a54] text-white',
    badgeHeader: 'bg-[#1a2e40] text-slate-200 border-[#1e3a5f]',
    cardBorder: 'border-slate-200',
    colorDot: 'bg-[#1e2e3e]',
  },
  indigo: {
    id: 'indigo',
    name: 'Escritório Aço',
    primary: 'bg-[#27303a]',
    primaryText: 'text-[#27303a]',
    border: 'border-[#3d4a59]/20',
    ring: 'focus:ring-[#27303a] focus:border-[#27303a]',
    accentText: 'text-slate-600',
    accentBg: 'bg-[#27303a]',
    accentBorder: 'border-slate-300',
    badge: 'bg-slate-100 text-[#27303a] border-slate-200',
    highlight: 'bg-slate-50',
    buttonColor: 'bg-[#27303a] hover:bg-[#364352] text-white',
    badgeHeader: 'bg-[#1a2026] text-slate-200 border-[#27303a]',
    cardBorder: 'border-slate-200',
    colorDot: 'bg-slate-500',
  },
  crimson: {
    id: 'crimson',
    name: 'Gabinete Grafite',
    primary: 'bg-[#2d3748]',
    primaryText: 'text-[#2d3748]',
    border: 'border-slate-200',
    ring: 'focus:ring-[#2d3748] focus:border-[#2d3748]',
    accentText: 'text-slate-600',
    accentBg: 'bg-[#4a5568]',
    accentBorder: 'border-slate-300',
    badge: 'bg-slate-100 text-slate-900 border-slate-200',
    highlight: 'bg-slate-50',
    buttonColor: 'bg-[#2d3748] hover:bg-[#4a5568] text-white',
    badgeHeader: 'bg-[#1a202c] text-slate-200 border-slate-700',
    cardBorder: 'border-slate-200',
    colorDot: 'bg-[#2d3748]',
  }
};

// e-SAJ 19 Options Strategy Structure
interface CalculationInputsRef {
  valorCausa: number;
  valorSatisfacao: number;
  valorCredito: number;
  valorCondenacao: number;
  temCondenacao: boolean;
  quantidadeAutores: number;
  valorMonteMor: number;
  valorPagoAutor: number;
  despesasProcessuaisSoma: number;
  isPosCutoff: boolean;
  isTituloExtrajudicial: boolean;
  jecCumprimentoIsMafe: boolean;
  tipoHabilitacao: 'inicial' | 'recurso';
  execIncluiEncargos?: boolean;
  queixaDistribuicao?: boolean;
  queixaRecurso?: boolean;
}

interface Option {
  id: string;
  category: 'comum' | 'jec';
  name: string;
  desc: string;
  legalBase: string;
  inputs: {
    valorCausa?: boolean;
    valorSatisfacao?: boolean;
    valorCredito?: boolean;
    valorCondenacao?: boolean;
    quantidadeAutores?: boolean;
    valorMonteMor?: boolean;
    valorPagoAutor?: boolean;
    despesasSoma?: boolean;
    extrajudicial?: boolean;
    mafe?: boolean;
  };
  calculate: (params: CalculationInputsRef) => {
    valorTotal: number;
    itens: { name: string; value: number; baseLegal: string }[];
    detalheMemoria: string;
    warning?: string;
  };
}

const eSajOptions: Option[] = [
  { 
    id: 'comum_1', 
    category: 'comum', 
    name: 'Comum 1: Petição Inicial / Reconvenção / Embargos', 
    desc: 'Custas devidas para a instauração de processo comum cível, reconvenção ou embargos de devedor.', 
    legalBase: 'Art. 4º, I, Lei Estadual nº 11.608/2003', 
    inputs: { valorCausa: true },
    calculate: ({ valorCausa, isPosCutoff }) => {
      const pct = isPosCutoff ? 0.015 : 0.01;
      const val = clamp(valorCausa * pct);
      return {
        valorTotal: val,
        itens: [{ name: `Taxa Judiciária Inicial (${(pct * 100).toFixed(1)}%)`, value: val, baseLegal: 'Art. 4º, I, Lei nº 11.608/2003' }],
        detalheMemoria: `* Alíquota Aplicada: ${(pct * 100).toFixed(1)}% do valor da causa.\n* Valor Calculado: R$ ${(valorCausa * pct).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n* Recolhimento Efetivo (Respeitados piso legal e teto estadual): R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }
  },
  { 
    id: 'comum_2', 
    category: 'comum', 
    name: 'Comum 2: Execução de Título Extrajudicial', 
    desc: 'Taxa devida para a distribuição e processamento de Execuções de Título Extrajudicial.', 
    legalBase: 'Art. 4º, § 3º, Lei nº 11.608/2003', 
    inputs: { valorCausa: true, valorSatisfacao: true },
    calculate: ({ valorCausa, valorSatisfacao, isPosCutoff, execIncluiEncargos }) => {
      if (!isPosCutoff) {
        const vCausa = clamp(valorCausa * 0.01);
        const vSat = clamp(valorSatisfacao * 0.01);
        return {
          valorTotal: vCausa + vSat,
          itens: [
            { name: 'Distribuição Executivo Extrajudicial (1% com limites legais)', value: vCausa, baseLegal: 'Art. 4º, I, Lei nº 11.608/03' },
            { name: 'Satisfação ao Final (1% com limites legais)', value: vSat, baseLegal: 'Art. 4, III, Lei nº 11.608/03' }
          ],
          detalheMemoria: `* Distribuição Inicial (Alíquota de 1.0% com aplicação de limites legais): R$ ${vCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n* Satisfação da Execução (Alíquota de 1.0% com aplicação de limites legais): R$ ${vSat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      } else {
        const vCausa = clamp(valorCausa * 0.02);
        const notaEncargos = execIncluiEncargos 
          ? '\n* Confirmação Legal: O valor declarado já inclui a dívida, encargos e os 10% de honorários advocatícios iniciais do Art. 827, CPC.'
          : '\n* Atenção de Cálculo: Certifique-se de incluir a dívida, encargos e os 10% de honorários advocatícios do Art. 827, CPC.';
        return {
          valorTotal: vCausa,
          itens: [{ name: 'Execução Eletrônica Unificada (2% com limites legais)', value: vCausa, baseLegal: 'Art. 4º, § 3, Lei 11.608' }],
          detalheMemoria: `* Regime de Alíquota unificado em 2.0% cobrado na distribuição.\n* Valor Efetivo (Observados limites legais): R$ ${vCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${notaEncargos}`,
          warning: !execIncluiEncargos ? 'Por regra legal (Art. 827, CPC), a base de cálculo da taxa de execução extrajudicial pós-03/01/2024 deve contemplar a dívida principal, encargos e 10% de honorários.' : undefined
        };
      }
    }
  },
  { 
    id: 'comum_3', 
    category: 'comum', 
    name: 'Comum 3: Apelação / Recurso Adesivo', 
    desc: 'Preparo recursal incidente sobre o valor da causa ou sobre o valor fixado na condenação.', 
    legalBase: 'Art. 4º, II, Lei nº 11.608/2003', 
    inputs: { valorCausa: true, valorCondenacao: true },
    calculate: ({ valorCausa, valorCondenacao, temCondenacao }) => {
      const base = temCondenacao ? valorCondenacao : valorCausa;
      const val = clamp(base * 0.04);
      return {
        valorTotal: val,
        itens: [{ name: `Preparo Recursal de Apelação (4.0% sobre ${temCondenacao ? 'condenação' : 'causa'})`, value: val, baseLegal: 'Art. 4º, II, Lei nº 11.608/2003' }],
        detalheMemoria: `* Alíquota de Preparo: 4.0% incidente sobre o valor da ${temCondenacao ? 'sentença condenatória' : 'causa'}.\n* Base Selecionada: R$ ${base.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n* Taxa Devida (Observados limites legais): R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }
  },
  { 
    id: 'comum_4', 
    category: 'comum', 
    name: 'Comum 4: Instauração Cumprimento Sentença', 
    desc: 'Taxa judiciária devida para o início da fase de cumprimento de sentença.', 
    legalBase: 'Art. 4º, Lei Paulista nº 17.785/2023', 
    inputs: { valorCredito: true },
    calculate: ({ valorCredito, isPosCutoff }) => {
      if (!isPosCutoff) {
        return {
          valorTotal: 0,
          itens: [],
          detalheMemoria: '* Peticionamento anterior a 03/01/2024: Entrada ISENTA de taxas de custas cíveis.'
        };
      } else {
        const val = clamp(valorCredito * 0.02);
        return {
          valorTotal: val,
          itens: [{ name: 'Fase de Instauração Cumprimento Sentença (2.0%)', value: val, baseLegal: 'Art. 4 da Lei nº 11.608/03' }],
          detalheMemoria: `* Alíquota: 2.0% do valor do crédito demandado.\n* Base do Crédito: R$ ${valorCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n* Taxa Devida (Observados limites legais): R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      }
    }
  },
  { 
    id: 'comum_5', 
    category: 'comum', 
    name: 'Comum 5: Distribuição Cumprimento (Julgado Externo)', 
    desc: 'Taxa devida para a petição inicial de cumprimento de sentença com título judicial de origem externa.', 
    legalBase: 'Art. 4º, Lei nº 11.608/2003', 
    inputs: { valorCausa: true, valorSatisfacao: true, valorCredito: true },
    calculate: ({ valorCausa, valorSatisfacao, valorCredito, isPosCutoff }) => {
      if (!isPosCutoff) {
        const vCausa = clamp(valorCausa * 0.01);
        const vSat = clamp(valorSatisfacao * 0.01);
        return {
          valorTotal: vCausa + vSat,
          itens: [
            { name: 'Distribuição Cumprimento Externo (1%)', value: vCausa, baseLegal: 'Art. 4º, I, Lei nº 11.608/03' },
            { name: 'Satisfação Julgado (1%)', value: vSat, baseLegal: 'Art. 4º, III, Lei nº 11.608/03' }
          ],
          detalheMemoria: `* Distribuição (Alíquota de 1% respeitados os limites legais): R$ ${vCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n* Satisfação (Alíquota de 1% respeitados os limites legais): R$ ${vSat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      } else {
        const vCred = clamp(valorCredito * 0.02);
        return {
          valorTotal: vCred,
          itens: [{ name: 'Distribuição Cumprimento Título Externo (2.0%)', value: vCred, baseLegal: 'Art. 4 da Lei 11.608' }],
          detalheMemoria: `* Alíquota unificada em 2.0% do valor do título externo.\n* Valor Regulamentar: R$ ${vCred.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      }
    }
  },
  { 
    id: 'comum_6', 
    category: 'comum', 
    name: 'Comum 6: Satisfação da Execução / Cumprimento', 
    desc: 'Taxa devida ao final do processo no momento da extinção por satisfação da obrigação.', 
    legalBase: 'Art. 4º, III, Lei nº 11.608/2003', 
    inputs: { valorSatisfacao: true },
    calculate: ({ valorSatisfacao, isPosCutoff }) => {
      if (!isPosCutoff) {
        const val = clamp(valorSatisfacao * 0.01);
        return {
          valorTotal: val,
          itens: [{ name: 'Taxa Satisfeita ao Final (1.0%)', value: val, baseLegal: 'Art. 4º, III, Lei nº 11.608/2003' }],
          detalheMemoria: `* Alíquota de 1.0% do montante satisfeito ao final.\n* Valor Regulamentar: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      } else {
        return {
          valorTotal: 0,
          itens: [],
          detalheMemoria: '* Isento na fase da satisfação (recolhido integralmente na inicial/cumprimento de 2% pós-2024).'
        };
      }
    }
  },
  { 
    id: 'comum_7', 
    category: 'comum', 
    name: 'Comum 7: Execução Fiscal', 
    desc: 'Recolhimento incidente sobre execuções fiscais estaduais ou municipais.', 
    legalBase: 'Lei 11.608/2003', 
    inputs: { valorCausa: true, valorSatisfacao: true, valorCredito: true },
    calculate: ({ valorCausa, valorSatisfacao, valorCredito, isPosCutoff }) => {
      if (!isPosCutoff) {
        const vCausa = clamp(valorCausa * 0.01);
        const vSat = clamp(valorSatisfacao * 0.01);
        return {
          valorTotal: vCausa + vSat,
          itens: [
            { name: 'Execução Fiscal - Tabela Inicial (1.0%)', value: vCausa, baseLegal: 'Art. 4º, I, Lei nº 11.608/2003' },
            { name: 'Execução Fiscal - Taxa Satisfação (1.0%)', value: vSat, baseLegal: 'Art. 4º, III, Lei nº 11.608/2003' }
          ],
          detalheMemoria: `* Distribuição (Alíquota de 1% respeitados os limites legais): R$ ${vCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n* Extinção pelo pagamento (Alíquota de 1% respeitados os limites legais): R$ ${vSat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      } else {
        const vCred = clamp(valorCredito * 0.02);
        return {
          valorTotal: vCred,
          itens: [{ name: 'Taxa Única de Execução Fiscal (2.0%)', value: vCred, baseLegal: 'Lei nº 11.608/03 (Reforma)' }],
          detalheMemoria: `* Alíquota unificada de 2.0% sobre o débito a cargo do vencido.\n* Valor Efetivo: R$ ${vCred.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      }
    }
  },
  { 
    id: 'comum_8', 
    category: 'comum', 
    name: 'Comum 8: Agravo de Instrumento', 
    desc: 'Preparo recursal fixo exigido para interposição de Agravo de Instrumento.', 
    legalBase: 'Art. 4º, § 5º, Lei nº 11.608/03', 
    inputs: {},
    calculate: ({ isPosCutoff }) => {
      const ufesps = isPosCutoff ? 15 : 10;
      const val = ufesps * UFESP_2026;
      return {
        valorTotal: val,
        itens: [{ name: `Guia de Agravo Ordinário (${ufesps} UFESPs)`, value: val, baseLegal: 'Art. 4º, § 5º, Lei nº 11.608/2003' }],
        detalheMemoria: `* Taxa judiciária fixa em UFESPs: ${ufesps} UFESPs.\n* Total: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }
  },
  { 
    id: 'comum_9', 
    category: 'comum', 
    name: 'Comum 9: Cartas (Precatórias / Ordem / Arbitrais)', 
    desc: 'Custas destinadas à expedição e processamento de Cartas Precatórias, de Ordem ou Arbitrais.', 
    legalBase: 'Art. 4º, § 2º, Lei nº 11.608/03', 
    inputs: {},
    calculate: () => {
      const val = 10 * UFESP_2026;
      return {
        valorTotal: val,
        itens: [{ name: 'Expediente de Custas das Cartas (10 UFESPs)', value: val, baseLegal: 'Art. 4º, § 2º, Lei nº 11.608/2003' }],
        detalheMemoria: `* Custas incidentes em atos deprecados: 10 UFESPs.\n* Total: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }
  },
  { 
    id: 'comum_10', 
    category: 'comum', 
    name: 'Comum 10: Partilha / Inventário / Divórcio', 
    desc: 'Custas escalonadas aplicáveis para partilha de bens, inventário e divórcio.', 
    legalBase: 'Art. 4º, § 7º, Lei nº 11.608/03', 
    inputs: { valorMonteMor: true },
    calculate: ({ valorMonteMor }) => {
      let ufesps = 10;
      let txt = 'Até R$ 50.000,00';
      if (valorMonteMor <= 50000) {
        ufesps = 10;
        txt = 'Até R$ 50.000,00';
      } else if (valorMonteMor <= 500000) {
        ufesps = 100;
        txt = 'R$ 50.001,00 a R$ 500.000,05';
      } else if (valorMonteMor <= 2000000) {
        ufesps = 300;
        txt = 'R$ 500.001,00 a R$ 2.000.000,05';
      } else if (valorMonteMor <= 5000000) {
        ufesps = 1000;
        txt = 'R$ 2.000.001,00 a R$ 5.000.000,05';
      } else {
        ufesps = 3000;
        txt = 'Superior a R$ 5.000.000,05';
      }
      const val = ufesps * UFESP_2026;
      return {
        valorTotal: val,
        itens: [{ name: `Inventário / Partilha (Faixa: ${txt})`, value: val, baseLegal: 'Art. 4º, § 7º, Lei nº 11.608/2003' }],
        detalheMemoria: `* Valor Total Declarado: R$ ${valorMonteMor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n* Faixa Aplicada: ${ufesps} UFESPs\n* Total: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }
  },
  { 
    id: 'comum_11', 
    category: 'comum', 
    name: 'Comum 11: Habilitação Retardatária de Crédito', 
    desc: 'Custas para habilitação retardatária em recuperação judicial ou falência.', 
    legalBase: 'Lei n. 11.101/2005', 
    inputs: { valorCausa: true },
    calculate: ({ valorCausa, isPosCutoff, tipoHabilitacao }) => {
      if (tipoHabilitacao === 'inicial') {
        const pct = isPosCutoff ? 0.015 : 0.01;
        const val = clamp(valorCausa * pct);
        return {
          valorTotal: val,
          itens: [{ name: `Habilitação inicial de crédito (${(pct * 100).toFixed(1)}%)`, value: val, baseLegal: 'Lei n. 11.101/05' }],
          detalheMemoria: `* Modalidade Distribuição Equivalente ao Item 1.\n* Valor Efetivo: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      } else {
        const val = clamp(valorCausa * 0.04);
        return {
          valorTotal: val,
          itens: [{ name: 'Habilitação preparando recursos (4.0%)', value: val, baseLegal: 'Art. 4, II' }],
          detalheMemoria: `* Modalidade Preparo recursal nos incidentes: 4.0% do valor do crédito.\n* Valor Efetivo: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      }
    }
  },
  { 
    id: 'comum_12', 
    category: 'comum', 
    name: 'Comum 12: Ações Penais em Geral', 
    desc: 'Taxa judiciária aplicável nos processos criminais de ação pública.', 
    legalBase: 'Art. 4º, IX, Lei nº 11.608/2003', 
    inputs: {},
    calculate: () => {
      const val = 100 * UFESP_2026;
      return {
        valorTotal: val,
        itens: [{ name: 'Ação Penal de Natureza Sucumbencial (100 UFESPs)', value: val, baseLegal: 'Art. 4º, IX, Lei nº 11.608/2003' }],
        detalheMemoria: '* Custas fixadas de forma única e devidas exclusivamente ao final pelo réu sucumbente condenado.\n* Total Guia: R$ 3.842,00'
      };
    }
  },
  { 
    id: 'comum_13', 
    category: 'comum', 
    name: 'Comum 13: Ações Penais Privadas (Queixa-crime)', 
    desc: 'Taxa aplicável nos processos criminais privados ou queixa-crime.', 
    legalBase: 'Art. 4º, § 11, Lei nº 11.608/03',
    inputs: {},
    calculate: ({ queixaDistribuicao, queixaRecurso }) => {
      // 50 UFESPs na distribuição e/ou 50 UFESPs na interposição de recurso (selecionáveis isoladamente).
      const incluiDist = queixaDistribuicao !== false; // distribuição marcada por padrão
      const incluiRec = queixaRecurso === true;
      const vDist = incluiDist ? 50 * UFESP_2026 : 0;
      const vRec = incluiRec ? 50 * UFESP_2026 : 0;
      const itens: { name: string; value: number; baseLegal: string }[] = [];
      if (incluiDist) {
        itens.push({ name: 'Queixa-Crime Distribuição Inicial (50 UFESPs)', value: vDist, baseLegal: 'Art. 4º, § 11, Lei nº 11.608/2003' });
      }
      if (incluiRec) {
        itens.push({ name: 'Preparo Recursal Queixa (50 UFESPs)', value: vRec, baseLegal: 'Art. 4º, § 11, Lei nº 11.608/2003' });
      }
      const linhas: string[] = [];
      if (incluiDist) linhas.push(`* Distribuição Inicial (50 UFESPs): R$ ${vDist.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      if (incluiRec) linhas.push(`* Interposição de recurso (50 UFESPs): R$ ${vRec.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      if (linhas.length === 0) linhas.push('* Nenhuma incidência selecionada (assinale distribuição e/ou recurso).');
      return {
        valorTotal: vDist + vRec,
        itens,
        detalheMemoria: linhas.join('\n')
      };
    }
  },
  { 
    id: 'comum_14', 
    category: 'comum', 
    name: 'Comum 14: Litisconsórcio Ativo Voluntário', 
    desc: 'Custas devidas pelo excedente de litisconsortes ativos voluntários.', 
    legalBase: 'Art. 4º, § 10, Lei nº 11.608/2003', 
    inputs: { quantidadeAutores: true },
    calculate: ({ quantidadeAutores }) => {
      // A sobretaxa só incide sobre os autores que EXCEDEREM os 10 primeiros:
      // 10 UFESPs por lote ou fração de 10 autores excedentes (Art. 4º, § 10).
      const excedentes = Math.max(0, quantidadeAutores - 10);
      const lotes = Math.ceil(excedentes / 10);
      const val = lotes * 10 * UFESP_2026;
      return {
        valorTotal: val,
        itens: [{ name: `Excesso Litisconsorcial (${quantidadeAutores} autores, ${lotes} lote(s) excedente(s))`, value: val, baseLegal: 'Art. 4º, § 10, Lei nº 11.608/2003' }],
        detalheMemoria: `* Total de Litisconsortes: ${quantidadeAutores} Autores\n* Isentos de Sobretaxa: 10 primeiros autores\n* Autores Excedentes: ${excedentes}\n* Lotes/frações de 10 excedentes: ${lotes}\n* Total Devido Adicional: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${lotes === 0 ? ' (até 10 autores não há sobretaxa)' : ''}`
      };
    }
  },
  { 
    id: 'comum_15', 
    category: 'comum', 
    name: 'Comum 15: Litisconsorte Ulterior / Assistência', 
    desc: 'Custas para a intervenção de terceiros ou assistência na lide.', 
    legalBase: 'Art. 4º, § 1º, Lei nº 11.608/03', 
    inputs: { valorPagoAutor: true },
    calculate: ({ valorPagoAutor }) => {
      return {
        valorTotal: valorPagoAutor,
        itens: [{ name: 'Taxa Judiciária Assistente / Ingressante', value: valorPagoAutor, baseLegal: 'Art. 4º, § 1º, Lei nº 11.608/2003' }],
        detalheMemoria: `* O assistente voluntário retardatário paga o exato montante já despendido pelo autor original na frentaria.\n* Valor Guia: R$ ${valorPagoAutor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }
  },
  { 
    id: 'jec_1', 
    category: 'jec', 
    name: 'JEC 1: Recurso Inominado (Preparo)', 
    desc: 'Preparo integral necessário para admissibilidade do Recurso Inominado nos Juizados Especiais.', 
    legalBase: 'Art. 54, p.único, Lei n. 9.099/1995', 
    inputs: { valorCausa: true, valorCondenacao: true, extrajudicial: true },
    calculate: ({ valorCausa, valorCondenacao, temCondenacao, isPosCutoff, isTituloExtrajudicial }) => {
      const floorJec = 5 * UFESP_2026;

      // Parcela A: Ingresso dispensado
      let aliqIng = 0.01;
      if (isPosCutoff) {
        aliqIng = isTituloExtrajudicial ? 0.02 : 0.015;
      }
      const canIng = valorCausa * aliqIng;
      const parIngSelection = Math.max(floorJec, canIng);

      // Parcela B: Preparo
      const basePrep = temCondenacao ? valorCondenacao : valorCausa;
      const canPrep = basePrep * 0.04;
      const parPrepSelection = Math.max(floorJec, canPrep);

      return {
        valorTotal: parIngSelection + parPrepSelection,
        itens: [
          { name: `Ingresso Dispensado JEC (${(aliqIng * 100).toFixed(1)}% - com Piso)`, value: parIngSelection, baseLegal: 'Art. 54, p.único, Lei 9099' },
          { name: 'Preparo Recursal JEC (4.0% - com Piso)', value: parPrepSelection, baseLegal: 'Art. 4º, II, Lei 11.608' }
        ],
        detalheMemoria: `* Parcela de Ingresso: Base de R$ ${valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} com alíquota de ${(aliqIng * 100).toFixed(1)}% (Respeitado o piso de R$ ${floorJec.toFixed(2)}) => R$ ${parIngSelection.toLocaleString('pt-BR')}\n* Parcela de Preparo: Base de R$ ${basePrep.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} com alíquota de 4.0% (Respeitado o piso de R$ ${floorJec.toFixed(2)}) => R$ ${parPrepSelection.toLocaleString('pt-BR')}\n* Consolidado Preparo JEC: R$ ${(parIngSelection + parPrepSelection).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }
  },
  { 
    id: 'jec_2', 
    category: 'jec', 
    name: 'JEC 2: Cumprimento de Sentença', 
    desc: 'Custas incidentes para o cumprimento de sentença em sede de juizados especiais.', 
    legalBase: 'Lei Federal 9.099/95', 
    inputs: { valorCredito: true, mafe: true },
    calculate: ({ valorCredito, isPosCutoff, jecCumprimentoIsMafe }) => {
      if (!jecCumprimentoIsMafe) {
        return {
          valorTotal: 0,
          itens: [],
          detalheMemoria: '* Execução JEC regular: Totalmente ISENTA de taxas de frentaria ou satisfação.'
        };
      } else {
        const pct = isPosCutoff ? 0.02 : 0.01;
        const val = valorCredito * pct;
        return {
          valorTotal: val,
          itens: [{ name: `Taxa Extraordinária JEC (Derrota/Má-fé - ${(pct * 100).toFixed(1)}%)`, value: val, baseLegal: 'Lei 9.099/95' }],
          detalheMemoria: `* Encargo por litigância de má-fé / derrota recursal aplicado com alíquota excepcional de ${(pct * 100).toFixed(1)}% do crédito.\n* Total Guia: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
      }
    }
  },
  { 
    id: 'jec_3', 
    category: 'jec', 
    name: 'JEC 3: Ausência Injustificada (Autora em Audiência)', 
    desc: 'Custas punitivas aplicadas nos casos de extinção por ausência da parte autora.', 
    legalBase: 'Art. 51, I, § 2º, Lei nº 9.099/1995', 
    inputs: { valorCausa: true, extrajudicial: true },
    calculate: ({ valorCausa, isPosCutoff, isTituloExtrajudicial }) => {
      const floorJec = 5 * UFESP_2026;
      const pct = isPosCutoff ? (isTituloExtrajudicial ? 0.02 : 0.015) : 0.01;
      const val = Math.max(floorJec, valorCausa * pct);
      return {
        valorTotal: val,
        itens: [{ name: `Ingresso Punitivo Ausência (${(pct * 100).toFixed(1)}% - com Piso)`, value: val, baseLegal: 'Art. 51, I, § 2º, Lei 9099' }],
        detalheMemoria: `* Extinção imputada por ausência da parte autora.\n* Taxa de ingresso regulamentar calculada retroativamente: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }
  },
  { 
    id: 'jec_4', 
    category: 'jec', 
    name: 'JEC 4: Despesas Processuais Finais Pendentes', 
    desc: 'Lançamento de despesas processuais finais calculadas individualmente.', 
    legalBase: 'Guia FEDTJ / Outras', 
    inputs: { despesasSoma: true },
    calculate: ({ despesasProcessuaisSoma }) => {
      return {
        valorTotal: despesasProcessuaisSoma,
        itens: [{ name: 'Despesas Processuais Acumuladas no JEC ao Final', value: despesasProcessuaisSoma, baseLegal: 'Portarias JEC' }],
        detalheMemoria: `* Liquidação de ARs e diligências pendentes de recolhimento.\n* Total apurado manual: R$ ${despesasProcessuaisSoma.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }
  }
];

export default function WizardCalculator({
  compact = false,
  onResult,
}: {
  compact?: boolean;
  onResult?: (total: number, memo: string) => void;
}) {
  const [activePalette, setActivePalette] = useState<keyof typeof PALETTES>('slate');
  const [subsystem, setSubsystem] = useState<'esaj' | 'eproc'>('esaj');
  
  // Custom Color Theme variables derived from palette state
  const col = PALETTES[activePalette];

  // e-SAJ States
  const [selectedSajId, setSelectedSajId] = useState<string>('comum_1');
  const [peticionamentoAno, setPeticionamentoAno] = useState<'24' | '23'>('24'); // '24' = A partir de 03/01/2024
  
  // Dynamic Option inputs values
  const [vCausaStr, setVCausaStr] = useState<string>('150000.00');
  const [vSatisfacaoStr, setVSatisfacaoStr] = useState<string>('0.00');
  const [vCreditoStr, setVCreditoStr] = useState<string>('0.00');
  const [vCondenacaoStr, setVCondenacaoStr] = useState<string>('0.00');
  const [vMonteMorStr, setVMonteMorStr] = useState<string>('0.00');
  const [vPagoAutorStr, setVPagoAutorStr] = useState<string>('0.00');
  const [vDespesasStr, setVDespesasStr] = useState<string>('0.00');
  const [qtdAutores, setQtdAutores] = useState<number>(1);
  
  const [temCondenacao, setTemCondenacao] = useState<boolean>(false);
  const [isExtraj, setIsExtraj] = useState<boolean>(false);
  const [isMafe, setIsMafe] = useState<boolean>(false);
  const [isPreparoEmDobro, setIsPreparoEmDobro] = useState<boolean>(false);
  const [habilitacaoModalidade, setHabilitacaoModalidade] = useState<'inicial' | 'recurso'>('inicial');
  // Ações Penais Privadas (comum_13): incidências selecionáveis isoladamente
  const [queixaDistribuicao, setQueixaDistribuicao] = useState<boolean>(true);
  const [queixaRecurso, setQueixaRecurso] = useState<boolean>(false);

  // Postage & Diligence general adds
  const [postageAddresses, setPostageAddresses] = useState<number>(0);
  // Diligências do Oficial de Justiça (GRD) por tipo de mandado
  const [diligDeslocamento, setDiligDeslocamento] = useState<number>(0);
  const [diligRemoto, setDiligRemoto] = useState<number>(0);
  const [diligConvertido, setDiligConvertido] = useState<number>(0);
  const totalDiligencias = diligDeslocamento + diligRemoto + diligConvertido;

  // EPROC specific states
  const [eprocTab, setEprocTab] = useState<'preparo' | 'complementares' | 'rateio'>('preparo');
  
  // Eproc A states
  const [epAOrigMonth, setEpAOrigMonth] = useState<string>('01/2023');
  const [epAOrigValStr, setEpAOrigValStr] = useState<string>('50000.00');
  const [eprocCorrectionMode, setEprocCorrectionMode] = useState<'none' | 'estimated' | 'official'>('none');
  const [eprocTabela, setEprocTabela] = useState<string>('padrao');
  const epASimulated = eprocCorrectionMode === 'estimated';

  // Dedicated states for Inline Cause Correction (e-SAJ)
  const [causaDataInicial, setCausaDataInicial] = useState<string>('01/2024');
  const [causaDataFinal, setCausaDataFinal] = useState<string>('05/2026');
  const [causaTabela, setCausaTabela] = useState<string>('padrao');

  // Dedicated states for Inline Condemn Correction (e-SAJ)
  const [condenacaoDataInicial, setCondenacaoDataInicial] = useState<string>('01/2024');
  const [condenacaoDataFinal, setCondenacaoDataFinal] = useState<string>('05/2026');
  const [condenacaoTabela, setCondenacaoTabela] = useState<string>('padrao');

  // Eproc B states
  const [epBNewValStr, setEpBNewValStr] = useState<string>('200000.00');
  const [epBPrevPaidStr, setEpBPrevPaidStr] = useState<string>('1500.00');

  // Eproc C states
  const [epCCausaStr, setEpCCausaStr] = useState<string>('100000.00');
  const [epCPercent, setEpCPercent] = useState<number>(50);

  // New States for Correction Modal and CPC rules
  const [execIncluiEncargos, setExecIncluiEncargos] = useState<boolean>(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [correctionTargetField, setCorrectionTargetField] = useState<'causa' | 'condenacao' | 'eproc_preparo' | null>(null);

  const [mcValorOriginal, setMcValorOriginal] = useState<string>('100000.00');
  const [mcDataInicial, setMcDataInicial] = useState<string>('01/2024');
  const [mcDataFinal, setMcDataFinal] = useState<string>('05/2026');
  const [mcTabela, setMcTabela] = useState<string>('padrao');

  // General Status copy feedback
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);
  // Qual guia teve o valor copiado por último (para feedback visual no botão)
  const [copiedGuia, setCopiedGuia] = useState<string | null>(null);

  // Emissão automática via extensão (autofill no Portal de Custas)
  const [extPresente, setExtPresente] = useState<boolean>(false);
  const [autofillEnviado, setAutofillEnviado] = useState<boolean>(false);
  const [dadosEmissao, setDadosEmissao] = useState({
    cpf: '', nome: '', telefone: '', endereco: '', municipio: '', processo: '',
  });

  // Parsing values helper
  const pVal = (s: string) => Math.max(0, parseFloat(s) || 0);

  // Input Formatting Helpers
  const handleAmountChange = (val: string, setter: (v: string) => void) => {
    const clean = val.replace(/[^0-9.,]/g, '');
    setter(clean);
  };

  const handleAmountBlur = (val: string, setter: (v: string) => void) => {
    let clean = val.replace(',', '.');
    const segments = clean.split('.');
    if (segments.length > 2) {
      const last = segments.pop();
      clean = segments.join('') + '.' + last;
    }
    const parsed = parseFloat(clean);
    setter(isNaN(parsed) ? '0.00' : parsed.toFixed(2));
  };

  const handleOpenCalculatorModal = (target: 'causa' | 'condenacao' | 'eproc_preparo', currentValStr: string) => {
    setCorrectionTargetField(target);
    setMcValorOriginal(currentValStr);
    
    // Set default initial date based on target
    if (target === 'eproc_preparo') {
      setMcDataInicial(epAOrigMonth || '01/2023');
      setMcTabela(eprocTabela);
    } else if (target === 'causa') {
      setMcDataInicial(causaDataInicial);
      setMcTabela(causaTabela);
    } else if (target === 'condenacao') {
      setMcDataInicial(condenacaoDataInicial);
      setMcTabela(condenacaoTabela);
    }
    setMcDataFinal('05/2026'); // Current month corresponding to date metadata
    setIsCorrectionModalOpen(true);
  };

  const applyCorrectedValue = (val: number) => {
    if (correctionTargetField === 'causa') {
      setCausaDataInicial(mcDataInicial);
      setCausaDataFinal(mcDataFinal);
      setCausaTabela(mcTabela);
    } else if (correctionTargetField === 'condenacao') {
      setCondenacaoDataInicial(mcDataInicial);
      setCondenacaoDataFinal(mcDataFinal);
      setCondenacaoTabela(mcTabela);
    } else if (correctionTargetField === 'eproc_preparo') {
      setEpAOrigMonth(mcDataInicial);
      setEprocTabela(mcTabela);
      setEprocCorrectionMode('official');
    }
    setIsCorrectionModalOpen(false);
  };

  // E-SAJ Core Calculator Implementation
  const selectedESajOpt = eSajOptions.find(o => o.id === selectedSajId) || eSajOptions[0];
  const isPosCutoff = peticionamentoAno === '24';

  const isUptCause = ['comum_3', 'comum_11', 'jec_1', 'jec_3'].includes(selectedSajId);
  const isUptCondenacao = ['comum_3', 'jec_1'].includes(selectedSajId);

  // Real-time evaluation of corrections
  const causaCorrResult = calculateMonetaryCorrection(
    pVal(vCausaStr),
    causaDataInicial,
    causaDataFinal,
    causaTabela
  );

  const condenacaoCorrResult = calculateMonetaryCorrection(
    pVal(vCondenacaoStr),
    condenacaoDataInicial,
    condenacaoDataFinal,
    condenacaoTabela
  );

  const eprocCorrResult = calculateMonetaryCorrection(
    pVal(epAOrigValStr),
    epAOrigMonth,
    '05/2026',
    eprocTabela
  );
  
  const currentInputs: CalculationInputsRef = {
    valorCausa: isUptCause ? causaCorrResult.valorCorrigido : pVal(vCausaStr),
    valorSatisfacao: pVal(vSatisfacaoStr),
    valorCredito: pVal(vCreditoStr),
    valorCondenacao: temCondenacao 
      ? (isUptCondenacao ? condenacaoCorrResult.valorCorrigido : pVal(vCondenacaoStr))
      : 0,
    temCondenacao,
    quantidadeAutores: qtdAutores,
    valorMonteMor: pVal(vMonteMorStr),
    valorPagoAutor: pVal(vPagoAutorStr),
    despesasProcessuaisSoma: pVal(vDespesasStr),
    isPosCutoff,
    isTituloExtrajudicial: isExtraj,
    jecCumprimentoIsMafe: isMafe,
    tipoHabilitacao: habilitacaoModalidade,
    execIncluiEncargos: execIncluiEncargos,
    queixaDistribuicao,
    queixaRecurso
  };

  // Calculate base results for chosen option
  const calcResults = selectedESajOpt.calculate(currentInputs);

  // Computed values for dynamic inputs labels
  const isPrimCause = ['comum_1', 'comum_2'].includes(selectedSajId);
  let valorCausaLabel = "Valor da Causa (R$)";
  if (isUptCause) {
    valorCausaLabel = "Valor de Base (Histórico) da Causa (R$)";
  } else if (isPrimCause) {
    valorCausaLabel = "Valor da causa no momento da distribuição (R$)";
  }

  let valorCondenacaoLabel = "Montante da Condenação Líquida (R$)";
  if (isUptCondenacao) {
    valorCondenacaoLabel = "Valor da Condenação Líquida Original (R$)";
  }

  // Reactive evaluation for standard simulation in modal
  const mcParsedVal = parseFloat(mcValorOriginal.replace(',', '.')) || 0;
  const currentMcResult = calculateMonetaryCorrection(mcParsedVal, mcDataInicial, mcDataFinal, mcTabela);

  // Apply despesas adicionais to e-SAJ
  const additionalItens: {name: string; value: number; baseLegal: string; source: string}[] = [];
  let additionsSum = 0;

  if (postageAddresses > 0 && subsystem === 'esaj') {
    const postageVal = postageAddresses * TARIFA_POSTAL_AR;
    additionsSum += postageVal;
    additionalItens.push({
      name: `Despesas Postais (${postageAddresses} Citação/AR)`,
      value: postageVal,
      baseLegal: 'Provimento CSM nº 2.516/2019',
      source: 'FEDTJ (120-1)'
    });
  }

  if (subsystem === 'esaj') {
    const diligencias: { qtd: number; tipo: keyof typeof DILIGENCIA_TIPOS }[] = [
      { qtd: diligDeslocamento, tipo: 'deslocamento' },
      { qtd: diligRemoto, tipo: 'remoto' },
      { qtd: diligConvertido, tipo: 'convertido' },
    ];
    diligencias.forEach(({ qtd, tipo }) => {
      if (qtd <= 0) return;
      const { ufesps, label } = DILIGENCIA_TIPOS[tipo];
      const actCost = ufesps * UFESP_2026;
      const actTotal = qtd * actCost;
      additionsSum += actTotal;
      additionalItens.push({
        name: `Diligências do Oficial — ${label} (${qtd} ato(s) × R$ ${actCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
        value: actTotal,
        baseLegal: 'Provimento CGJ vigente',
        source: 'GRD (Guia Oficial)'
      });
    });
  }

  // Pre-prepare total lists
  const eSajFinalItens: { name: string; value: number; baseLegal: string; source: string }[] = [];
  
  // Fill the list from calculations applying possible preparo em dobro
  calcResults.itens.forEach((it) => {
    let finalVal = it.value;
    let labelExtra = '';
    
    // Check if preparo em dobro applies (only for recursais)
    if (isPreparoEmDobro && (selectedSajId === 'comum_3' || selectedSajId === 'comum_11' || selectedSajId === 'comum_13' || selectedSajId === 'jec_1')) {
      finalVal = it.value * 2;
      labelExtra = ' [RECOLHIMENTO EM DOBRO - Art. 1007, § 4º CPC]';
    }

    eSajFinalItens.push({
      name: it.name + labelExtra,
      value: finalVal,
      baseLegal: it.baseLegal,
      source: 'DARE-SP (230-6)'
    });
  });

  // Append additions
  additionalItens.forEach((it) => {
    eSajFinalItens.push({
      name: it.name,
      value: it.value,
      baseLegal: it.baseLegal,
      source: it.source
    });
  });

  // Sum combined values
  const eSajTotalSum = eSajFinalItens.reduce((acc, current) => acc + current.value, 0);

  // Valores por guia (cada guia oficial é recolhida separadamente no portal).
  // DARE (taxa judiciária da classe) = total menos as despesas postais/diligências,
  // que vão em guias próprias (FEDTJ e GRD).
  const postalSum = postageAddresses > 0 ? postageAddresses * TARIFA_POSTAL_AR : 0;
  const grdSum = additionsSum - postalSum;
  const eSajDareSum = eSajTotalSum - additionsSum;

  // Dynamic plain text explanation for easy legal copy paste
  const eSajMemoText = `=====================================================
MEMÓRIA JURISCALC SP DE AUDITORIA DE RECOLHIMENTOS
=====================================================
Responsabilidade: Camelsec Workspace
CNPJ Relator: 51.811.543/0001-20
Sistema de Custas: e-SAJ TJSP (Exercício 2026 - UFESP: R$ 38,42)
Enquadramento: ${selectedESajOpt.name}
-----------------------------------------------------
PARÂMETROS DE AUDITORIA:
- Época do Peticionamento: ${isPosCutoff ? 'A partir de 03/01/2024 (Regra Nova da Lei nº 17.785/23)' : 'Anterior a 03/01/2024'}
- Base de Cálculo Causa: R$ ${currentInputs.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${
    isUptCause 
      ? ` (Atualizado via ${causaTabela === 'padrao' ? 'Opção 1 (Lei 14.905)' : causaTabela === 'ipcae' ? 'Opção 2 (IPCA-E)' : 'Opção 3 (INPC Antigo)'} de ${causaDataInicial} a ${causaDataFinal})` 
      : ''
  }
${temCondenacao ? `- Condenação Judicial Líquida: R$ ${currentInputs.valorCondenacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${
    isUptCondenacao 
      ? ` (Atualizada via ${condenacaoTabela === 'padrao' ? 'Opção 1 (Lei 14.905)' : condenacaoTabela === 'ipcae' ? 'Opção 2 (IPCA-E)' : 'Opção 3 (INPC Antigo)'} de ${condenacaoDataInicial} a ${condenacaoDataFinal})` 
      : ''
  }\n` : ''}${isPreparoEmDobro ? '- Alerta Técnico: PREPARO EM DOBRO MARCADO (Art. 1.007, § 4º do CPC)\n' : ''}
CÁLCULO SUBORDINADO DA TAXA JUDICIÁRIA:
${calcResults.detalheMemoria}

${additionalItens.length > 0 ? `DESPESAS PROCESSUAIS ADICIONAIS:\n${additionalItens.map(it => `* ${it.name}: R$ ${it.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join('\n')}\n` : ''}
-----------------------------------------------------
RESUMO GERAL DO PROTOCOLO SUCUMBÊNCIAL:
* Custas Judiciais da Classe: R$ ${(eSajTotalSum - additionsSum).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
* Despesas Postais/Atos Oficiais: R$ ${additionsSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
* GUIA CONSOLIDADA FINAL: R$ ${eSajTotalSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Douto Juízo, junta-se o cálculo fundamentado gerado pela Camelsec Workspace.`;

  // EPROC Calculation logic
  // A) Preparo Recursal
  const epAOriginal = pVal(epAOrigValStr);
  const epACorrectedVal = 
    eprocCorrectionMode === 'estimated' ? epAOriginal * 1.15 : 
    eprocCorrectionMode === 'official' ? eprocCorrResult.valorCorrigido : 
    epAOriginal;
  const epAPreparo = clamp(epACorrectedVal * 0.04);

  // B) Custas Complementares
  const epBNew = pVal(epBNewValStr);
  const epBPrev = pVal(epBPrevPaidStr);
  const epBCustomValue = clamp(epBNew * 0.015) - epBPrev;
  const epBFinal = Math.max(0, epBCustomValue);

  // C) Rateio / Fração
  const epCCausa = pVal(epCCausaStr);
  const epCInitial = clamp(epCCausa * 0.015);
  const epCFinal = epCInitial * (epCPercent / 100);

  const eprocMemoText = `=====================================================
COMENTÁRIO FINANCEIRO E-PROC - AUDITORIA TÉCNICA
=====================================================
Camelsec Workspace © 2026. Desenvolvido por Camelsec Plataform
Plataforma Camelsec (CNPJ: 51.811.543/0001-20)
-----------------------------------------------------
Tipo de Auditoria EPROC: ${
    eprocTab === 'preparo' ? 'A) Preparo Cível & Correção Monetária' :
    eprocTab === 'complementares' ? 'B) Custas Cíveis Complementares' :
    'C) Rateio de Fração Ativo'
  }
UFESP Base referencial (2026): R$ 38,42

${
  eprocTab === 'preparo' 
    ? `DADOS DO PREPARO RECURSAL EPROC:
- Valor Original da Causa: R$ ${epAOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Época Distribuição/Mês Inicial: ${epAOrigMonth}
- Reajuste Monetário Selecionado: ${
    eprocCorrectionMode === 'estimated' 
      ? 'Fator Estimado TJSP (1.15x Multiplicador)' 
      : eprocCorrectionMode === 'official' 
      ? `Correção Oficial (${eprocTabela === 'padrao' ? 'Opção 1 - Lei 14.905' : eprocTabela === 'ipcae' ? 'Opção 2 - IPCA-E' : 'Opção 3 - Antiga INPC'}) de ${epAOrigMonth} a 05/2026` 
      : 'Sem reajuste (Valor Histórico)'
  }
- Valor da Base Causa Atualizada: R$ ${epACorrectedVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Cálculo Recursal (4.0% com Piso e Teto): R$ ${epAPreparo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- NOTA: No E-PROC, o boleto é emitido de forma direta em Guia Única no sistema do processo.`
    : eprocTab === 'complementares' 
    ? `DADOS DAS CUSTAS COMPLEMENTARES EPROC:
- Novo Valor de Atribuição: R$ ${epBNew.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Alíquota Estadual do Recolhimento: 1.5%
- Custas Integrais devidas (com clamp): R$ ${clamp(epBNew * 0.015).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Custas já pagas em Guia Anterior: R$ ${epBPrev.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Saldo Restante devida a Complementar: R$ ${epBFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `DADOS DO RATEIO DE FRAÇÃO EPROC:
- Valor da Causa Base Recortada: R$ ${epCCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Custas Iniciais Plenas (1.5% com clamp): R$ ${epCInitial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Fração de Percentagem Devida (Cliente): ${epCPercent}%
- Parcela devida pelo correspondente: R$ ${epCFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
-----------------------------------------------------
VALOR TOTAL GUIA BOLETO ÚNICO E-PROC: R$ ${
  (eprocTab === 'preparo' ? epAPreparo : eprocTab === 'complementares' ? epBFinal : epCFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}`;

  // Master total based on active subsystem
  const finalUnifiedSum = subsystem === 'esaj' ? eSajTotalSum : (eprocTab === 'preparo' ? epAPreparo : eprocTab === 'complementares' ? epBFinal : epCFinal);
  const finalMemoStr = subsystem === 'esaj' ? eSajMemoText : eprocMemoText;

  // Há alguma data INVÁLIDA que esteja efetivamente em uso no cálculo atual?
  // Nesse caso o resultado usaria índices de fallback, então avisamos o usuário.
  const datasAtivasInvalidas =
    (subsystem === 'esaj' && isUptCause &&
      (!isValidMonthYear(causaDataInicial) || !isValidMonthYear(causaDataFinal))) ||
    (subsystem === 'esaj' && isUptCondenacao && temCondenacao &&
      (!isValidMonthYear(condenacaoDataInicial) || !isValidMonthYear(condenacaoDataFinal))) ||
    (subsystem === 'eproc' && eprocTab === 'preparo' && eprocCorrectionMode === 'official' &&
      !isValidMonthYear(epAOrigMonth));

  // Em modo compacto (painel lateral), emite o total/memória para o shell renderizar
  // a barra de total fixa fora da área rolável.
  useEffect(() => {
    if (onResult) onResult(finalUnifiedSum, finalMemoStr);
  }, [onResult, finalUnifiedSum, finalMemoStr]);

  // Fecha o modal de correção com a tecla Escape
  useEffect(() => {
    if (!isCorrectionModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCorrectionModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCorrectionModalOpen]);

  // Copy Memo function
  const handleCopyMemo = () => {
    navigator.clipboard.writeText(finalMemoStr);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  // Ao emitir uma guia, copia o valor exato (formato pt-BR sem separador de milhar,
  // pronto para colar no campo de valor do portal) e deixa o link abrir o sistema oficial.
  // O Portal de Custas não aceita pré-preenchimento via URL, então copiar o valor é o
  // máximo de automação possível hoje.
  const handleEmitGuia = (valor: number, id: string) => {
    const txt = valor.toFixed(2).replace('.', ',');
    navigator.clipboard?.writeText(txt);
    setCopiedGuia(id);
    setTimeout(() => setCopiedGuia((cur) => (cur === id ? null : cur)), 2500);
  };

  // Detecta a extensão JudsCalc (o content script anuncia 'JUDS_EXT_PRONTA').
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.source === window && ev.data && ev.data.type === 'JUDS_EXT_PRONTA') {
        setExtPresente(true);
      }
    };
    window.addEventListener('message', onMsg);
    window.postMessage({ type: 'JUDS_PING' }, '*'); // caso a extensão já esteja pronta
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Envia os dados calculados + informados para a extensão preencher o portal.
  const handleAutofillGuia = () => {
    const fmt = (v: number) =>
      v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dados = {
      cpf: dadosEmissao.cpf,
      nome: dadosEmissao.nome,
      telefone: dadosEmissao.telefone,
      endereco: dadosEmissao.endereco,
      uf: 'SP',
      municipio: dadosEmissao.municipio,
      processo: dadosEmissao.processo,
      tipoServico: mapServicoPortal(selectedSajId),
      valorCausa: fmt(currentInputs.valorCausa),
      valorCondenacao: temCondenacao ? fmt(currentInputs.valorCondenacao) : '',
      valorReceita: fmt(eSajDareSum),
    };
    window.postMessage({ type: 'JUDS_EMITIR_GUIA', dados }, '*');
    setAutofillEnviado(true);
    setTimeout(() => setAutofillEnviado(false), 4000);
  };

  return (
    <div className={`w-full bg-white rounded-xl border ${col.cardBorder} shadow-xs transition-all duration-300 font-sans`} id="juriscalc-main-appcard">
      
      {/* Elegantly styled legal header headnote */}
      {!compact && (
      <div className="flex flex-col border-b border-slate-100 bg-slate-50/60 p-6 rounded-t-xl text-left" id="wizard-header">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Calculator className={`w-4 h-4 ${col.accentText}`} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5e6b7c]">
                Tribunal de Justiça de São Paulo • Auditoria de Custas Estaduais
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-slate-900 leading-tight">
              Custas e Preparos Processuais
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Emissor e revisor tributário sob a Lei Estadual nº 11.608/2003 e Provimentos Recomendados. Suporta cálculos unificados de limites legais e simulação monetária.
            </p>
          </div>
          

        </div>
      </div>
      )}

      {/* Main Tabs (e-SAJ vs E-PROC) styled as high-end minimalist office folders */}
      <div className="bg-slate-50/50 p-2.5 border-b border-slate-200" id="subsystem-control-tab">
        <div className="flex max-w-sm mx-auto overflow-hidden rounded-lg border border-slate-300 p-0.5 bg-white shadow-3xs">
          <button
            onClick={() => setSubsystem('esaj')}
            className={`flex-1 py-1.5 text-center text-xs font-bold font-sans transition-all cursor-pointer rounded ${
              subsystem === 'esaj'
                ? `bg-[#1d2733] text-white shadow-3xs`
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            e-SAJ (19 Opções SP)
          </button>
          <button
            onClick={() => setSubsystem('eproc')}
            className={`flex-1 py-1.5 text-center text-xs font-bold font-sans transition-all cursor-pointer rounded ${
              subsystem === 'eproc'
                ? `bg-[#1d2733] text-white shadow-3xs`
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            E-PROC SP (Avançado)
          </button>
        </div>
      </div>

      {/* Grid Layout Container */}
      <div className={compact ? 'p-4' : 'grid grid-cols-1 lg:grid-cols-12 gap-6 p-6'} id="dashboard-content-layout">

        {/* LEFT COLUMN: Input Panel */}
        <div className={compact ? 'space-y-6' : 'lg:col-span-7 space-y-6'}>
          
          {/* A. e-SAJ Left Form flow */}
          {subsystem === 'esaj' ? (
            <div className="space-y-6">
              
              {/* Option Selector containing exactly 19 choices */}
              <div className="space-y-3 text-left bg-slate-50/50 p-5 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                    Guia de Recolhimento • Alíquota Aplicada
                  </label>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-600`}>
                    100% Homologado
                  </span>
                </div>
                
                <select
                  value={selectedSajId}
                  onChange={(e) => {
                    setSelectedSajId(e.target.value);
                    setTemCondenacao(false);
                    setIsExtraj(false);
                    setIsMafe(false);
                    setIsPreparoEmDobro(false);
                  }}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 cursor-pointer shadow-3xs"
                >
                  <optgroup label="Procedimento Comum e Execuções (15 Opções)">
                    {eSajOptions.filter(o => o.category === 'comum').map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Juizados Especiais Cíveis (JEC - 4 Opções)">
                    {eSajOptions.filter(o => o.category === 'jec').map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </optgroup>
                </select>
                
                {/* Visual brief description under selector */}
                <div className="py-2.5 px-3 border-l-2 border-slate-400 bg-white rounded-r flex items-start space-x-2.5 shadow-3xs">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">Regra de Cálculo Associada:</span>
                    <p className="text-xs text-slate-600 font-medium leading-normal">{selectedESajOpt.desc}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Inputs Rendering (Strategy Pattern dependent) */}
              <div className="p-6 border border-slate-200 bg-white rounded-lg space-y-5 shadow-3xs text-left">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-0.5 border-b border-slate-100 pb-2">
                  Parâmetros da Ação / Valor de Causa
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Peticionamento cutoff toggle */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2 text-left">
                    <span className="block text-xs font-bold text-slate-700">Período de Distribuição (Regulamento de Distribuição):</span>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold max-w-sm">
                      <button
                        type="button"
                        onClick={() => setPeticionamentoAno('24')}
                        className={`py-1.5 rounded text-center cursor-pointer transition-all ${
                          peticionamentoAno === '24' ? 'bg-slate-900 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Após 03/01/2024 (Lei nº 17.785/23)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeticionamentoAno('23')}
                        className={`py-1.5 rounded text-center cursor-pointer transition-all ${
                          peticionamentoAno === '23' ? 'bg-slate-900 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Antes de 03/01/2024 (Regra Anterior)
                      </button>
                    </div>
                  </div>

                  {/* Valor da Causa */}
                  {selectedESajOpt.inputs.valorCausa && (
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center gap-2 pb-0.5">
                        <label className="block text-xs font-bold text-slate-700">{valorCausaLabel}</label>
                        {isUptCause && (
                          <button
                            type="button"
                            onClick={() => handleOpenCalculatorModal('causa', vCausaStr)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 shrink-0 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-all cursor-pointer"
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span>Calculadora de Correção</span>
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          value={vCausaStr}
                          onChange={(e) => handleAmountChange(e.target.value, setVCausaStr)}
                          onBlur={(e) => handleAmountBlur(e.target.value, setVCausaStr)}
                          className={`w-full py-1.5 bg-slate-50 pl-10 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 ${col.ring}`}
                        />
                      </div>

                      {isUptCause && (
                        <div className="mt-2.5 p-3 bg-indigo-50/45 border border-indigo-100 rounded-lg space-y-2.5 text-left text-xs">
                          <div className="flex justify-between items-center text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                            <span>Indexadores de Correção Monetária</span>
                            <span className="bg-indigo-100/70 text-indigo-800 px-1.5 py-0.5 rounded leading-none animate-pulse">Automático</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Mês Inicial</span>
                              <MonthYearInput
                                value={causaDataInicial}
                                onChange={setCausaDataInicial}
                                ariaLabel="Mês inicial da correção da causa"
                                className="w-full bg-white py-1 px-2 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Mês Final</span>
                              <MonthYearInput
                                value={causaDataFinal}
                                onChange={setCausaDataFinal}
                                ariaLabel="Mês final da correção da causa"
                                className="w-full bg-white py-1 px-2 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block pb-0.5">Tabela Oficial do TJSP</span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { id: 'padrao', label: 'Opção 1 (Lei 14.905)', tooltip: 'Tabela Prática INPC/IPCA-15' },
                                { id: 'ipcae', label: 'Opção 2 (IPCA-E)', tooltip: 'Tabela IPCA-E' },
                                { id: 'antiga_inpc', label: 'Opção 3 (INPC Antigo)', tooltip: 'Antiga Tabela Prática' }
                              ].map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  title={t.tooltip}
                                  onClick={() => setCausaTabela(t.id)}
                                  className={`py-1 px-1 rounded text-[9px] font-extrabold border transition-colors cursor-pointer text-center leading-normal ${
                                    causaTabela === t.id
                                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-3xs'
                                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white border border-indigo-100 p-2 rounded flex justify-between items-center text-[10.5px]">
                            <div className="space-y-0.5">
                              <span className="block text-[9px] text-emerald-700 font-extrabold uppercase">Causa Corrigida</span>
                              <span className="text-[9px] text-slate-400 font-mono block">
                                Fator: {causaCorrResult.fatorInicial.toFixed(6)} → {causaCorrResult.fatorFinal.toFixed(6)}
                              </span>
                            </div>
                            <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-2 py-1 rounded">
                              R$ {causaCorrResult.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Execução Extrajudicial (Pós-03/01/2024) CPC Art. 827 Checkbox option */}
                      {selectedSajId === 'comum_2' && isPosCutoff && (
                        <div className="p-3 bg-indigo-50/45 border border-indigo-100 rounded flex items-start space-x-2.5 mt-2 text-left">
                          <input
                            type="checkbox"
                            checked={execIncluiEncargos}
                            onChange={(e) => setExecIncluiEncargos(e.target.checked)}
                            className="w-4 h-4 text-slate-900 accent-indigo-600 border-slate-300 rounded cursor-pointer mt-0.5 animate-fadeIn"
                            id="chk-exec-encargos-cpc-direct"
                          />
                          <label htmlFor="chk-exec-encargos-cpc-direct" className="text-[10px] font-semibold text-slate-700 leading-normal cursor-pointer select-none">
                            O valor já inclui a dívida, encargos e os 10% de honorários advocatícios (Art. 827, CPC)?
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Valor Satisfeito */}
                  {selectedESajOpt.inputs.valorSatisfacao && !isPosCutoff && (
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-700">Satisfação Efetiva (R$)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          value={vSatisfacaoStr}
                          onChange={(e) => handleAmountChange(e.target.value, setVSatisfacaoStr)}
                          onBlur={(e) => handleAmountBlur(e.target.value, setVSatisfacaoStr)}
                          className={`w-full py-1.5 bg-slate-50 pl-10 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 ${col.ring}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Valor Crédito */}
                  {selectedESajOpt.inputs.valorCredito && (
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-700">Valor do Crédito Exigido (R$)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          value={vCreditoStr}
                          onChange={(e) => handleAmountChange(e.target.value, setVCreditoStr)}
                          onBlur={(e) => handleAmountBlur(e.target.value, setVCreditoStr)}
                          className={`w-full py-1.5 bg-slate-50 pl-10 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 ${col.ring}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Valor Monte Mor */}
                  {selectedESajOpt.inputs.valorMonteMor && (
                    <div className="space-y-1.5 col-span-1 md:col-span-2 text-left">
                      <label className="block text-xs font-bold text-slate-700">Valor Total do Monte-mor (R$)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          value={vMonteMorStr}
                          onChange={(e) => handleAmountChange(e.target.value, setVMonteMorStr)}
                          onBlur={(e) => handleAmountBlur(e.target.value, setVMonteMorStr)}
                          className={`w-full py-1.5 bg-slate-50 pl-10 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 ${col.ring}`}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal italic pl-0.5">Soma transversal de todos os bens sujeitos à herança ou partilha conjugal.</p>
                    </div>
                  )}

                  {/* Valor Pago Pelo Autor */}
                  {selectedESajOpt.inputs.valorPagoAutor && (
                    <div className="space-y-1.5 col-span-1 md:col-span-2 text-left">
                      <label className="block text-xs font-bold text-slate-700">Valor Pago Originalmente pelo Autor (R$)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          value={vPagoAutorStr}
                          onChange={(e) => handleAmountChange(e.target.value, setVPagoAutorStr)}
                          onBlur={(e) => handleAmountBlur(e.target.value, setVPagoAutorStr)}
                          className={`w-full py-1.5 bg-slate-50 pl-10 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 ${col.ring}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Quantidade Litisconsortes */}
                  {selectedESajOpt.inputs.quantidadeAutores && (
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-700">Qtd de Autores Litisconsortes</label>
                      <input
                        type="number"
                        min="1"
                        value={qtdAutores}
                        onChange={(e) => setQtdAutores(Math.max(1, parseInt(e.target.value) || 1))}
                        className={`w-full py-1.5 bg-slate-50 px-3 border border-slate-300 rounded text-xs font-mono font-bold text-[#1a202c] focus:bg-white focus:outline-none focus:ring-1 ${col.ring}`}
                      />
                    </div>
                  )}

                  {/* Despesas Somadas (JEC 4) */}
                  {selectedESajOpt.inputs.despesasSoma && (
                    <div className="space-y-1.5 col-span-1 md:col-span-2 text-left">
                      <label className="block text-xs font-bold text-slate-700">Soma de Despesas Pendentes do Advogado (R$)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          value={vDespesasStr}
                          onChange={(e) => handleAmountChange(e.target.value, setVDespesasStr)}
                          onBlur={(e) => handleAmountBlur(e.target.value, setVDespesasStr)}
                          className={`w-full py-1.5 bg-slate-50 pl-10 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 ${col.ring}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Habilitacao Sub-selection (Comum 11) */}
                  {selectedSajId === 'comum_11' && (
                    <div className="space-y-1.5 col-span-1 md:col-span-2 text-left">
                      <span className="block text-xs font-bold text-slate-700">Modalidade da Habilitação de Crédito:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <label className={`flex items-center space-x-2 p-2.5 rounded border cursor-pointer ${habilitacaoModalidade === 'inicial' ? 'border-slate-400 bg-slate-50 text-slate-900 shadow-3xs' : 'border-slate-200 bg-white text-slate-500'}`}>
                          <input
                            type="radio"
                            name="hab_mod"
                            checked={habilitacaoModalidade === 'inicial'}
                            onChange={() => setHabilitacaoModalidade('inicial')}
                            className="text-slate-800 accent-slate-800 h-4 w-4"
                          />
                          <span>Distribuição Inicial (1.5%)</span>
                        </label>
                        <label className={`flex items-center space-x-2 p-2.5 rounded border cursor-pointer ${habilitacaoModalidade === 'recurso' ? 'border-slate-400 bg-slate-50 text-slate-900 shadow-3xs' : 'border-slate-200 bg-white text-slate-500'}`}>
                          <input
                            type="radio"
                            name="hab_mod"
                            checked={habilitacaoModalidade === 'recurso'}
                            onChange={() => setHabilitacaoModalidade('recurso')}
                            className="text-slate-800 accent-slate-800 h-4 w-4"
                          />
                          <span>Segundos Recursos (4% Preparo)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Valor Condenacao Incidental section with toggle */}
                  {selectedESajOpt.inputs.valorCondenacao && (
                    <div className="col-span-1 md:col-span-2 space-y-3 p-4 bg-slate-50 rounded border border-slate-200 text-left">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-slate-800 font-serif">Houve Condenação Líquida pelo Juízo?</span>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">A alíquota de 4.0% recairia sobre o montante condenado em liquidação.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={temCondenacao}
                          onChange={(e) => setTemCondenacao(e.target.checked)}
                          className={`w-4 h-4 text-slate-950 rounded bg-white hover:bg-slate-50 cursor-pointer accent-slate-800`}
                        />
                      </div>
                      
                      {temCondenacao && (
                        <div className="space-y-1 text-left">
                          <div className="flex justify-between items-center gap-2 pb-0.5">
                            <label className="text-[11px] font-bold text-slate-700">{valorCondenacaoLabel}</label>
                            {isUptCondenacao && (
                              <button
                                type="button"
                                onClick={() => handleOpenCalculatorModal('condenacao', vCondenacaoStr)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 shrink-0 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-all cursor-pointer"
                              >
                                <TrendingUp className="w-3 h-3" />
                                <span>Calculadora de Correção</span>
                              </button>
                            )}
                          </div>
                          <div className="relative max-w-sm">
                            <span className="absolute left-3 top-1.5 text-xs font-mono font-bold text-slate-300">R$</span>
                            <input
                              type="text"
                              value={vCondenacaoStr}
                              onChange={(e) => handleAmountChange(e.target.value, setVCondenacaoStr)}
                              onBlur={(e) => handleAmountBlur(e.target.value, setVCondenacaoStr)}
                              className={`w-full py-1.5 bg-white pl-10 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none`}
                            />
                          </div>

                          {isUptCondenacao && (
                            <div className="mt-2.5 p-3 bg-indigo-50/45 border border-indigo-100 rounded-lg space-y-2.5 text-left text-xs max-w-sm animate-fadeIn">
                              <div className="flex justify-between items-center text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                                <span>Indexadores da Condenação</span>
                                <span className="bg-indigo-100/70 text-indigo-800 px-1.5 py-0.5 rounded leading-none animate-pulse">Automático</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase">Mês Inicial</span>
                                  <MonthYearInput
                                    value={condenacaoDataInicial}
                                    onChange={setCondenacaoDataInicial}
                                    ariaLabel="Mês inicial da correção da condenação"
                                    className="w-full bg-white py-1 px-2 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase">Mês Final</span>
                                  <MonthYearInput
                                    value={condenacaoDataFinal}
                                    onChange={setCondenacaoDataFinal}
                                    ariaLabel="Mês final da correção da condenação"
                                    className="w-full bg-white py-1 px-2 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase block pb-0.5">Tabela Oficial do TJSP</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {[
                                    { id: 'padrao', label: 'Opção 1 (Lei 14.905)', tooltip: 'Tabela Prática INPC/IPCA-15' },
                                    { id: 'ipcae', label: 'Opção 2 (IPCA-E)', tooltip: 'Tabela IPCA-E' },
                                    { id: 'antiga_inpc', label: 'Opção 3 (INPC Antigo)', tooltip: 'Antiga Tabela Prática' }
                                  ].map((t) => (
                                    <button
                                      key={t.id}
                                      type="button"
                                      title={t.tooltip}
                                      onClick={() => setCondenacaoTabela(t.id)}
                                      className={`py-1 px-1 rounded text-[9px] font-extrabold border transition-colors cursor-pointer text-center leading-normal ${
                                        condenacaoTabela === t.id
                                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-3xs'
                                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-white border border-indigo-100 p-2 rounded flex justify-between items-center text-[10.5px]">
                                <div className="space-y-0.5">
                                  <span className="block text-[9px] text-emerald-700 font-extrabold uppercase">Condenação Atualizada</span>
                                  <span className="text-[9px] text-slate-400 font-mono block">
                                    Fator: {condenacaoCorrResult.fatorInicial.toFixed(6)} → {condenacaoCorrResult.fatorFinal.toFixed(6)}
                                  </span>
                                </div>
                                <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-2 py-1 rounded">
                                  R$ {condenacaoCorrResult.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* JEC extrajudicial checkbox option */}
                  {selectedESajOpt.inputs.extrajudicial && (
                    <div className="col-span-1 md:col-span-2 flex items-center space-x-2.5 p-3.5 bg-slate-50 rounded border border-slate-200 text-left">
                      <input
                        type="checkbox"
                        checked={isExtraj}
                        onChange={(e) => setIsExtraj(e.target.checked)}
                        className="w-4 h-4 accent-slate-800 text-slate-800 bg-white rounded cursor-pointer"
                        id="chk-extrajudicial-saj"
                      />
                      <label htmlFor="chk-extrajudicial-saj" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Ação decorre de Execução de Título Extrajudicial? (Ingresso JEC punido com 2% regimental)
                      </label>
                    </div>
                  )}

                  {/* JEC mafe check */}
                  {selectedESajOpt.inputs.mafe && (
                    <div className="col-span-1 md:col-span-2 flex items-center space-x-2.5 p-3.5 bg-slate-50 rounded border border-slate-200 text-left">
                      <input
                        type="checkbox"
                        checked={isMafe}
                        onChange={(e) => setIsMafe(e.target.checked)}
                        className="w-4 h-4 accent-slate-800 text-slate-800 bg-white rounded cursor-pointer"
                        id="chk-mafe-saj"
                      />
                      <label htmlFor="chk-mafe-saj" className="text-xs font-semibold text-slate-700 cursor-pointer text-slate-800">
                        Houve litigância de má-fé decretada judicialmente ou improvimento total do recurso interposto?
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* General inputs: Postage & Diligences */}
              <div className="p-6 border border-slate-200 bg-white rounded-lg space-y-4 shadow-3xs">
                <span className="block text-[11px] font-bold text-slate-500 tracking-widest pl-0.5 text-left uppercase border-b border-slate-100 pb-2">
                  Despesas Procedimentais Complementares (BRL)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-700">Comunicações Postais / Envelopes AR</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={postageAddresses}
                        onChange={(e) => setPostageAddresses(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 py-1.5 bg-slate-50 border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">Cartas (AR) (R$ 35,75 cada)</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-bold text-slate-700">Custas do Oficial de Justiça (GRD)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={diligDeslocamento}
                        onChange={(e) => setDiligDeslocamento(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 py-1.5 bg-slate-50 border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">Com deslocamento (3 UFESPs · R$ 115,26)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={diligRemoto}
                        onChange={(e) => setDiligRemoto(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 py-1.5 bg-slate-50 border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">Remoto / sede do Juízo (1 UFESP · R$ 38,42)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={diligConvertido}
                        onChange={(e) => setDiligConvertido(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 py-1.5 bg-slate-50 border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">Remoto convertido em deslocamento (2 UFESPs · R$ 76,84)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações Penais Privadas (Comum 13): incidências selecionáveis */}
              {selectedSajId === 'comum_13' && (
                <div className="p-6 border border-slate-200 bg-white rounded-lg space-y-3 shadow-3xs text-left">
                  <span className="block text-[11px] font-bold text-slate-500 tracking-widest pl-0.5 uppercase border-b border-slate-100 pb-2">
                    Incidências da Queixa-Crime (50 UFESPs cada)
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Assinale a(s) incidência(s) devida(s). Podem ser cobradas ambas (distribuição + recurso) ou apenas uma.
                  </p>
                  <label htmlFor="chk-queixa-dist" className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="chk-queixa-dist"
                      checked={queixaDistribuicao}
                      onChange={(e) => setQueixaDistribuicao(e.target.checked)}
                      className="h-4 w-4 border-slate-300 rounded cursor-pointer accent-slate-800"
                    />
                    <span className="text-xs text-slate-800 font-medium">Distribuição inicial / antes do despacho (50 UFESPs)</span>
                  </label>
                  <label htmlFor="chk-queixa-rec" className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="chk-queixa-rec"
                      checked={queixaRecurso}
                      onChange={(e) => setQueixaRecurso(e.target.checked)}
                      className="h-4 w-4 border-slate-300 rounded cursor-pointer accent-slate-800"
                    />
                    <span className="text-xs text-slate-800 font-medium">Interposição de recurso (50 UFESPs)</span>
                  </label>
                </div>
              )}

              {/* Recurso em Dobro Warning / Option - Slate blue tinted legal board */}
              {(selectedSajId === 'comum_3' || selectedSajId === 'comum_11' || selectedSajId === 'comum_13' || selectedSajId === 'jec_1') && (
                <div className="flex items-start space-x-3.5 bg-slate-50 border-l-3 border-slate-400 p-4 rounded-r-lg shadow-3xs text-left" id="box-preparo-dobro-art-1007">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="chk-recurso-dobro"
                      checked={isPreparoEmDobro}
                      onChange={(e) => setIsPreparoEmDobro(e.target.checked)}
                      className="h-4 w-4 text-slate-700 border-slate-300 rounded cursor-pointer accent-slate-800"
                    />
                  </div>
                  <label htmlFor="chk-recurso-dobro" className="text-xs text-slate-800 font-sans cursor-pointer flex flex-col space-y-1 select-none">
                    <span className="font-bold text-[#1f374e] text-[13px] flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-slate-600 shrink-0" />
                      Pagamento em Dobro da Taxa Recursal (Preparo em Dobro - Art. 1.007, CPC)
                    </span>
                    <span className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      Ao assinalar esta declaração de duplicidade, as custas inerentes ao ato de preparo recursal serão integralmente duplicadas (2x), em conformidade com o regramento aplicável do Código de Processo Civil.
                    </span>
                  </label>
                </div>
              )}
            </div>
          ) : (
            
            // B. E-PROC Left Assistant Form flow (Advanced Financial Mode)
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-lg bg-white p-6 space-y-4 shadow-3xs">
                
                {/* Advanced Tool Navigator bar */}
                <div className="space-y-2 text-left">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">
                    Modo de Auditoria Contábil EPROC:
                  </span>
                  <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200 text-xs font-bold max-w-md">
                    <button
                      onClick={() => setEprocTab('preparo')}
                      className={`flex-1 py-1.5 text-center rounded cursor-pointer transition-all ${
                        eprocTab === 'preparo' ? 'bg-[#1a202c] text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      A) Preparo Causa
                    </button>
                    <button
                      onClick={() => setEprocTab('complementares')}
                      className={`flex-1 py-1.5 text-center rounded cursor-pointer transition-all ${
                        eprocTab === 'complementares' ? 'bg-[#1a202c] text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      B) Complementares
                    </button>
                    <button
                      onClick={() => setEprocTab('rateio')}
                      className={`flex-1 py-1.5 text-center rounded cursor-pointer transition-all ${
                        eprocTab === 'rateio' ? 'bg-[#1a202c] text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      C) Fração Cliente
                    </button>
                  </div>
                </div>

                {/* Sub-tool A: Preparo Recursal */}
                {eprocTab === 'preparo' && (
                  <div className="space-y-4 text-left border-t border-slate-100 pt-4">
                    <div className="flex gap-2 items-center text-slate-800">
                      <Compass className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold font-serif">Simulação de Preparo Recursal com Fator Monetário</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[11.5px] font-bold text-slate-700">Mês/Ano Distribuição</label>
                        <MonthYearInput
                          value={epAOrigMonth}
                          onChange={setEpAOrigMonth}
                          ariaLabel="Mês/ano da distribuição"
                          placeholder="Ex: 01/2023"
                          className="w-full bg-slate-50 py-1.5 px-3 border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1.5 text-left">
                        <div className="flex justify-between items-center gap-2 pb-0.5">
                          <label className="text-[11.5px] font-bold text-slate-700">Valor Original da Causa (R$)</label>
                          <button
                            type="button"
                            onClick={() => handleOpenCalculatorModal('eproc_preparo', epAOrigValStr)}
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 shrink-0 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-all cursor-pointer"
                          >
                            <TrendingUp className="w-2.5 h-2.5" />
                            <span>Calculadora</span>
                          </button>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                          <input
                            type="text"
                            value={epAOrigValStr}
                            onChange={(e) => handleAmountChange(e.target.value, setEpAOrigValStr)}
                            onBlur={(e) => handleAmountBlur(e.target.value, setEpAOrigValStr)}
                            className="w-full bg-slate-50 py-1.5 pl-9 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mode selection for E-PROC updated base value */}
                    <div className="space-y-1.5 text-left border-t border-slate-100/50 pt-2.5">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Modalidade para Atualização do Valor da Causa
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10.5px] font-bold">
                        <button
                          type="button"
                          onClick={() => setEprocCorrectionMode('none')}
                          className={`py-1 rounded text-center cursor-pointer transition-all ${
                            eprocCorrectionMode === 'none' ? 'bg-[#1a202c] text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Histórico
                        </button>
                        <button
                          type="button"
                          onClick={() => setEprocCorrectionMode('estimated')}
                          className={`py-1 rounded text-center cursor-pointer transition-all ${
                            eprocCorrectionMode === 'estimated' ? 'bg-[#1a202c] text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Estimativa (1.15x)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEprocCorrectionMode('official')}
                          className={`py-1 rounded text-center cursor-pointer transition-all ${
                            eprocCorrectionMode === 'official' ? 'bg-[#1a202c] text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Tabela Oficial
                        </button>
                      </div>
                    </div>

                    {/* If Mode is estimated (x1.15) */}
                    {eprocCorrectionMode === 'estimated' && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-left animate-fadeIn">
                        <div className="flex justify-between items-center font-semibold text-slate-700">
                          <span>Montante Estimado de Reajuste:</span>
                          <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            R$ {epACorrectedVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Simulação simplificada com fator fixo de 1.15 aplicado sobre a causa histórica de R$ {epAOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                        </p>
                      </div>
                    )}

                    {/* If Mode is official (Tabela) */}
                    {eprocCorrectionMode === 'official' && (
                      <div className="p-3 bg-indigo-50/45 border border-indigo-100 rounded-lg space-y-2.5 text-left text-xs animate-fadeIn">
                        <div className="flex justify-between items-center text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                          <span>Parâmetros de Auditoria SPI/TJSP</span>
                          <span className="bg-indigo-100/70 text-indigo-800 px-1.5 py-0.5 rounded leading-none animate-pulse">Automático</span>
                        </div>

                        <div className="space-y-1 col-span-1 md:col-span-2 text-left">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block pb-0.5">Tabela Oficial do TJSP</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'padrao', label: 'Opção 1 (Lei 14.905)', tooltip: 'Tabela Prática INPC/IPCA-15' },
                              { id: 'ipcae', label: 'Opção 2 (IPCA-E)', tooltip: 'Tabela IPCA-E' },
                              { id: 'antiga_inpc', label: 'Opção 3 (INPC Antigo)', tooltip: 'Antiga Tabela Prática' }
                            ].map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                title={t.tooltip}
                                onClick={() => setEprocTabela(t.id)}
                                className={`py-1 px-1 rounded text-[9px] font-extrabold border transition-colors cursor-pointer text-center leading-normal ${
                                  eprocTabela === t.id
                                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-3xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border border-indigo-100 p-2 rounded flex justify-between items-center text-[10.5px]">
                          <div className="space-y-0.5">
                            <span className="block text-[9px] text-emerald-700 font-extrabold uppercase">Montante do Débito Atualizado</span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              Fator: {eprocCorrResult.fatorInicial.toFixed(6)} → {eprocCorrResult.fatorFinal.toFixed(6)}
                            </span>
                          </div>
                          <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-2 py-1 rounded">
                            R$ {eprocCorrResult.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tool B: Custas Complementares */}
                {eprocTab === 'complementares' && (
                  <div className="space-y-4 text-left border-t border-slate-100 pt-4">
                    <div className="flex gap-2 items-center text-slate-800 font-serif">
                      <TrendingUp className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold font-serif">Apreciação de Diferença de Custas Sucumbenciais</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[11.5px] font-bold text-slate-700">Novo Valor Avaliado (R$)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                          <input
                            type="text"
                            value={epBNewValStr}
                            onChange={(e) => handleAmountChange(e.target.value, setEpBNewValStr)}
                            onBlur={(e) => handleAmountBlur(e.target.value, setEpBNewValStr)}
                            className="w-full bg-slate-50 py-1.5 pl-9 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[11.5px] font-bold text-slate-700">Guia Anterior Recolhida (R$)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                          <input
                            type="text"
                            value={epBPrevPaidStr}
                            onChange={(e) => handleAmountChange(e.target.value, setEpBPrevPaidStr)}
                            onBlur={(e) => handleAmountBlur(e.target.value, setEpBPrevPaidStr)}
                            className="w-full bg-slate-50 py-1.5 pl-9 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tool C: Rateio Cível */}
                {eprocTab === 'rateio' && (
                  <div className="space-y-4 text-left border-t border-slate-100 pt-4">
                    <div className="flex gap-2 items-center text-slate-800">
                      <Percent className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold font-serif">Divisão Proporcional do Cliente Correspondente</span>
                    </div>

                    <div className="space-y-4 text-left">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[11.5px] font-bold text-slate-700">Valor Base da Transação (R$)</label>
                        <div className="relative max-w-sm">
                          <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">R$</span>
                          <input
                            type="text"
                            value={epCCausaStr}
                            onChange={(e) => handleAmountChange(e.target.value, setEpCCausaStr)}
                            onBlur={(e) => handleAmountBlur(e.target.value, setEpCCausaStr)}
                            className="w-full bg-slate-50 py-1.5 pl-9 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded text-left">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                          <span>Percentual devido pelo cliente assistido:</span>
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[11px] font-mono font-bold">{epCPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={epCPercent}
                          onChange={(e) => setEpCPercent(parseInt(e.target.value) || 50)}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none mt-2 accent-slate-800 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Results Display Panel (takes 5 cols) */}
        {!compact && (
        <div className="lg:col-span-5 flex flex-col space-y-6" id="wizard-right-column">
          
          {/* Main Sucumbência Sum card */}
          <div className="bg-[#12161f] text-slate-100 rounded-lg p-6 shadow-md flex flex-col justify-between border border-slate-800 relative text-left" id="wizard-totalizer-card">
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                  Auditoria de Custas Judiciais
                </span>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700`}>
                  {subsystem === 'esaj' ? 'Regime e-SAJ/TJSP' : 'Regime E-PROC'}
                </span>
              </div>

              {/* Warnings and messages */}
              {subsystem === 'esaj' && calcResults.warning && (
                <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-100 font-sans text-xs font-semibold rounded leading-normal flex items-start gap-1.5 animate-pulse">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>Atenção: {calcResults.warning}</span>
                </div>
              )}

              {/* Alerta de data inválida em uso no cálculo */}
              {datasAtivasInvalidas && (
                <div className="flex items-start gap-2 p-3 rounded bg-red-500/15 border border-red-400/40 text-left">
                  <ShieldAlert className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-100 leading-snug font-sans">
                    Há um campo de <strong className="font-bold">data inválido</strong> sendo usado na correção monetária
                    (formato MM/AAAA entre {String(PRIMEIRO_MES).padStart(2, '0')}/{PRIMEIRO_ANO} e {ULTIMO_PERIODO_LABEL}).
                    Corrija a data para que o valor abaixo seja confiável.
                  </p>
                </div>
              )}

              {/* Total money count */}
              <div className="space-y-0.5 text-left">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                  VALOR DE GUIA RECOMENDADO
                </span>
                <div className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
                  R$ {finalUnifiedSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-slate-500 font-medium pl-0.5 pr-0.5 pt-0.5">
                  Referência TJSP / UFESP 2026 (R$ 38,42)
                </p>
              </div>

              {/* Breakdown detail of items */}
              <div className="space-y-2.5 text-left">
                <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Discriminação Geral de Recolhimento
                </span>
                
                {subsystem === 'esaj' ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {eSajFinalItens.map((it, idx) => (
                      <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded text-xs flex flex-col space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-200">{it.name}</span>
                          <span className="font-mono text-white font-bold whitespace-nowrap">
                            R$ {it.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-white/5 pt-1 mt-1 leading-none">
                          <span>Guia: <strong className="font-bold text-slate-300 text-[9px]">{it.source}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Eproc manual static breakdown showing formula
                  <div className="p-3 bg-white/5 border border-white/5 rounded text-xs space-y-1 text-left">
                    <div className="flex justify-between items-center bg-white/5 p-1 rounded-sm">
                      <span className="font-bold text-slate-200">
                        {eprocTab === 'preparo' ? 'Preparo Recursal Eproc' : eprocTab === 'complementares' ? 'Complementação de Custas' : 'Rateio Fração'}
                      </span>
                      <span className="font-mono text-white font-bold">
                        R$ {finalUnifiedSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 pt-1 leading-normal font-sans">
                      {eprocTab === 'preparo' ? 'Cálculo de preparo regularizado sob o regramento aplicável do tribunal.' : eprocTab === 'complementares' ? 'Simulação de diferença residual de custas complementares devida.' : 'Apuradora de fração devida pelo cliente ou assistido sob o valor base.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction on external emitting */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-left">
              {subsystem === 'esaj' ? (
                <div className="space-y-2 text-left">
                  <span className="block text-xs font-bold text-slate-200">Emissão do Portal de Custas e-SAJ (TJSP)</span>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                    Ao clicar, o <strong className="font-semibold text-slate-200">valor exato da guia é copiado</strong> e o sistema oficial do Tribunal abre em nova aba — basta colar no campo de valor:
                  </p>

                  {/* Emissão automática (aparece quando a extensão JudsCalc é detectada) */}
                  {extPresente && (
                    <div className="mb-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-400/30 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-cyan-200 text-[11px] font-bold uppercase tracking-wide">
                        <Zap className="w-3.5 h-3.5 text-cyan-300" /> Emissão automática (extensão detectada)
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug font-sans">
                        Preencha os dados abaixo e clique — a extensão abre o portal e preenche tudo. Você só confere e clica em Emitir.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {CAMPOS_EMISSAO.map((c) => {
                          const valor = dadosEmissao[c.campo];
                          const invalido = valor.length > 0 && !c.valido(valor);
                          return (
                            <input
                              key={c.campo}
                              value={valor}
                              inputMode={c.numerico ? 'numeric' : undefined}
                              maxLength={c.maxLength}
                              aria-invalid={invalido}
                              onChange={(e) => {
                                const novo = c.mask ? c.mask(e.target.value) : e.target.value;
                                setDadosEmissao((d) => ({ ...d, [c.campo]: novo }));
                              }}
                              placeholder={c.label}
                              className={`w-full bg-white/10 border rounded px-2 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none ${
                                invalido ? 'border-red-400 focus:border-red-400' : 'border-white/10 focus:border-cyan-400/60'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={handleAutofillGuia}
                        disabled={!CAMPOS_EMISSAO.every((c) => c.valido(dadosEmissao[c.campo]))}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Chrome className="w-3.5 h-3.5" />
                        {autofillEnviado ? 'Abrindo o portal…' : 'Emitir Guia automaticamente'}
                      </button>
                      {!mapServicoPortal(selectedSajId) && (
                        <p className="text-[9px] text-amber-300/80 leading-snug font-sans">
                          Obs.: esta categoria ainda não tem o "Tipo de Serviço" mapeado no portal — selecione-o lá manualmente (o restante dos dados é preenchido).
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 pt-1 text-xs font-bold font-sans">
                    <a
                      href="https://portaldecustas.tjsp.jus.br/portaltjsp"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleEmitGuia(eSajDareSum, 'dare')}
                      className="flex items-center justify-between p-2.5 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        {copiedGuia === 'dare' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <FileText className="w-3.5 h-3.5 text-cyan-300" />}
                        {copiedGuia === 'dare'
                          ? `Valor R$ ${eSajDareSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} copiado`
                          : 'Emitir Guia DARE (Código 230-6)'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                    {postageAddresses > 0 && (
                      <a
                        href="https://www45.bb.com.br/fmc/frm/fw0707314_1.jsp"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleEmitGuia(postalSum, 'fedtj')}
                        className="flex items-center justify-between p-2.5 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors"
                       >
                        <span className="flex items-center gap-1.5">
                          {copiedGuia === 'fedtj' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <FileText className="w-3.5 h-3.5 text-slate-400" />}
                          {copiedGuia === 'fedtj'
                            ? `Valor R$ ${postalSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} copiado`
                            : 'Despesas Postais FEDTJ (Código 120-1)'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    )}
                    {totalDiligencias > 0 && (
                      <a
                        href="https://www63.bb.com.br/portalbb/boleto/boletos/oficialjustica/entrada,802,2270,3617,15,0.bbx"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleEmitGuia(grdSum, 'grd')}
                        className="flex items-center justify-between p-2.5 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          {copiedGuia === 'grd' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <FileText className="w-3.5 h-3.5 text-slate-400" />}
                          {copiedGuia === 'grd'
                            ? `Valor R$ ${grdSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} copiado`
                            : 'Oficial de Justiça (GRD)'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-white/5 border border-white/10 rounded space-y-2 text-left">
                  <span className="block text-xs font-bold text-slate-200 flex items-center">
                    <Info className="w-4 h-4 mr-1.5 text-cyan-300" />
                    Guia Unificada E-PROC (Portal TJSP)
                  </span>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                    No regime E-PROC do TJSP, as guias de recolhimento preparatório são geradas <strong className="font-semibold text-slate-200">diretamente no prontuário do processo</strong>, sem portais adicionais de preenchimento.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Editorial Memory text section for direct copy paste */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-3xs flex flex-col justify-between" id="area-editorial-memo">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-left">
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-serif">Memória de Cálculo Sucumbencial</h4>
                  <p className="text-[10px] text-slate-400 font-sans">Pronto para incorporação direta em razões recursais</p>
                </div>
                <button
                  onClick={handleCopyMemo}
                  className="flex items-center space-x-1.5 py-1 px-3 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs transition-all cursor-pointer font-bold shadow-3xs active:scale-95"
                  id="btn-copy-eproc-saj"
                >
                  {copiedMemo ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600 font-bold" />
                      <span className="text-green-600 font-bold">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={finalMemoStr}
                className="w-full h-56 p-3 bg-slate-50 border border-slate-200 rounded text-[10.5px] font-mono text-slate-600 focus:outline-none resize-none leading-relaxed shadow-3xs text-left"
                id="text-text-area-id"
              />
            </div>
          </div>

        </div>
        )}
      </div>

      {/* Compact total bar (fallback quando não há shell via onResult) */}
      {compact && !onResult && (
        <div className="sticky bottom-0 z-30 bg-[#0b2545] border-t border-white/10 px-4 py-3 rounded-b-xl shadow-[0_-10px_24px_rgba(2,12,27,0.25)]">
          {subsystem === 'esaj' && calcResults.warning && (
            <div className="mb-2 flex items-start gap-1.5 text-[11px] font-semibold text-red-200">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-300" />
              <span>{calcResults.warning}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-200/70 leading-none">
                Valor de Guia Recomendado
              </span>
              <span className="block text-[10px] text-blue-200/50 truncate mt-0.5">
                {subsystem === 'esaj' ? selectedESajOpt.name : 'E-PROC SP'}
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-white tracking-tight shrink-0 whitespace-nowrap">
              R$ {finalUnifiedSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* Calculadora de Correção Monetária - Floating Backdrop Modal */}
      {isCorrectionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all duration-300 animate-fadeIn"
          id="correction-modal"
          onClick={() => setIsCorrectionModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-left font-sans"
            role="dialog"
            aria-modal="true"
            aria-label="Calculadora de Correção Monetária do TJSP"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800 font-serif">
                  Calculadora de Correção Monetária (TJSP)
                </h3>
              </div>
              <button
                type="button"
                aria-label="Fechar calculadora de correção"
                title="Fechar"
                onClick={() => setIsCorrectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-500 leading-normal">
                Determine o valor atualizado monetariamente dividindo o valor original pelo fator do mês inicial e multiplicando pelo fator do mês de liquidação, em conformidade com o regramento do Tribunal de Justiça de São Paulo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Inicial (Mês/Ano) */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Data Inicial (Mês/Ano)
                  </label>
                  <MonthYearInput
                    value={mcDataInicial}
                    onChange={setMcDataInicial}
                    ariaLabel="Data inicial da correção"
                    placeholder="Ex: 01/2024"
                    className="w-full bg-slate-50 py-2 px-3 border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Data Final (Mês atual) */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Data Final (Mês de Referência)
                  </label>
                  <MonthYearInput
                    value={mcDataFinal}
                    onChange={setMcDataFinal}
                    ariaLabel="Data final da correção"
                    placeholder="Ex: 05/2026"
                    className="w-full bg-slate-50 py-2 px-3 border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Valor Original */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Valor Original da Causa (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">R$</span>
                    <input
                      type="text"
                      value={mcValorOriginal}
                      onChange={(e) => handleAmountChange(e.target.value, setMcValorOriginal)}
                      onBlur={(e) => handleAmountBlur(e.target.value, setMcValorOriginal)}
                      className="w-full bg-slate-50 py-2 pl-9 pr-3 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tabela do TJSP Select Selection */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Selecione a Tabela de Correção Monetária oficial do TJSP
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      {
                        id: 'padrao',
                        title: 'Opção 1 (Padrão): Lei 14.905/2024',
                        subtitle: 'Tabela Prática Oficial (INPC / IPCA-15)',
                        desc: 'Padrão legal aplicável à atualização de débitos judiciais de natureza cível e para o cálculo do preparo recursal/taxa judiciária.',
                      },
                      {
                        id: 'ipcae',
                        title: 'Opção 2: Tabela IPCA-E',
                        subtitle: 'Precatórios e Fazenda Pública',
                        desc: 'Utilizado para ações que envolvem a Fazenda Pública, normas específicas ou determinação em sentença judicial com trânsito em julgado.',
                      },
                      {
                        id: 'antiga_inpc',
                        title: 'Opção 3: Antiga Tabela Prática (INPC)',
                        subtitle: 'Tabela Prática Tradicional (Regime Anterior)',
                        desc: 'Exclusiva para o cumprimento de decisões judiciais transitadas em julgado e processos antigos onde houver essa expressa determinação.',
                      }
                    ].map((opt) => {
                      const isSelected = mcTabela === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMcTabela(opt.id)}
                          className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 text-indigo-950'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-extrabold font-sans">
                              {opt.title}
                            </span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white animate-scaleIn" />}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold mt-1 shadow-3xs ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                            {opt.subtitle}
                          </span>
                          <p className="text-[10px] text-slate-500 leading-relaxed mt-1 font-sans pl-0.5">
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className="bg-[#12161f] text-white rounded-lg p-4 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Métrica de Fatores Aplicados</span>
                  <span className="bg-emerald-950 text-emerald-400 font-bold text-[9px] px-1.5 py-0.5 rounded border border-emerald-900/60 uppercase tracking-wider">Homologado</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-white/5 pb-2.5">
                  <div>
                    <span className="block text-[10px] text-slate-400">Fator Inicial ({mcDataInicial}):</span>
                    <strong className="text-slate-200">{currentMcResult.fatorInicial.toFixed(6)}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Fator Final ({mcDataFinal}):</span>
                    <strong className="text-slate-200">{currentMcResult.fatorFinal.toFixed(6)}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-1">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] text-indigo-300 font-bold uppercase tracking-wide">Valor Corrigido TJSP</span>
                    <div className="text-[10px] text-slate-400 leading-none font-sans">
                      (Valor Original / Fator Inicial) × Fator Final
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#06b6d4] tracking-tight leading-none">
                    R$ {currentMcResult.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCorrectionModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!isValidMonthYear(mcDataInicial) || !isValidMonthYear(mcDataFinal)}
                onClick={() => applyCorrectedValue(currentMcResult.valorCorrigido)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors cursor-pointer flex items-center space-x-1 shadow-3xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar Valor no Campo</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Required Editorial Footer Copyright Trademark */}
      {!compact && (
      <div className="bg-slate-50 border-t border-slate-200 py-4 px-6 text-center rounded-b-lg text-[10.5px] text-slate-500 font-medium font-sans">
        Camelsec Workspace © 2026. Desenvolvido por Camelsec Plataform (CNPJ: 51.811.543/0001-20).
      </div>
      )}

    </div>
  );
}
