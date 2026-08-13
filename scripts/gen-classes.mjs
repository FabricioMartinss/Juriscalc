/**
 * Gera `src/data/classesTJSP.ts` a partir do JSON colhido do portal.
 *
 *   node scripts/gen-classes.mjs <caminho-do-juriscalc-classe.json>
 *
 * Mesmo motivo do `gen-foros.mjs`: 541 pares digitados a mão teriam erro, e um
 * id de classe trocado não dá erro nenhum — emite a guia com a classe errada.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const entrada = process.argv[2];
if (!entrada) {
  console.error('uso: node scripts/gen-classes.mjs <juriscalc-classe.json>');
  process.exit(1);
}

const classes = JSON.parse(readFileSync(entrada, 'utf8')).cmb_classe;
if (!Array.isArray(classes) || classes.length === 0) {
  console.error('JSON sem cmb_classe utilizavel');
  process.exit(1);
}

const ids = classes.map((c) => c.valor);
const repetidos = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
if (repetidos.length) {
  console.error('ids repetidos: ' + repetidos.join(', '));
  process.exit(1);
}
if (classes.some((c) => !c.valor || !c.rotulo)) {
  console.error('ha entrada sem valor ou sem rotulo');
  process.exit(1);
}

const ordenadas = [...classes].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

const cabecalho = `/**
 * Classes processuais do TJSP (\`cmb_classe\`).
 *
 * Colhidas do <select> do Portal de Custas em 13/08/2026, via
 * \`scripts/gen-classes.mjs\` — nunca transcritas à mão.
 *
 * Só aparecem nos três serviços que abrem processo novo: Petição Inicial,
 * Execução de Título Extrajudicial e Ação Penal Privada - Inicial. Nos demais,
 * o portal deduz a classe do número de processo validado.
 *
 * Como \`forosTJSP\`, esta lista muda com o tempo — classes são criadas e
 * extintas por norma. Enquanto estiver embutida, atualizá-la custa uma revisão
 * da Chrome Web Store; é candidata a virar dado remoto junto com os foros.
 */
export const CLASSES_TJSP: readonly { valor: string; rotulo: string }[] = [
`;

const corpo = ordenadas
  .map((c) => `  { valor: '${c.valor}', rotulo: '${c.rotulo.replace(/'/g, "\\'")}' },`)
  .join('\n');

const destino = new URL('../src/data/classesTJSP.ts', import.meta.url);
writeFileSync(destino, cabecalho + corpo + '\n];\n', 'utf8');
console.log('escrito: src/data/classesTJSP.ts (' + ordenadas.length + ' classes)');
