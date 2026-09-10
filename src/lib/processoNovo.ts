/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COMARCAS_TJSP } from '../data/comarcasTJSP';
import { CLASSES_TJSP } from '../data/classesTJSP';
import { FOROS_TJSP } from '../data/forosTJSP';
import { FOROS_POR_COMARCA } from '../data/forosPorComarca';
import { chaveTexto, mascaraCpfCnpj, soDigitos } from './camposEmissao';

/**
 * Ids do portal para o bloco "processo novo" (Petição Inicial, Execução de
 * Título Extrajudicial, Ação Penal Privada - Inicial — ver
 * data/servicosPortal.ts, CAMPOS_PROCESSO_NOVO). Os três serviços usam
 * exatamente os mesmos ids, então resolver aqui vale para qualquer um deles.
 *
 * As cartas de outro tribunal (comum_9) não abrem "processo novo", mas pedem
 * `comarcaOrigem` — texto livre, mesmo mecanismo de `extras`.
 */
export const IDS_PROCESSO_NOVO = {
  instancia: 'instancia',
  comarca: 'cmb_comarca1_ativa_alocacao',
  foro: 'cmb_foro1_ativo_alocacao',
  classe: 'cmb_classe',
  parteNome: 'parteNome',
  parteCpf: 'parteCpfCnpj',
  participacao: 'participacaoSelecionada',
  comarcaOrigem: 'comarcaOrigem',
} as const;

const COMARCA_POR_CHAVE = new Map(COMARCAS_TJSP.map((c) => [chaveTexto(c.rotulo), c.valor]));

// Como as petições de São Paulo costumam escrever a comarca. A lista do portal
// só tem "São Paulo"; "Capital" / "Comarca da Capital" / "Foro Central" no
// endereçamento significam a mesma comarca.
const SP_VALOR = COMARCA_POR_CHAVE.get(chaveTexto('São Paulo'));
const COMARCA_ALIAS: Record<string, string | undefined> = {
  CAPITAL: SP_VALOR,
  COMARCADACAPITAL: SP_VALOR,
  SAOPAULOCAPITAL: SP_VALOR,
};

function resolverComarca(texto: string): string | undefined {
  const chave = chaveTexto(texto);
  return COMARCA_POR_CHAVE.get(chave) ?? COMARCA_ALIAS[chave];
}

const COMARCA_ROTULO_POR_VALOR = new Map(COMARCAS_TJSP.map((c) => [c.valor, c.rotulo]));

/**
 * Nome oficial da comarca a partir do texto lido/digitado, resolvendo apelidos
 * ("Capital" → "São Paulo"). Devolve o texto original se não reconhecer — a
 * tela de revisão usa isto para mostrar o nome que o portal espera.
 */
export function canonizarComarca(texto: string): string {
  const valor = resolverComarca(texto);
  return valor ? COMARCA_ROTULO_POR_VALOR.get(valor) ?? texto : texto;
}
const CLASSE_POR_CHAVE = new Map(CLASSES_TJSP.map((c) => [chaveTexto(c.rotulo), c.valor]));
const FORO_ROTULO_POR_VALOR = new Map(FOROS_TJSP.map((f) => [f.valor, f.rotulo]));

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

// Palavras que não distinguem um foro de outro — quase todo rótulo tem uma.
const FORO_PALAVRAS_GENERICAS = new Set([
  'FORO',
  'REGIONAL',
  'CENTRAL',
  'DISTRITAL',
  'COMARCA',
  'JUDICIAL',
  'ANEXO',
  'DE',
  'DA',
  'DO',
  'DAS',
  'DOS',
  'E',
]);

function tokensDeForo(texto: string): string[] {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((t) => t.length >= 3 && !FORO_PALAVRAS_GENERICAS.has(t));
}

/**
 * Casa o foro lido do documento contra a lista do portal (`cmb_foro1_ativo_alocacao`),
 * **restrito aos foros da comarca já resolvida** — o `<select>` do portal só
 * carrega esses por AJAX, e um foro de outra comarca nunca apareceria.
 *
 * Três tentativas, da mais estrita pra menos:
 *  1. rótulo idêntico (após normalizar) — como o `opt()` do filler;
 *  2. um rótulo contém o outro — "Foro Central Cível" acha "Foro Central Cível";
 *  3. todas as palavras distintivas do texto ("santo", "amaro" — fora "foro",
 *     "regional", "de"...) aparecem em UM único rótulo — o cabeçalho escreve
 *     "Foro Regional de Santo Amaro" e o portal "Foro Regional Ii - Santo Amaro".
 *
 * Empate ou nenhuma palavra distintiva → devolve nada: o usuário escolhe o
 * foro na mão em vez de arriscar o errado.
 */
