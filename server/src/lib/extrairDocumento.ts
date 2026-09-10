import Anthropic from '@anthropic-ai/sdk';

/**
 * Extração de dados de identificação de documentos de processo (PDF ou
 * imagem) via Claude Vision, para pré-preencher o formulário de emissão da
 * extensão (ver server/src/routes/documentos.ts).
 *
 * Nada aqui é persistido: o buffer do arquivo e a resposta do modelo saem de
 * escopo assim que a função retorna. Sigilo profissional — dado de processo
 * de escritório de advocacia não pode ficar gravado em lugar nenhum.
 */

function cliente(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada.');
  return new Anthropic({ apiKey });
}

export interface DadosProcessoExtraidos {
  /**
   * Porteiro: `false` quando o arquivo não é um documento de processo judicial
   * (anotação, rascunho, contrato, e-mail, print). Nesse caso todos os demais
   * campos saem `null` — ver o zeramento no fim de `extrairDadosProcesso`.
   */
  pareceProcessoJudicial: boolean;
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  endereco: string | null;
  municipio: string | null;
  processo: string | null;
  comarca: string | null;
  classeProcessual: string | null;
  /** Foro/vara do TJSP no cabeçalho ("Foro Central Cível", "Foro de Adamantina"). */
  foro: string | null;
  /** 'primeira' | 'segunda' — instância do ato. */
  instancia: 'primeira' | 'segunda' | null;
  /** Polo da parte principal: 'autor' | 'reu' (com sinônimos resolvidos pelo modelo). */
  participacaoParte: 'autor' | 'reu' | null;
  /** Só para carta precatória/de ordem vinda de outro tribunal. */
  comarcaOrigem: string | null;
  /** Valor da causa como escrito no documento (ex.: "150.000,00"). Só conferência — não vai para a guia. */
  valorCausa: string | null;
}

const CAMPOS_VAZIOS: Omit<DadosProcessoExtraidos, 'pareceProcessoJudicial'> = {
  nome: null,
  cpf: null,
  telefone: null,
  endereco: null,
  municipio: null,
  processo: null,
  comarca: null,
  classeProcessual: null,
  foro: null,
  instancia: null,
  participacaoParte: null,
  comarcaOrigem: null,
  valorCausa: null,
};

const NOME_FERRAMENTA = 'registrar_dados_processo';

const FERRAMENTA_EXTRACAO: Anthropic.Tool = {
  name: NOME_FERRAMENTA,
  description:
    'Registra os dados de identificação encontrados no documento. Use null em qualquer campo que não apareça claramente no texto — nunca invente, deduza, complete nem transcreva valores de exemplo/placeholder.',
  input_schema: {
    type: 'object',
    properties: {
      pareceProcessoJudicial: {
        type: 'boolean',
        description:
          'true SOMENTE se o documento for uma peça, decisão, certidão, guia ou outro documento de um processo judicial brasileiro. false para qualquer outra coisa (anotações, rascunhos, listas de tarefas, contratos, e-mails, imagens sem conteúdo jurídico). Quando false, todos os demais campos devem ser null.',
      },
      nome: {
        type: ['string', 'null'],
        description: 'Nome completo da parte principal (autor/requerente/exequente) do processo.',
      },
      cpf: {
        type: ['string', 'null'],
        description: 'CPF ou CNPJ da parte, com os dígitos exatamente como aparecem no documento.',
      },
      telefone: {
        type: ['string', 'null'],
        description: 'Telefone de contato da parte.',
      },
      endereco: {
        type: ['string', 'null'],
        description: 'Endereço completo da parte (logradouro, número, bairro, CEP), como texto único.',
      },
      municipio: {
        type: ['string', 'null'],
        description: 'Município paulista de domicílio da parte ou da comarca do processo, se identificável.',
      },
      processo: {
        type: ['string', 'null'],
        description: 'Número do processo no formato CNJ (0000000-00.0000.0.00.0000).',
      },
      comarca: {
        type: ['string', 'null'],
        description:
          'Comarca paulista onde o processo tramita ou será distribuído (ex.: "Campinas"). Geralmente aparece no cabeçalho da petição, endereçada ao juízo daquela comarca.',
      },
      classeProcessual: {
        type: ['string', 'null'],
        description:
          'Classe processual como escrita no documento (ex.: "Procedimento Comum Cível"). Só preencha se estiver explícita — não deduza a partir do tipo de ação.',
      },
      foro: {
        type: ['string', 'null'],
        description:
          'O FORO do TJSP onde o processo tramita ou será distribuído, como no cabeçalho (ex.: "Foro Central Cível", "Foro Regional de Santo Amaro", "Foro de Adamantina"). NÃO é a vara/ofício ("3ª Vara Cível", "2º Ofício") — se só a vara aparecer e o foro não, deixe null.',
      },
      instancia: {
        type: ['string', 'null'],
        enum: ['primeira', 'segunda', null],
        description:
          'Instância do ato: "primeira" para petição inicial, execução de título extrajudicial e ação penal privada; "segunda" para recursos e preparos julgados em 2º grau. Só preencha se o documento deixar claro.',
      },
      participacaoParte: {
        type: ['string', 'null'],
        enum: ['autor', 'reu', null],
        description:
          'Polo da parte principal (a de `nome`) no processo. "autor" cobre autor, requerente, exequente, reclamante, querelante, recorrente, agravante, apelante, impetrante, embargante. "reu" cobre réu, requerido, executado, reclamado, querelado, recorrido, agravado, apelado. Só preencha se estiver claro no documento.',
      },
      comarcaOrigem: {
        type: ['string', 'null'],
        description:
          'Somente quando o documento for uma carta precatória ou carta de ordem vinda de OUTRO tribunal: a comarca/seção judiciária de origem da carta. Caso contrário, null.',
      },
      valorCausa: {
        type: ['string', 'null'],
        description:
          'Valor da causa como escrito no documento, só os números com separadores (ex.: "150.000,00"). Aparece em "dá-se à causa o valor de R$...". Só o que estiver explícito.',
      },
    },
    required: [
      'pareceProcessoJudicial',
      'nome',
      'cpf',
      'telefone',
      'endereco',
      'municipio',
      'processo',
      'comarca',
      'classeProcessual',
      'foro',
      'instancia',
      'participacaoParte',
      'comarcaOrigem',
      'valorCausa',
    ],
  },
};

