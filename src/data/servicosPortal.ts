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

import { FOROS_TJSP } from './forosTJSP';

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

/**
 * Campo que o portal pede e que o app não sabe calcular.
 *
 * `id` é o id do input na página do portal — o mesmo que a extensão usa para
 * preencher. Errar o id não quebra nada: a extensão preenche o que existir e
 * ignora o resto, então um id errado simplesmente não preenche.
 */
export interface CampoGuia {
  id: string;
  label: string;
  tipo?: 'dinheiro' | 'numero' | 'texto';
  /** Trava o botão de emitir enquanto estiver vazio. */
  obrigatorio?: boolean;
  /**
   * Preenche sozinho, a partir de um dado que o painel já pergunta
   * (`cpf`, `nome`, `telefone`, `endereco`, `municipio`, `processo`).
   *
   * Serve para o mesmo dado que o portal pede com outro id conforme o serviço.
   * O campo não aparece no formulário: pedir duas vezes o que já foi digitado
   * é pior que não pedir.
   */
  preencherCom?: 'cpf' | 'nome' | 'telefone' | 'endereco' | 'municipio' | 'processo';
  /**
   * O campo é um `<select>` controlado pelo Chosen.
   *
   * Muda o caminho na extensão: `txt()` só dispara os eventos de input, e o
   * widget do Chosen continuaria mostrando o valor antigo. Estes vão num mapa
   * separado, preenchidos pelo `opt()`, que dispara `chosen:updated`.
   */
  select?: boolean;
  /**
   * Opções deste dropdown quando elas dependem do serviço.
   *
   * Sem isto, vale a lista global de `OPCOES_SELECT` para o id. Existe porque
   * `tribunalOrigem` muda: a carta precatória oferece cinco ramos da Justiça, a
   * carta de ordem acrescenta STF e STJ — que são justamente quem expede carta
   * de ordem. Chavear só pelo id ofereceria tribunal indevido em metade dos
   * casos.
   */
  opcoes?: OpcaoSelect[];
}

export interface OpcaoSelect {
  /** `value` do <option> — identificador estável, é o que vai para o portal. */
  valor: string;
  /** Texto exibido, na grafia do portal. */
  rotulo: string;
}

/**
 * Campos extras por SERVIÇO do portal, não por enquadramento.
 *
 * A distinção importa: quatro enquadramentos cobrem mais de um serviço, e é o
 * serviço que determina o que a página renderiza. `comum_1` sozinho vira
 * Petição Inicial, Reconvenção ou Oposição de Embargos — e a Reconvenção tem
 * `valorLitisconsorcio` e nem exibe `valorCondenacao`.
 *
 * O inverso também acontece: `comum_14` e `comum_15` caem no MESMO serviço,
 * mas só o 15 precisa que o usuário digite `valorPagoAutor`. Por isso a lista
 * aqui é só "o que a página pede" — quem preenche cada um é decidido na tela,
 * escondendo o que o cálculo já cobre (ver `camposParaDigitar` no
 * WizardCalculator). Ensinar o app a calcular um destes faz o campo sumir do
 * formulário sozinho, sem mexer nesta lista.
 *
 * Só entra aqui o que foi observado no portal de verdade. Ver
 * store/MAPEAMENTO-PORTAL.md para o que já foi conferido e o que é suposição.
 */
/** Ramos da Justiça oferecidos na carta precatória. Conferido em 13/08/2026. */
const TRIBUNAIS_PRECATORIA: OpcaoSelect[] = [
  { valor: 'JUSTICA_ESTADUAL', rotulo: 'Justiça Estadual' },
  { valor: 'REGIONAL_FEDERAL', rotulo: 'Regional Federal' },
  { valor: 'REGIONAL_ELEITORAL', rotulo: 'Regional Eleitoral' },
  { valor: 'REGIONAL_TRABALHO', rotulo: 'Regional do Trabalho' },
  { valor: 'JUSTICA_MILITAR', rotulo: 'Justiça Militar' },
];

/**
 * A carta de ordem acrescenta STF e STJ — são eles que a expedem. A precatória
 * corre entre juízos de mesma hierarquia, então não os oferece.
 * Conferido em 13/08/2026.
 */
