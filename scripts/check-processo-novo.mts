/**
 * Confere `resolverCamposProcessoNovo` — o que a aba "Importar Processo" manda
 * pra extensão no bloco de processo novo.
 *
 * Roda com `npx tsx scripts/check-processo-novo.mts` (ou `npm run check:processo-novo`).
 * Duas coisas: (1) os ids que a função pode emitir existem mesmo nos campos dos
 * três serviços de processo novo do portal; (2) casos de resolução de comarca,
 * foro, classe, instância, participação e parte batem com o esperado.
 */
import { resolverCamposProcessoNovo, canonizarComarca, IDS_PROCESSO_NOVO } from '../src/lib/processoNovo';
import { camposDoServico } from '../src/data/servicosPortal';

let erros = 0;
const falhar = (m: string) => {
  console.log('  ERRO: ' + m);
  erros++;
};

// 1. Todo id que a função pode emitir tem que ser um campo real de pelo menos um
//    dos três serviços de processo novo (ou o comarcaOrigem das cartas).
console.log('ids emitidos existem nos campos do portal:');
const idsProcessoNovo = new Set(
  ['PETICAO_INICIAL', 'EXECUCAO_TITULO_EXTRA_JUDICIAL', 'ACAO_PENAL_PRIVADA_INICIAL']
    .flatMap((v) => camposDoServico(v))
    .map((c) => c.id),
);
const idsCarta = new Set(camposDoServico('CARTA_PRECATORIA_PROCESSO_OUTRO_TRIBUNAL').map((c) => c.id));
for (const [nome, id] of Object.entries(IDS_PROCESSO_NOVO)) {
  const ok = idsProcessoNovo.has(id) || idsCarta.has(id);
  if (!ok) falhar(`id "${id}" (${nome}) não aparece em nenhum campo de serviço do portal`);
  else console.log(`  ok  ${nome} -> ${id}`);
}

// 2. Casos de resolução.
console.log('\nresolução:');
type Caso = [string, Parameters<typeof resolverCamposProcessoNovo>[0], Record<string, string | undefined>];
const casos: Caso[] = [
  ['classe "Procedimento Comum Cível" casa "Procedimento Comum"',
    { comarca: 'Campinas', classeProcessual: 'Procedimento Comum Cível' },
    { cmb_comarca1_ativa_alocacao: '6347', cmb_classe: '2458' }],
  ['comarca de foro único resolve o foro sozinha',
    { comarca: 'Adamantina' },
    { cmb_comarca1_ativa_alocacao: '5594', cmb_foro1_ativo_alocacao: '5595' }],
  ['apelido "Capital" resolve para a comarca de São Paulo',
    { comarca: 'Capital', foro: 'Foro Regional de Santo Amaro' },
    { cmb_comarca1_ativa_alocacao: '9787', cmb_foro1_ativo_alocacao: '9853' }],
  ['foro do documento, comarca multi-foro, match por palavra distintiva',
    { comarca: 'São Paulo', foro: 'Foro Regional de Santo Amaro' },
    { cmb_comarca1_ativa_alocacao: '9787', cmb_foro1_ativo_alocacao: '9853' }],
  ['foro "Foro Central Cível" casa exato',
    { comarca: 'São Paulo', foro: 'Foro Central Cível' },
    { cmb_comarca1_ativa_alocacao: '9787', cmb_foro1_ativo_alocacao: '10525' }],
  ['foro sem palavra distintiva ("Foro Central") fica em branco',
    { comarca: 'São Paulo', foro: 'Foro Central' },
    { cmb_comarca1_ativa_alocacao: '9787' }],
  ['foro de outra comarca não vaza',
    { comarca: 'Campinas', foro: 'Foro Regional de Santo Amaro' },
    { cmb_comarca1_ativa_alocacao: '6347' }],
  ['instância primeira -> radio 1', { instancia: 'primeira' }, { instancia: 'rd_instancia_1' }],
  ['instância segunda -> radio 2', { instancia: 'segunda' }, { instancia: 'rd_instancia_2' }],
  ['instância inválida -> nada', { instancia: 'terceira' }, {}],
  ['participação autor -> RECLAMANTE', { participacaoParte: 'autor' }, { participacaoSelecionada: 'RECLAMANTE' }],
  ['participação reu -> RECLAMADO', { participacaoParte: 'reu' }, { participacaoSelecionada: 'RECLAMADO' }],
  ['parte: nome trim + CPF mascarado',
    { parteNome: '  Fulano de Tal  ', parteCpf: '11144477735' },
    { parteNome: 'Fulano de Tal', parteCpfCnpj: '111.444.777-35' }],
  ['parte: CNPJ 14 dígitos mascarado', { parteCpf: '11222333000181' }, { parteCpfCnpj: '11.222.333/0001-81' }],
  ['parte: CPF incompleto não entra', { parteCpf: '111444' }, {}],
  ['comarca de origem (carta) passa direto', { comarcaOrigem: 'Curitiba' }, { comarcaOrigem: 'Curitiba' }],
  ['entrada vazia -> {}', {}, {}],
];

for (const [nome, entrada, esperado] of casos) {
  const obtido = resolverCamposProcessoNovo(entrada);
  const chaves = new Set([...Object.keys(obtido), ...Object.keys(esperado)]);
  let bom = true;
  for (const k of chaves) if ((esperado[k] ?? undefined) !== (obtido[k] ?? undefined)) bom = false;
  if (bom) console.log(`  ok  ${nome}`);
  else falhar(`${nome}\n    esperado ${JSON.stringify(esperado)}\n    obtido   ${JSON.stringify(obtido)}`);
}

// 3. canonizarComarca resolve apelidos, mantém o resto.
console.log('\ncanonizarComarca:');
for (const [entrada, esperado] of [
  // "SÃO PAULO" é a grafia do próprio <select> do portal (comarcasTJSP.ts).
  ['Capital', 'SÃO PAULO'],
  ['COMARCA DA CAPITAL', 'SÃO PAULO'],
  ['Campinas', 'Campinas'],
  ['Xanadu', 'Xanadu'],
] as const) {
  const got = canonizarComarca(entrada);
  if (got === esperado) console.log(`  ok  "${entrada}" -> "${got}"`);
  else falhar(`canonizarComarca("${entrada}") = "${got}", esperava "${esperado}"`);
}

console.log(`\n${erros === 0 ? 'OK' : erros + ' erro(s)'}`);
process.exit(erros === 0 ? 0 : 1);
