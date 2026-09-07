/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MUNICIPIOS_SP } from '../data/municipiosSP';

// ---- Máscaras e validação dos campos de emissão automática ----
//
// Compartilhado entre o formulário de emissão do painel da extensão
// (WizardCalculator.tsx, dentro de noPainelDaExtensao()) e o formulário de
// revisão do upload de documento no site (UploadProcessoTab.tsx) — os dois
// precisam validar/mascarar exatamente igual, sem duplicar regra.

export function soDigitos(s: string): string {
  return (s || '').replace(/\D/g, '');
}

// CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00), conforme a quantidade de dígitos.
export function mascaraCpfCnpj(v: string): string {
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
export function mascaraTelefone(v: string): string {
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
export function mascaraProcesso(v: string): string {
  const d = soDigitos(v).slice(0, 20);
  let out = d.slice(0, 7);
  if (d.length > 7) out += '-' + d.slice(7, 9);
  if (d.length > 9) out += '.' + d.slice(9, 13);
  if (d.length > 13) out += '.' + d.slice(13, 14);
  if (d.length > 14) out += '.' + d.slice(14, 16);
  if (d.length > 16) out += '.' + d.slice(16, 20);
  return out;
}

// Chave de comparação de município: reduz o nome a letras e números, para que
// "sao jose do rio preto" ache "São José do Rio Preto".
//
// Descarta espaço e pontuação por completo, e não só os normaliza, porque oito
// municípios têm apóstrofo no nome e ninguém digita "santa barbara d'oeste" —
// digita "santa barbara doeste". Sem separador as duas formas viram a mesma
// chave. Conferido: os 645 nomes continuam gerando 645 chaves distintas, então
// nada é engolido pelo Map.
export function chaveMunicipio(v: string): string {
  return v
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase();
}

export const MUNICIPIO_POR_CHAVE = new Map(MUNICIPIOS_SP.map((m) => [chaveMunicipio(m), m]));

export type CampoEmissaoKey = 'cpf' | 'nome' | 'telefone' | 'endereco' | 'municipio' | 'processo';

export interface CampoEmissaoDef {
  campo: CampoEmissaoKey;
  label: string;
  mask?: (v: string) => string;
  valido: (v: string) => boolean;
  numerico?: boolean;
  maxLength?: number;
  // Quando presente, o campo vira lista suspensa em vez de digitação. Só o
  // município usa hoje, e é o que garante que o nome chegue à extensão exatamente
  // como o portal escreve — ver o cabeçalho de data/municipiosSP.ts.
  opcoes?: readonly string[];
}

export const CAMPOS_EMISSAO: CampoEmissaoDef[] = [
  { campo: 'cpf', label: 'CPF/CNPJ', mask: mascaraCpfCnpj, numerico: true, maxLength: 18,
    valido: (v) => { const n = soDigitos(v).length; return n === 11 || n === 14; } },
  { campo: 'nome', label: 'Nome', valido: (v) => v.trim().length >= 2 },
  { campo: 'telefone', label: 'Telefone', mask: mascaraTelefone, numerico: true, maxLength: 16,
    valido: (v) => { const n = soDigitos(v).length; return n === 10 || n === 11; } },
  { campo: 'endereco', label: 'Endereço', valido: (v) => v.trim().length >= 3 },
  // Aceita só nome que existe na lista: campo vazio ou meio preenchido trava o
  // botão de emitir, em vez de mandar para o portal um município que não casa.
  //
  // Compara pela chave, não pelo texto: "leme" e "sao carlos" já valem, sem
  // depender de o usuário ter clicado na sugestão. O nome oficial é resolvido
  // na hora de montar os dados da guia.
  { campo: 'municipio', label: 'Município', opcoes: MUNICIPIOS_SP,
    valido: (v) => MUNICIPIO_POR_CHAVE.has(chaveMunicipio(v)) },
  { campo: 'processo', label: 'Nº do Processo', mask: mascaraProcesso, numerico: true, maxLength: 25,
    valido: (v) => soDigitos(v).length === 20 },
];

export type DadosEmissao = Record<CampoEmissaoKey, string>;

export const DADOS_EMISSAO_VAZIOS: DadosEmissao = {
  cpf: '', nome: '', telefone: '', endereco: '', municipio: '', processo: '',
};
