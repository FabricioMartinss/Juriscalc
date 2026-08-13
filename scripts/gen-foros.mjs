/**
 * Gera `src/data/forosTJSP.ts` a partir do JSON colhido do portal.
 *
 *   node scripts/gen-foros.mjs <caminho-do-juriscalc-selects.json>
 *
 * O JSON sai do console do Portal de Custas — ver `dump-campos-portal.js` e o
 * trecho de colheita em store/MAPEAMENTO-PORTAL.md. Passa por script, e não por
 * cópia manual, porque um id trocado não dá erro: manda a carta para o foro
 * errado, em silêncio.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const entrada = process.argv[2];
if (!entrada) {
  console.error('uso: node scripts/gen-foros.mjs <juriscalc-selects.json>');
  process.exit(1);
}

const dados = JSON.parse(readFileSync(entrada, 'utf8'));
const foros = dados.forosDeprecado;

if (!Array.isArray(foros) || foros.length === 0) {
  console.error('JSON sem forosDeprecado utilizavel');
  process.exit(1);
}

// Um id repetido significaria duas unidades disputando a mesma chave.
const ids = foros.map((f) => f.valor);
const repetidos = ids.filter((v, i) => ids.indexOf(v) !== i);
if (repetidos.length) {
  console.error('ids repetidos: ' + [...new Set(repetidos)].join(', '));
  process.exit(1);
}
if (foros.some((f) => !f.valor || !f.rotulo)) {
  console.error('ha entrada sem valor ou sem rotulo');
  process.exit(1);
}

const ordenados = [...foros].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

const cabecalho = `/**
 * Unidades do TJSP que podem receber uma carta deprecada (\`forosDeprecado\`).
 *
 * Colhidas do <select> do Portal de Custas em 13/08/2026, via
 * \`scripts/gen-foros.mjs\` — nunca transcritas à mão. Um id trocado não gera
 * erro: manda a carta para o foro errado, sem aviso.
 *
 * O \`valor\` é o id interno do portal; o \`rotulo\` é o que aparece na tela.
 *
 * Não é encadeada ao estado. A carta vem de outro tribunal, mas é sempre
 * deprecada para uma unidade paulista — por isso a lista é uma só.
 *
 * Inclui foros, colégios recursais, núcleos 4.0, plantões e DEECRIMs, do jeito
 * que o portal oferece. Há vestígios de reorganização ("Antigo Foro Distrital
 * de Brás Cubas", "Foro Plantão - 00ª Cj - Capital Extinto"), o que mostra que
 * esta lista muda com o tempo — ao contrário de municípios ou UFs. Enquanto
 * estiver embutida, atualizá-la custa uma revisão da Chrome Web Store; é a
 * primeira candidata a virar dado remoto, como o \`indices.json\`.
 */
export const FOROS_TJSP: readonly { valor: string; rotulo: string }[] = [
`;

const corpo = ordenados
  .map((f) => `  { valor: '${f.valor}', rotulo: '${f.rotulo.replace(/'/g, "\\'")}' },`)
  .join('\n');

const destino = new URL('../src/data/forosTJSP.ts', import.meta.url);
writeFileSync(destino, cabecalho + corpo + '\n];\n', 'utf8');
console.log('escrito: src/data/forosTJSP.ts (' + ordenados.length + ' foros)');
