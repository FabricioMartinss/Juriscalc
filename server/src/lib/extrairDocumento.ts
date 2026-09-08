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
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  endereco: string | null;
  municipio: string | null;
  processo: string | null;
  comarca: string | null;
  classeProcessual: string | null;
}

const NOME_FERRAMENTA = 'registrar_dados_processo';

const FERRAMENTA_EXTRACAO: Anthropic.Tool = {
  name: NOME_FERRAMENTA,
  description:
    'Registra os dados de identificação encontrados no documento. Use null em qualquer campo que não apareça claramente no texto — nunca invente, deduza ou complete um dado.',
  input_schema: {
    type: 'object',
    properties: {
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
    },
    required: ['nome', 'cpf', 'telefone', 'endereco', 'municipio', 'processo', 'comarca', 'classeProcessual'],
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
      'Você extrai dados de identificação de documentos jurídicos brasileiros (petições, procurações, guias de custas) para preencher um formulário. Leia com atenção e registre, pela ferramenta, apenas o que está explicitamente escrito no documento.',
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
  return {
    nome: entrada.nome ?? null,
    cpf: entrada.cpf ?? null,
    telefone: entrada.telefone ?? null,
    endereco: entrada.endereco ?? null,
    municipio: entrada.municipio ?? null,
    processo: entrada.processo ?? null,
    comarca: entrada.comarca ?? null,
    classeProcessual: entrada.classeProcessual ?? null,
  };
}