const TRIBUNAIS_CARTA_ORDEM: OpcaoSelect[] = [
  { valor: 'SUPREMO_TRIBUNAL_FEDERAL', rotulo: 'Supremo Tribunal Federal' },
  { valor: 'SUPERIOR_TRIBUNAL_JUSTICA', rotulo: 'Superior Tribunal de Justiça' },
  ...TRIBUNAIS_PRECATORIA,
];

/**
 * Cartas expedidas pelo próprio TJSP — precatória e de ordem, sem diferença.
 *
 * Ao contrário das que vêm de fora, seguem o fluxo padrão do portal: número do
 * processo validado no modal, e nada de origem para informar. O único campo
 * além do valor é para onde a carta vai.
 */
const CAMPOS_CARTA_DO_TJSP: CampoGuia[] = [
  { id: 'forosDeprecado', label: 'Foro deprecado', select: true },
];

/**
 * Cartas vindas de outro tribunal. Precatória e de ordem pedem os mesmos
 * campos; só a lista de tribunais de origem difere.
 *
 * Este formato não usa `txt_numeroProcesso` nem `bt_validar_processo`, e não
 * tem `valorCausa`, `novoProcesso` nem `instancia`. Em vez do processo de
 * destino, pede a origem da carta.
 */
function camposCartaDeOutroTribunal(tribunais: OpcaoSelect[]): CampoGuia[] {
  return [
    { id: 'numeroProcessoOrigem', label: 'Nº do processo de origem', preencherCom: 'processo' },
    { id: 'comarcaOrigem', label: 'Comarca/Seção Judiciária de origem', tipo: 'texto' },
    { id: 'tribunalOrigem', label: 'Tribunal de origem', select: true, opcoes: tribunais },
    { id: 'estadoServico', label: 'Estado', select: true },
    { id: 'forosDeprecado', label: 'Foro deprecado', select: true },
  ];
}