type MimeSuportado = 'application/pdf' | 'image/jpeg' | 'image/png';

export async function extrairDadosProcesso(
  buffer: Buffer,
  mimetype: MimeSuportado,
): Promise<DadosProcessoExtraidos> {
  const anthropic = cliente();
  const modelo = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
  const base64 = buffer.toString('base64');

  const blocoArquivo: Anthropic.Messages.ContentBlockParam =
    mimetype === 'application/pdf'
      ? {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        }
      : {
          type: 'image',
          source: { type: 'base64', media_type: mimetype, data: base64 },
        };

  const resposta = await anthropic.messages.create({
    model: modelo,
    max_tokens: 1024,
    system:
      'Você extrai dados de identificação de documentos jurídicos brasileiros (petições, procurações, guias de custas) para preencher um formulário. Regras absolutas: ' +
      '(1) registre APENAS o que está explicitamente escrito no documento — nunca invente, deduza, complete a partir do contexto nem transcreva valores de exemplo; ' +
      '(2) na menor dúvida sobre um campo, use null — um formulário em branco é melhor que um dado errado; ' +
      '(3) CPF/CNPJ, número de processo ou valor da causa com dígitos repetidos ou sequenciais (111.111.111-11, 444.444.444-44, 000...) é placeholder: use null; ' +
      '(4) se o documento NÃO for de um processo judicial (é uma anotação, rascunho, lista de tarefas, contrato, e-mail, print de tela), marque pareceProcessoJudicial=false e deixe TODOS os outros campos null; ' +
      '(5) o cabeçalho da petição costuma trazer, além da comarca, o FORO ("Foro Central Cível", "Foro de Campinas") e a qualificação das partes (nome, CPF, polo) — registre o que estiver escrito.',
    messages: [
      {
        role: 'user',
        content: [blocoArquivo, { type: 'text', text: 'Extraia os dados de identificação deste documento.' }],
      },
    ],
    tools: [FERRAMENTA_EXTRACAO],
    tool_choice: { type: 'tool', name: NOME_FERRAMENTA },
  });

  const blocoUso = resposta.content.find(
    (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
  );
  if (!blocoUso) {
    throw new Error('Não foi possível extrair dados do documento.');
  }

  const entrada = blocoUso.input as Partial<DadosProcessoExtraidos>;

  // Porteiro: documento que não é de processo judicial não rende campo nenhum,
  // por mais que o modelo tenha preenchido algum. Barreira dupla — o prompt já
  // manda deixar tudo null nesse caso, isto aqui garante mesmo que ele escorregue.
  if (entrada.pareceProcessoJudicial !== true) {
    return { pareceProcessoJudicial: false, ...CAMPOS_VAZIOS };
  }

  const instancia = entrada.instancia === 'primeira' || entrada.instancia === 'segunda' ? entrada.instancia : null;
  const participacaoParte =
    entrada.participacaoParte === 'autor' || entrada.participacaoParte === 'reu' ? entrada.participacaoParte : null;

  return {
    pareceProcessoJudicial: true,
    nome: entrada.nome ?? null,
    cpf: entrada.cpf ?? null,
    telefone: entrada.telefone ?? null,
    endereco: entrada.endereco ?? null,
    municipio: entrada.municipio ?? null,
    processo: entrada.processo ?? null,
    comarca: entrada.comarca ?? null,
    classeProcessual: entrada.classeProcessual ?? null,
    foro: entrada.foro ?? null,
    instancia,
    participacaoParte,
    comarcaOrigem: entrada.comarcaOrigem ?? null,
    valorCausa: entrada.valorCausa ?? null,
  };
}
