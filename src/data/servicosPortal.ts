/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Serviços do Portal de Custas do TJSP e o enquadramento que leva a cada um.
 *
 * Os `valor` são os `value` reais do `<select id="tipoServicos">` em
 * https://portaldecustas.tjsp.jus.br/portaltjsp/pages/custas/new — identificadores
 * estáveis, não rótulos. O autofill seleciona por eles, e não por trecho de
 * texto: "Cartas Precatórias" casa com quatro opções diferentes, e escolher a
 * primeira que combina emitiria a guia errada.
 *
 * O código de receita muda conforme o serviço (230-6, 233-1, 234-3) e vai
 * impresso na memória de cálculo, então acompanha cada entrada.
 */

export interface ServicoPortal {
  /** `value` do <option> no portal. */
  valor: string;
  /** Rótulo exibido, na grafia do portal. */
  rotulo: string;
  /** Código de receita da guia. */
  codigo: string;
}

export const SERVICOS_PORTAL = {
  PETICAO_INICIAL: { valor: 'PETICAO_INICIAL', rotulo: 'Petição Inicial', codigo: '230-6' },
  RECONVENCAO: { valor: 'RECONVENCAO', rotulo: 'Reconvenção', codigo: '230-6' },
  ACAO_OPOSICAO_EMBARGOS: { valor: 'ACAO_OPOSICAO_EMBARGOS', rotulo: 'Oposição de Embargos', codigo: '230-6' },
  EXECUCAO_TITULO_EXTRA_JUDICIAL: { valor: 'EXECUCAO_TITULO_EXTRA_JUDICIAL', rotulo: 'Execução de Título Extrajudicial', codigo: '230-6' },
  PREPARO_APELACAO: { valor: 'PREPARO_APELACAO', rotulo: 'Preparo da Apelação', codigo: '230-6' },
  RECURSO_ADESIVO: { valor: 'RECURSO_ADESIVO', rotulo: 'Recurso Adesivo', codigo: '230-6' },
  COMPRIMENTO_SENTENCA: { valor: 'COMPRIMENTO_SENTENCA', rotulo: 'Cumprimento de Sentença', codigo: '230-6' },
  SATISFACAO_EXECUCAO: { valor: 'SATISFACAO_EXECUCAO', rotulo: 'Satisfação da Execução', codigo: '230-6' },
  TAXA_JUDICIARIA_EXECUCAO_FISCAL: { valor: 'TAXA_JUDICIARIA_EXECUCAO_FISCAL', rotulo: 'Taxa Judiciária - Execução Fiscal', codigo: '230-6' },
  AGRAVO_INSTRUMENTO: { valor: 'AGRAVO_INSTRUMENTO', rotulo: 'Agravo de Instrumento', codigo: '234-3' },
  CARTA_PRECATORIA: { valor: 'CARTA_PRECATORIA', rotulo: 'Cartas Precatórias - Processo Origem TJSP', codigo: '233-1' },
  CARTA_PRECATORIA_PROCESSO_OUTRO_TRIBUNAL: { valor: 'CARTA_PRECATORIA_PROCESSO_OUTRO_TRIBUNAL', rotulo: 'Cartas Precatórias - Processo Origem Outros Tribunais', codigo: '233-1' },
  CARTA_ORDEM: { valor: 'CARTA_ORDEM', rotulo: 'Cartas de Ordem - Processo Origem TJSP', codigo: '233-1' },
  CARTA_ORDEM_PROCESSO_OUTRO_TRIBUNAL: { valor: 'CARTA_ORDEM_PROCESSO_OUTRO_TRIBUNAL', rotulo: 'Cartas de Ordem - Processo Origem Outros Tribunais', codigo: '233-1' },
  CAUSA_EM_QUE_HAJA_PARTILHA: { valor: 'CAUSA_EM_QUE_HAJA_PARTILHA', rotulo: 'Causa em que Haja Partilha', codigo: '230-6' },
  HABILITACAO_RETARDATARIA_CREDITO_CONCORDATA: { valor: 'HABILITACAO_RETARDATARIA_CREDITO_CONCORDATA', rotulo: 'Habilitação Retardatária de Crédito em Concordata', codigo: '230-6' },
  ACAO_PENAL_GERAL: { valor: 'ACAO_PENAL_GERAL', rotulo: 'Ações Penais em Geral, Salvo Competência JECRIM', codigo: '230-6' },
  ACAO_PENAL_PRIVADA_INICIAL: { valor: 'ACAO_PENAL_PRIVADA_INICIAL', rotulo: 'Ação Penal Privada - Inicial', codigo: '230-6' },
  ACAO_PENAL_PRIVADA_INTERPOSICAO: { valor: 'ACAO_PENAL_PRIVADA_INTERPOSICAO', rotulo: 'Ação Penal Privada - Interposição Recurso', codigo: '230-6' },
  LITISCONSORCIO_ATIVO_VOLUNTARIO_ULTERIOR: { valor: 'LITISCONSORCIO_ATIVO_VOLUNTARIO_ULTERIOR', rotulo: 'Litisconsórcio Ativo Voluntário Ulterior', codigo: '230-6' },
  RECURSO_INOMINADO_JUIZADO_ESPECIAL_CIVEL: { valor: 'RECURSO_INOMINADO_JUIZADO_ESPECIAL_CIVEL', rotulo: 'Recurso Inominado em Juizado Especial Cível', codigo: '230-6' },
} as const satisfies Record<string, ServicoPortal>;