export const CAMPOS_POR_SERVICO: Partial<Record<ChaveServico, CampoGuia[]>> = {
  // Conferido no portal em 13/08/2026: `valorCausa*`, `valorCondenacao` e
  // `valorReceita*`. Não existe `valorSatisfacao` na página — é entrada de
  // cálculo do comum_6, como o `valorPagoAutor` do comum_15.
  //
  // Três enquadramentos usam este serviço e se comportam diferente: `jec_3`
  // declara `valorCausa` em `inputs` e o app manda; `comum_6` e `jec_4` não.
  // O filtro da tela resolve — o campo só aparece para quem precisa digitar.
  SATISFACAO_EXECUCAO: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
    // Sem `*` no portal, ao contrário dos outros dois.
    { id: 'valorCondenacao', label: 'Valor da condenação', tipo: 'dinheiro' },
  ],
  // Conferido no portal em 13/08/2026: `valorCondenacao*` e `valorReceita*`.
  // Não há `valorCausa` aqui — este serviço quebra o padrão dos outros dois.
  // E não existe `valorCredito` na página: é entrada de cálculo do comum_4.
  //
  // Os três enquadramentos que usam este serviço (comum_4, comum_5, jec_2)
  // deixavam `valorCondenacao` em branco, porque nenhum o declara em `inputs`.
  //
  // Detalhe inofensivo: o comum_5 declara `valorCausa`, então o app manda esse
  // campo — que não existe nesta página. O `txt()` não acha o elemento e ignora,
  // que é o comportamento desenhado para id desconhecido.
  // Conferido no portal em 13/08/2026. Este serviço não segue o formato dos
  // outros: em vez de `txt_numeroProcesso` + `bt_validar_processo`, pede a
  // origem da carta. Some também `valorCausa`, `novoProcesso` e `instancia`.
  //
  // Campos da página: tribunalOrigem (Chosen), estadoServico (Chosen),
  // comarcaOrigem, numeroProcessoOrigem, forosDeprecado (Chosen), valorReceita.
  //
  // Só os dois de texto entram aqui. Os três Chosen ficam manuais: o `txt()` da
  // extensão não atualiza widget Chosen, e resolvê-los exigiria um mapa de
  // selects no filler mais as listas de tribunais e foros no painel -- o mesmo
  // problema de lista enorme que deixou comarca e foro manuais.
  //
  // O número do processo é o mesmo que o painel já pergunta, então
  // `numeroProcessoOrigem` se preenche sozinho. Sem isso ele ficava em branco:
  // o filler manda o processo para `txt_numeroProcesso`, que não existe aqui.
  //
  // Faltam conferir os outros três serviços de carta -- podem ter conjunto
  // diferente, principalmente os de origem TJSP, que talvez não peçam tribunal.
  CARTA_PRECATORIA_PROCESSO_OUTRO_TRIBUNAL: camposCartaDeOutroTribunal(TRIBUNAIS_PRECATORIA),
  // Mesmos campos da precatória; muda só a lista de tribunais de origem.
  CARTA_ORDEM_PROCESSO_OUTRO_TRIBUNAL: camposCartaDeOutroTribunal(TRIBUNAIS_CARTA_ORDEM),

  // Conferido em 13/08/2026: as duas de origem TJSP são idênticas entre si e
  // voltam ao fluxo padrão -- têm `txt_numeroProcesso`, `bt_validar_processo`,
  // `novoProcesso` e `instancia`, que o filler já preenche sem mudança.
  //
  // Nada de tribunal, estado, comarca ou processo de origem: a carta sai do
  // próprio TJSP, então não há origem a informar. Sobra só o foro de destino.
  // Também não tem `valorCausa` -- só `valorReceita`, que o app já calcula.
  CARTA_PRECATORIA: CAMPOS_CARTA_DO_TJSP,
  CARTA_ORDEM: CAMPOS_CARTA_DO_TJSP,

  // Conferido em 13/08/2026: `valorMonteMor*` e `valorReceita*`. Já coberto --
  // o comum_10 declara `valorMonteMor` em `inputs` e o DESTINO_PADRAO o mapeia,
  // então o app preenche e `camposParaDigitar` esconde o campo.
  //
  // Declarado ainda assim como rede: se um dia o enquadramento parar de
  // declarar esse dado, o campo reaparece para digitar em vez de sair em
  // branco numa guia -- que foi exatamente o que aconteceu com o `valorCausa`
  // no Litisconsórcio e na Satisfação.
  CAUSA_EM_QUE_HAJA_PARTILHA: [
    { id: 'valorMonteMor', label: 'Valor do monte-mor', tipo: 'dinheiro' },
  ],

  // Conferido em 13/08/2026: `valorCausa` (sem asterisco, ao contrário dos
  // outros serviços), `valorReceita*` rotulado "Preparo Recursal" e
  // `valorReceitaCustasIniciais*` rotulado "Custas Iniciais".
  //
  // Já coberto, e é o serviço que prova o mecanismo de `campoPortal`: o cálculo
  // do jec_1 declara `campoPortal: 'valorReceitaCustasIniciais'` na parcela de
  // ingresso e `'valorReceita'` no preparo, e a página separa os dois campos.
  //
  // O jec_1 declara `valorCondenacao` em `inputs`, mas esta página NÃO tem esse
  // campo -- o app manda e o filler ignora, como desenhado para id
  // desconhecido. A tabela "Campos de valor" deste doc diz que serviços
  // recursais têm `valorCondenacao`; para o Recurso Inominado, não têm.
  RECURSO_INOMINADO_JUIZADO_ESPECIAL_CIVEL: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
    { id: 'valorReceitaCustasIniciais', label: 'Custas iniciais', tipo: 'dinheiro' },
  ],

  // Conferido em 13/08/2026: `valorCausa*`, `valorLitisconsorcio` (sem
  // asterisco) e `valorReceita*`. Confirma o comentário antigo do código: a
  // Reconvenção tem litisconsórcio e NÃO exibe `valorCondenacao`.
  //
  // `valorLitisconsorcio` nunca era preenchido -- nenhum item de cálculo
  // declara `campoPortal` para ele, o nome só aparecia em comentários. Passa a
  // ser digitado no painel.
  RECONVENCAO: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
    { id: 'valorLitisconsorcio', label: 'Receita do litisconsórcio', tipo: 'dinheiro' },
  ],

  // Conferido em 13/08/2026: `valorAtualizadoCredito*` e `valorReceita*`. Já
  // coberto pela exceção de destino do comum_11, que manda o valor informado
  // para `valorAtualizadoCredito` em vez de `valorCausa`.
  HABILITACAO_RETARDATARIA_CREDITO_CONCORDATA: [
    { id: 'valorAtualizadoCredito', label: 'Valor atualizado do crédito', tipo: 'dinheiro' },
  ],

  // Conferido em 13/08/2026: só `valorReceita*`, que o app sempre calcula.
  // Nada a declarar -- a entrada vazia registra que foi inspecionado, para não
  // ser confundido com serviço ainda não conferido.
  AGRAVO_INSTRUMENTO: [],

  // Conferido em 13/08/2026: `valorCausa*`, `valorCondenacao` (sem asterisco) e
  // `valorReceita*`. Já coberto -- o comum_3 declara os dois em `inputs`, e a
  // condenação só é enviada quando existe.
  //
  // Aqui a nota da tabela "Campos de valor" se confirma: serviço recursal COM
  // `valorCondenacao`. O Recurso Inominado, também recursal, não tem. Ou seja,
  // a regra é por serviço, não por natureza do ato.
  PREPARO_APELACAO: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
    { id: 'valorCondenacao', label: 'Valor da condenação', tipo: 'dinheiro' },
  ],

  // --- Conferidos em 13/08/2026, todos já cobertos pelo cálculo. ---

  // `valorCausa*` e `valorReceita*`. Igual à Petição Inicial nos valores, mas
  // sem o bloco de processo novo — embargos correm em processo existente.
  ACAO_OPOSICAO_EMBARGOS: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
  ],

  // `valorCausa*` e `valorReceita*`.
  TAXA_JUDICIARIA_EXECUCAO_FISCAL: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
  ],

  // Idêntico ao Preparo da Apelação, como esperado: os dois são o comum_3.
  RECURSO_ADESIVO: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
    { id: 'valorCondenacao', label: 'Valor da condenação', tipo: 'dinheiro' },
  ],

  // Só `valorReceita*` — sem valor da causa, coerente com ação penal.
  ACAO_PENAL_GERAL: [],
  ACAO_PENAL_PRIVADA_INTERPOSICAO: [],

  // --- Serviços que abrem o bloco de PROCESSO NOVO ---
  //
  // São três, e não só a Petição Inicial como este projeto assumia: também a
  // Execução de Título Extrajudicial e a Ação Penal Privada - Inicial. São
  // justamente os atos que iniciam processo, onde não há número a validar.
  //
  // Nesses, `txt_numeroProcesso` e `bt_validar_processo` NÃO existem — o passo
  // de validação do filler vira no-op, como nas cartas de outro tribunal.
  //
  // O bloco de processo novo (instância, comarca, foro, ofício, serventia,
  // classe e partes) ainda não é preenchido. Ver a seção do
  // MAPEAMENTO-PORTAL.md sobre o que falta.

  // `valorCausa*`, `valorReceita*` e `valorLitisconsorcio`.
  PETICAO_INICIAL: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
    { id: 'valorLitisconsorcio', label: 'Receita do litisconsórcio', tipo: 'dinheiro' },
  ],

  // `valorCausa*` e `valorReceita*`.
  EXECUCAO_TITULO_EXTRA_JUDICIAL: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
  ],

  // `valorReceita*` e `valorLitisconsorcio`, sem valor da causa. O
  // `valorLitisconsorcio` não era preenchido — mesma lacuna da Reconvenção.
  ACAO_PENAL_PRIVADA_INICIAL: [
    { id: 'valorLitisconsorcio', label: 'Receita do litisconsórcio', tipo: 'dinheiro' },
  ],
  COMPRIMENTO_SENTENCA: [
    { id: 'valorCondenacao', label: 'Valor da condenação', tipo: 'dinheiro' },
  ],
  // Conferido no portal em 13/08/2026: a página pede só `valorCausa` e
  // `valorReceita`. O app manda o `valorReceita` (total calculado) mas nunca o
  // `valorCausa`, porque nem comum_14 nem comum_15 declaram esse dado em
  // `inputs` -- o 14 pergunta a quantidade de autores, o 15 o valor pago pelo
  // autor original. Então `valorCausa` ficava em branco numa guia oficial.
  //
  // Não existe `valorPagoAutor` no portal. Ele é entrada de CÁLCULO do
  // comum_15, e o destino sempre foi o `valorReceita` pelo total. O
  // MAPEAMENTO-PORTAL.md o listava como "destino desconhecido", o que dava a
  // entender que faltava mapear um campo que nunca existiu.
  LITISCONSORCIO_ATIVO_VOLUNTARIO_ULTERIOR: [
    { id: 'valorCausa', label: 'Valor da causa', tipo: 'dinheiro' },
  ],
};

