/**
 * Gera `src/data/comarcasTJSP.ts` a partir do JSON colhido do portal.
 *
 *   node scripts/gen-comarcas.mjs <caminho-do-juriscalc-comarcas.json>
 *
 * Mesmo motivo do `gen-foros.mjs` e do `gen-classes.mjs`: id trocado não dá
 * erro, distribui o processo na comarca errada.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const entrada = process.argv[2];
if (!entrada) {
  console.error('uso: node scripts/gen-comarcas.mjs <juriscalc-comarcas.json>');
  process.exit(1);
}

const comarcas = JSON.parse(readFileSync(entrada, 'utf8')).comarcas;
if (!Array.isArray(comarcas) || comarcas.length === 0) {
  console.error('JSON sem comarcas utilizavel');
  process.exit(1);
}

const ids = comarcas.map((c) => c.valor);
const repetidos = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
if (repetidos.length) {
  console.error('ids repetidos: ' + repetidos.join(', '));
  process.exit(1);
}
if (comarcas.some((c) => !c.valor || !c.rotulo)) {
  console.error('ha entrada sem valor ou sem rotulo');
  process.exit(1);
}

const ordenadas = [...comarcas].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

const cabecalho = `/**
 * Comarcas do TJSP (\`cmb_comarca1_ativa_alocacao\`).
 *
 * Colhidas do <select> do Portal de Custas em 13/08/2026, via
 * \`scripts/gen-comarcas.mjs\` — nunca transcritas à mão.
 *
 * Só aparecem depois de escolher a instância, nos três serviços que abrem
 * processo novo. Por isso não estavam em nenhum dump inicial: o campo nasce
 * escondido e o portal o revela quando o radio da instância é marcado.
 *
 * O FORO é encadeado a esta lista e por isso não mora aqui: cada comarca traz
 * seus foros por AJAX. Adamantina tem um; São Paulo tem 54. Quem resolve o
 * encadeamento é a extensão, que espera a lista carregar antes de escolher —
 * mesmo padrão que já usa entre UF e município do contribuinte.
 *
 * Existe um segundo conjunto no portal (\`cmb_comarca2_ativa_alocacao\`, com 58
 * entradas) que fica escondido nos dois estados observados. Não é usado.
 */
export const COMARCAS_TJSP: readonly { valor: string; rotulo: string }[] = [
`;

const corpo = ordenadas
  .map((c) => `  { valor: '${c.valor}', rotulo: '${c.rotulo.replace(/'/g, "\\'")}' },`)
  .join('\n');

const destino = new URL('../src/data/comarcasTJSP.ts', import.meta.url);
writeFileSync(destino, cabecalho + corpo + '\n];\n', 'utf8');
console.log('escrito: src/data/comarcasTJSP.ts (' + ordenadas.length + ' comarcas)');