function resolverForo(texto: string, comarcaValor: string): string | undefined {
  const idsDaComarca = FOROS_POR_COMARCA[comarcaValor];
  if (!idsDaComarca || idsDaComarca.length === 0) return undefined;

  const alvo = chaveTexto(texto);
  if (alvo.length < 3) return undefined;

  const candidatos = idsDaComarca
    .map((id) => ({
      id,
      rotulo: FORO_ROTULO_POR_VALOR.get(id) ?? '',
      chave: chaveTexto(FORO_ROTULO_POR_VALOR.get(id) ?? ''),
    }))
    .filter((c) => c.chave.length > 0);

  const exato = candidatos.find((c) => c.chave === alvo);
  if (exato) return exato.id;

  const contidos = candidatos.filter((c) => c.chave.includes(alvo) || alvo.includes(c.chave));
  if (contidos.length === 1) return contidos[0].id;

  const distintivas = tokensDeForo(texto);
  if (distintivas.length === 0) return undefined;
  const porToken = candidatos.filter((c) => {
    const chaveCand = c.chave;
    return distintivas.every((t) => chaveCand.includes(t));
  });
  return porToken.length === 1 ? porToken[0].id : undefined;
}

/** 'primeira'/'segunda' → id do radio a clicar (ver CAMPOS_PROCESSO_NOVO.instancia). */
function resolverInstancia(v: string): string | undefined {
  if (v === 'primeira') return 'rd_instancia_1';
  if (v === 'segunda') return 'rd_instancia_2';
  return undefined;
}

/**
 * 'autor'/'reu' → `value` do <select> de participação do portal. A extração já
 * normaliza os sinônimos (requerente, exequente, querelante… / requerido,
 * executado…) para esses dois; Recorrente/Recorrido do portal não entram aqui
 * porque não são atos de 1º grau.
 */
function resolverParticipacao(v: string): string | undefined {
  if (v === 'autor') return 'RECLAMANTE';
  if (v === 'reu') return 'RECLAMADO';
  return undefined;
}

export interface DadosProcessoNovo {
  comarca?: string | null;
  classeProcessual?: string | null;
  foro?: string | null;
  instancia?: string | null;
  /** Nome da parte principal (normalmente = `nome` extraído). */
  parteNome?: string | null;
  /** CPF/CNPJ da parte (normalmente = `cpf` extraído). */
  parteCpf?: string | null;
  /** 'autor' | 'reu', já normalizado pela extração. */
  participacaoParte?: string | null;
  /** Comarca de origem, só para carta de outro tribunal (comum_9). */
  comarcaOrigem?: string | null;
}

/**
 * Resolve os campos do bloco "processo novo" (lidos de um documento ou
 * digitados) para o mapa `extras` que a ponte manda ao painel: chave = id do
 * campo no portal, valor = o que a extensão sabe selecionar/clicar/digitar.
 *
 * Comarca, classe, instância e participação viram `value` internos; foro é
 * casado contra a lista da comarca (com o atalho de comarca-de-foro-único como
 * fallback); nome e CPF da parte passam direto (CPF mascarado). Todo campo sem
 * match confiável simplesmente não entra no resultado — melhor em branco pro
 * usuário completar do que um valor errado no portal.
 */
export function resolverCamposProcessoNovo(dados: DadosProcessoNovo): Record<string, string> {
  const extras: Record<string, string> = {};

  const comarcaValor = dados.comarca ? resolverComarca(dados.comarca) : undefined;
  if (comarcaValor) {
    extras[IDS_PROCESSO_NOVO.comarca] = comarcaValor;

    // Foro: primeiro o que o documento diz (restrito à comarca); se não casar
    // ou o documento não trouxer, cai no atalho de sempre — comarca com um
    // único foro, o painel escolhe sozinho.
    const foros = FOROS_POR_COMARCA[comarcaValor];
    const foroDoDoc = dados.foro ? resolverForo(dados.foro, comarcaValor) : undefined;
    if (foroDoDoc) {
      extras[IDS_PROCESSO_NOVO.foro] = foroDoDoc;
    } else if (foros && foros.length === 1) {
      extras[IDS_PROCESSO_NOVO.foro] = foros[0];
    }
  }

  const classeValor = dados.classeProcessual ? resolverClasse(dados.classeProcessual) : undefined;
  if (classeValor) {
    extras[IDS_PROCESSO_NOVO.classe] = classeValor;
  }

  const instanciaValor = dados.instancia ? resolverInstancia(dados.instancia) : undefined;
  if (instanciaValor) {
    extras[IDS_PROCESSO_NOVO.instancia] = instanciaValor;
  }

  const parteNome = (dados.parteNome ?? '').trim();
  if (parteNome) {
    extras[IDS_PROCESSO_NOVO.parteNome] = parteNome;
  }

  // Mesma máscara do CPF do contribuinte — o portal casa contra o texto
  // formatado. Só entra se tiver 11 (CPF) ou 14 (CNPJ) dígitos.
  const parteCpfDigitos = soDigitos(dados.parteCpf ?? '');
  if (parteCpfDigitos.length === 11 || parteCpfDigitos.length === 14) {
    extras[IDS_PROCESSO_NOVO.parteCpf] = mascaraCpfCnpj(parteCpfDigitos);
  }

  const participacaoValor = dados.participacaoParte ? resolverParticipacao(dados.participacaoParte) : undefined;
  if (participacaoValor) {
    extras[IDS_PROCESSO_NOVO.participacao] = participacaoValor;
  }

  const comarcaOrigem = (dados.comarcaOrigem ?? '').trim();
  if (comarcaOrigem) {
    extras[IDS_PROCESSO_NOVO.comarcaOrigem] = comarcaOrigem;
  }

  return extras;
}