export type ChaveServico = keyof typeof SERVICOS_PORTAL;

/**
 * Serviços possíveis para cada enquadramento — o primeiro é o padrão.
 *
 * Quatro enquadramentos cobrem mais de um serviço porque o cálculo é o mesmo,
 * mas o ato praticado muda o nome da guia. Nesses casos a escolha é do usuário:
 * só ele sabe se está entrando com a inicial ou com a reconvenção.
 */
export const SERVICOS_POR_ENQUADRAMENTO: Record<string, ChaveServico[]> = {
  comum_1: ['PETICAO_INICIAL', 'RECONVENCAO', 'ACAO_OPOSICAO_EMBARGOS'],
  comum_2: ['EXECUCAO_TITULO_EXTRA_JUDICIAL'],
  comum_3: ['PREPARO_APELACAO', 'RECURSO_ADESIVO'],
  // O portal não distingue cumprimento de título próprio e de julgado externo.
  comum_4: ['COMPRIMENTO_SENTENCA'],
  comum_5: ['COMPRIMENTO_SENTENCA'],
  comum_6: ['SATISFACAO_EXECUCAO'],
  comum_7: ['TAXA_JUDICIARIA_EXECUCAO_FISCAL'],
  comum_8: ['AGRAVO_INSTRUMENTO'],
  comum_9: [
    'CARTA_PRECATORIA',
    'CARTA_PRECATORIA_PROCESSO_OUTRO_TRIBUNAL',
    'CARTA_ORDEM',
    'CARTA_ORDEM_PROCESSO_OUTRO_TRIBUNAL',
  ],
  comum_10: ['CAUSA_EM_QUE_HAJA_PARTILHA'],
  comum_11: ['HABILITACAO_RETARDATARIA_CREDITO_CONCORDATA'],
  comum_12: ['ACAO_PENAL_GERAL'],
  comum_13: ['ACAO_PENAL_PRIVADA_INICIAL', 'ACAO_PENAL_PRIVADA_INTERPOSICAO'],
  // O portal só tem a modalidade "Ulterior"; os dois enquadramentos caem nela.
  comum_14: ['LITISCONSORCIO_ATIVO_VOLUNTARIO_ULTERIOR'],
  comum_15: ['LITISCONSORCIO_ATIVO_VOLUNTARIO_ULTERIOR'],
  jec_1: ['RECURSO_INOMINADO_JUIZADO_ESPECIAL_CIVEL'],
  jec_2: ['COMPRIMENTO_SENTENCA'],
  jec_3: ['SATISFACAO_EXECUCAO'],
  jec_4: ['SATISFACAO_EXECUCAO'],
};

/**
 * Para onde vai, no portal, cada dado que o usuário informa no app.
 *
 * O mesmo dado pode ter destinos diferentes: o valor digitado em "Comum 11:
 * Habilitação Retardatária" entra em `valorAtualizadoCredito`, não em
 * `valorCausa`.
 *
 * Entrada AUSENTE = não mandamos nada e o usuário preenche no portal. É de
 * propósito: mandar um dado para o campo errado é pior que não mandar.
 */
const DESTINO_PADRAO: Record<string, string> = {
  valorCausa: 'valorCausa',
  valorCondenacao: 'valorCondenacao',
  valorMonteMor: 'valorMonteMor',
  // Ainda não observados no portal — deixados de fora até alguém conferir:
  // valorSatisfacao (comum_6), valorCredito (comum_4/5), valorPagoAutor (comum_15).
};

/** Exceções por enquadramento, quando o destino difere do padrão. */
const DESTINO_POR_ENQUADRAMENTO: Record<string, Record<string, string>> = {
  comum_11: { valorCausa: 'valorAtualizadoCredito' },
};

/**
 * Campo do portal que recebe um dado informado, ou `undefined` se ainda não
 * sabemos — nesse caso o app não preenche nada.
 */
export function destinoDoDado(enquadramento: string, dado: string): string | undefined {
  return DESTINO_POR_ENQUADRAMENTO[enquadramento]?.[dado] ?? DESTINO_PADRAO[dado];
}

/** Opções de serviço de um enquadramento (vazio se não houver mapeamento). */
export function servicosDoEnquadramento(id: string): ServicoPortal[] {
  return (SERVICOS_POR_ENQUADRAMENTO[id] || []).map((chave) => SERVICOS_PORTAL[chave]);
}

/** Serviço padrão de um enquadramento. */
export function servicoPadrao(id: string): ServicoPortal | undefined {
  return servicosDoEnquadramento(id)[0];
}

/** Busca um serviço pelo `value` do portal. */
export function servicoPorValor(valor: string): ServicoPortal | undefined {
  return (Object.values(SERVICOS_PORTAL) as ServicoPortal[]).find((s) => s.valor === valor);
}
