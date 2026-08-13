/**
 * Gera `src/data/forosPorComarca.ts` a partir do JSON colhido do portal.
 *
 *   node scripts/gen-foros-por-comarca.mjs <juriscalc-foros-v2.json>
 *
 * O JSON sai de um script que percorre as 321 comarcas, dispara o `change` e
 * espera a lista de foros MUDAR antes de gravar. A primeira versão desse script
 * usava `setTimeout` fixo e produziu um mapa corrompido — São Paulo apareceu
 * com um único "Foro De Bilac", porque onde o AJAX demorou mais a leitura pegou
 * a lista da comarca anterior e tudo desandou a partir dali.
 *
 * Por isso este gerador VALIDA em vez de confiar:
 *  - toda comarca tem que ter pelo menos um foro;
 *  - todo id de foro tem que existir em `forosTJSP.ts`;
 *  - a colheita tem que ter confirmado a mudança da lista (`mudou`).
 *
 * Guarda só os ids. Os rótulos já vivem em `forosTJSP.ts`, e duplicá-los
 * criaria duas verdades para o mesmo nome.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const entrada = process.argv[2];
if (!entrada) {
  console.error('uso: node scripts/gen-foros-por-comarca.mjs <juriscalc-foros-v2.json>');
  process.exit(1);
}

const mapa = JSON.parse(readFileSync(entrada, 'utf8'));

// Ids conhecidos, lidos do arquivo gerado dos foros.
const fonteForos = new URL('../src/data/forosTJSP.ts', import.meta.url);
const conhecidos = new Set(
  [...readFileSync(fonteForos, 'utf8').matchAll(/valor: '([^']+)'/g)].map((m) => m[1]),
);

const erros = [];
const ids = Object.keys(mapa);

for (const id of ids) {
  const e = mapa[id];
  if (!e.mudou) erros.push(`${e.nome}: colheita nao confirmou mudanca da lista`);
  if (!e.foros || e.foros.length === 0) erros.push(`${e.nome}: sem foro nenhum`);
  for (const f of e.foros || []) {
    if (!conhecidos.has(f.valor)) {
      erros.push(`${e.nome}: foro ${f.valor} (${f.rotulo}) nao existe em forosTJSP.ts`);
    }
  }
}

if (erros.length) {
  console.error('VALIDACAO FALHOU:');
  erros.slice(0, 20).forEach((e) => console.error('  ' + e));
  if (erros.length > 20) console.error('  ... e mais ' + (erros.length - 20));
  process.exit(1);
}

const ordenados = ids.sort((a, b) => mapa[a].nome.localeCompare(mapa[b].nome, 'pt-BR'));
const total = ordenados.reduce((s, id) => s + mapa[id].foros.length, 0);

const cabecalho = `/**
 * Quais foros pertencem a cada comarca do TJSP.
 *
 * Chave: id da comarca (\`cmb_comarca1_ativa_alocacao\`).
 * Valor: ids de foro (\`cmb_foro1_ativo_alocacao\`), que existem em
 * \`forosTJSP.ts\` — os rótulos moram lá, não aqui.
 *
 * Colhido do portal em 13/08/2026 por \`scripts/gen-foros-por-comarca.mjs\`,
 * percorrendo as ${ordenados.length} comarcas uma a uma.
 *
 * Existe para o painel oferecer SÓ os foros da comarca escolhida. Sem isso a
 * lista mostrava os ${conhecidos.size} foros do estado inteiro, e nada impedia
 * escolher um foro de outra cidade: a extensão não acharia a opção na página e
 * a guia sairia sem foro.
 *
 * ${ordenados.length} comarcas, ${total} pares. A maioria tem um único foro;
 * São Paulo tem 54.
 */
export const FOROS_POR_COMARCA: Readonly<Record<string, readonly string[]>> = {
`;

const corpo = ordenados
  .map((id) => {
    const e = mapa[id];
    const lista = e.foros.map((f) => `'${f.valor}'`).join(', ');
    return `  // ${e.nome}\n  '${id}': [${lista}],`;
  })
  .join('\n');

const destino = new URL('../src/data/forosPorComarca.ts', import.meta.url);
writeFileSync(destino, cabecalho + corpo + '\n};\n', 'utf8');
console.log(`escrito: src/data/forosPorComarca.ts (${ordenados.length} comarcas, ${total} pares)`);
