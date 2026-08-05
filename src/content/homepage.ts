/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Todo o texto da homepage vive aqui.
 *
 * A copy é PROVISÓRIA — o cliente vai revisar e mandar a versão final. Por isso
 * nada de texto solto dentro do componente: para trocar a redação, mexe-se só
 * neste arquivo, sem risco de quebrar layout.
 */

export const ROTA_PLATAFORMA = '/app';

export const conteudo = {
  marca: {
    nome: 'JuriscalcSP',
    descritor: 'Calculadora Jurídica Inteligente',
  },

  cta: 'Acessar a plataforma',

  hero: {
    titulo: 'Segurança no cálculo. Tranquilidade no protocolo.',
    subtitulo:
      'A calculadora jurídica inteligente para escritórios do estado de São Paulo. Custas do TJSP calculadas com rigor, em segundos.',
    selos: ['TJSP', 'e-SAJ', 'EPROC'],
  },

  problema: {
    destaque: 'Recurso deserto não tem apelação.',
    texto:
      'Uma guia de custas errada pode custar o processo inteiro. O JuriscalcSP elimina o risco de guias erradas e recursos desertos.',
  },

  /** Gancho de tempo: faz o leitor calcular o custo da própria rotina. */
  tempo: {
    etiqueta: 'A conta que ninguém faz',
    perguntas: [
      'Quanto tempo você leva, por dia, para calcular as custas e emitir uma guia de Recurso Inominado de um processo que tramita no JEC?',
      'E quanto tempo você pouparia se o cálculo e a emissão fossem automatizados, bastando informar os dados básicos?',
    ],
    fecho:
      'É exatamente essa a diferença que o JuriscalcSP faz: você informa os dados do processo e recebe a matemática exata, pronta para recolher.',
  },

  recursos: {
    titulo: 'O que a plataforma faz',
    subtitulo: 'Da hipótese de recolhimento à guia preenchida, sem planilha paralela.',
    itens: [
      {
        icone: 'tabela' as const,
        titulo: '19 hipóteses de recolhimento',
        texto:
          'A Tabela de Taxas do TJSP automatizada no e-SAJ, com cálculo correto também para guias emitidas pelo Eproc. Os pisos e tetos da UFESP vigente são aplicados com rigor, parcela por parcela.',
      },
      {
        icone: 'correcao' as const,
        titulo: 'Correção monetária nativa',
        texto:
          'Motor próprio que atualiza valores pelas três tabelas oficiais do tribunal: a Nova Tabela Prática da Lei 14.905/2024, a Antiga pelo INPC e a IPCA-E. Sem planilha paralela, sem índice defasado.',
      },
      {
        icone: 'velocidade' as const,
        titulo: 'Cálculo em segundos',
        texto:
          'Informe os dados do processo e receba cada custa discriminada: iniciais, preparo recursal, custas complementares, rateio entre partes e o total por guia — DARE, FEDTJ e GRD separadas.',
      },
    ],
  },

  /** Lista real, extraída dos enquadramentos que a plataforma implementa. */
  hipoteses: {
    titulo: 'As 19 hipóteses, uma a uma',
    subtitulo:
      'Cada enquadramento com sua alíquota, sua base legal e seus limites — não é uma calculadora genérica de percentual.',
    grupos: [
      {
        nome: 'Procedimento comum e execuções',
        itens: [
          'Petição inicial, reconvenção e embargos',
          'Execução de título extrajudicial',
          'Apelação e recurso adesivo',
          'Instauração de cumprimento de sentença',
          'Cumprimento de sentença de julgado externo',
          'Satisfação da execução ou do cumprimento',
          'Execução fiscal',
          'Agravo de instrumento',
          'Cartas precatórias, de ordem e arbitrais',
          'Partilha, inventário e divórcio',
          'Habilitação retardatária de crédito',
          'Ações penais em geral',
          'Ações penais privadas (queixa-crime)',
          'Litisconsórcio ativo voluntário',
          'Litisconsorte ulterior e assistência',
        ],
      },
      {
        nome: 'Juizados Especiais Cíveis',
        itens: [
          'Recurso inominado (preparo)',
          'Cumprimento de sentença no JEC',
          'Ausência injustificada em audiência',
          'Despesas processuais finais pendentes',
        ],
      },
    ],
  },

  /** Demonstração visual — números ilustrativos, não é cálculo real. */
  demonstracao: {
    titulo: 'Cada custa, discriminada',
    texto:
      'O resultado sai pronto para conferência e para colar na petição, com a memória de cálculo e a base legal de cada parcela. No Recurso Inominado, por exemplo, o piso de 5 UFESPs incide isoladamente em cada uma das duas parcelas — detalhe que passa despercebido em cálculo manual e muda o valor da guia.',
    etiqueta: 'Exemplo ilustrativo',
    enquadramento: 'JEC 1: Recurso Inominado (Preparo)',
    linhas: [
      { rotulo: 'Ingresso Dispensado JEC (1,5%)', valor: 'R$ 300,00' },
      { rotulo: 'Preparo Recursal JEC (4,0%)', valor: 'R$ 800,00' },
    ],
    totalRotulo: 'Total da guia',
    totalValor: 'R$ 1.100,00',
    nota: 'Base: causa de R$ 20.000,00, peticionamento a partir de 03/01/2024.',
  },

  ctaFinal: {
    titulo: 'Comece a calcular agora.',
    texto: 'Sem instalação e sem configuração. Abra a plataforma e faça o primeiro cálculo.',
  },

  rodape: {
    mencoes: ['TJSP', 'e-SAJ', 'EPROC'],
    direitos: '© 2026 JuriscalcSP. Todos os direitos reservados.',
  },
} as const;