/**
 * Opções dos dropdowns do portal, por id do campo.
 *
 * Colhidas do `<select>` da própria página — ver `scripts/dump-campos-portal.js`.
 * Guardamos o `valor` (o `value` do `<option>`) porque é identificador estável;
 * o `rotulo` existe para exibir no painel.
 *
 * Um campo `select: true` sem entrada aqui continua manual: o painel avisa que
 * falta preencher no portal, em vez de fingir que resolve.
 */
export const OPCOES_SELECT: Record<string, OpcaoSelect[]> = {
  // Unidades do TJSP que recebem a carta deprecada. 524 entradas, geradas por
  // `scripts/gen-foros.mjs` a partir do <select> do portal — nunca transcritas.
  //
  // `tribunalOrigem` NÃO fica aqui: a lista depende do serviço, e por isso vive
  // no próprio campo, via `opcoes`.
  forosDeprecado: FOROS_TJSP as OpcaoSelect[],

  // UF do tribunal de ORIGEM da carta -- não confundir com `cmb_estados`, que
  // é o estado do endereço do contribuinte e fica fixo em SP.
  //
  // Os `valor` são ids internos do portal, sem relação com a sigla nem com o
  // código do IBGE (PR=1, MA=2, SP=26). Não dá para deduzir: transcrever exato.
  // Colhido em 13/08/2026.
  estadoServico: [
    { valor: '27', rotulo: 'AC' },
    { valor: '20', rotulo: 'AL' },
    { valor: '6', rotulo: 'AM' },
    { valor: '5', rotulo: 'AP' },
    { valor: '24', rotulo: 'BA' },
    { valor: '3', rotulo: 'CE' },
    { valor: '7', rotulo: 'DF' },
    { valor: '21', rotulo: 'ES' },
    { valor: '16', rotulo: 'GO' },
    { valor: '2', rotulo: 'MA' },
    { valor: '14', rotulo: 'MG' },
    { valor: '15', rotulo: 'MS' },
    { valor: '18', rotulo: 'MT' },
    { valor: '4', rotulo: 'PA' },
    { valor: '10', rotulo: 'PB' },
    { valor: '17', rotulo: 'PE' },
    { valor: '19', rotulo: 'PI' },
    { valor: '1', rotulo: 'PR' },
    { valor: '12', rotulo: 'RJ' },
    { valor: '8', rotulo: 'RN' },
    { valor: '22', rotulo: 'RO' },
    { valor: '23', rotulo: 'RR' },
    { valor: '25', rotulo: 'RS' },
    { valor: '13', rotulo: 'SC' },
    { valor: '9', rotulo: 'SE' },
    { valor: '26', rotulo: 'SP' },
    { valor: '11', rotulo: 'TO' },
  ],
};

/**
 * Opções de um dropdown, ou vazio se ainda não colhemos.
 *
 * A lista do próprio campo tem precedência sobre a global: o mesmo id pode
 * oferecer conjuntos diferentes conforme o serviço (`tribunalOrigem`).
 */
export function opcoesDoCampo(campo: CampoGuia): OpcaoSelect[] {
  return campo.opcoes ?? OPCOES_SELECT[campo.id] ?? [];
}

/** Campos extras de um serviço, pelo `value` do portal. */
export function camposDoServico(valorServico: string | undefined): CampoGuia[] {
  if (!valorServico) return [];
  const chave = (Object.keys(SERVICOS_PORTAL) as ChaveServico[]).find(
    (k) => SERVICOS_PORTAL[k].valor === valorServico,
  );
  return (chave && CAMPOS_POR_SERVICO[chave]) || [];
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
