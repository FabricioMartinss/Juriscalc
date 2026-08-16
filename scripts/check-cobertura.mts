/**
 * Relatório de cobertura da emissão automática, por enquadramento.
 *
 *   npm run check:cobertura
 *
 * Responde "os 19 enquadramentos estão automatizados?" olhando o dado, e não a
 * memória de quem perguntou. Para cada serviço que um enquadramento pode usar,
 * confere se ele foi inspecionado no portal e se algum campo ainda depende de o
 * usuário preencher lá.
 *
 * O que este script NÃO garante: que o `id` declarado exista mesmo na página, e
 * que a guia emitida esteja correta. Isso só o uso real diz.
 */
import {
  SERVICOS_POR_ENQUADRAMENTO,
  SERVICOS_PORTAL,
  CAMPOS_POR_SERVICO,
  camposDoServico,
  opcoesDoCampo,
  temListaConhecida,
  type ChaveServico,
} from '../src/data/servicosPortal';

let pendentes = 0;
const enquadramentos = Object.keys(SERVICOS_POR_ENQUADRAMENTO);

console.log('enquadramento  servico                                       campos');
console.log('-'.repeat(78));

for (const [enq, chaves] of Object.entries(SERVICOS_POR_ENQUADRAMENTO)) {
  for (const chave of chaves as ChaveServico[]) {
    const inspecionado = CAMPOS_POR_SERVICO[chave] !== undefined;
    const campos = camposDoServico(SERVICOS_PORTAL[chave].valor);
    const semLista = campos.filter((c) => c.select && !temListaConhecida(c));
    if (semLista.length) pendentes++;
    console.log(
      enq.padEnd(14) +
        chave.slice(0, 44).padEnd(46) +
        String(campos.length).padStart(2) +
        (inspecionado ? '' : '   NAO INSPECIONADO') +
        (semLista.length ? '   FALTA: ' + semLista.map((c) => c.label).join(', ') : ''),
    );
  }
}

const naoInspecionados = (Object.keys(SERVICOS_PORTAL) as ChaveServico[]).filter(
  (k) => CAMPOS_POR_SERVICO[k] === undefined,
);

// Dropdown sem opcoes e sem pai declarado seria um campo que o painel mostra
// vazio -- pior que nao mostrar.
const semOpcoes: string[] = [];
for (const chave of Object.keys(SERVICOS_PORTAL) as ChaveServico[]) {
  for (const c of camposDoServico(SERVICOS_PORTAL[chave].valor)) {
    if (c.select && !c.dependeDe && opcoesDoCampo(c, {}).length === 0) {
      semOpcoes.push(chave + '.' + c.id);
    }
  }
}

console.log('-'.repeat(78));
console.log('enquadramentos:                    ' + enquadramentos.length);
console.log('servicos do portal:                ' + Object.keys(SERVICOS_PORTAL).length);
console.log('servicos nao inspecionados:        ' + naoInspecionados.length);
console.log('servicos com campo so no portal:   ' + pendentes);
console.log('dropdowns sem lista de opcoes:     ' + semOpcoes.length);

const falhou = naoInspecionados.length + pendentes + semOpcoes.length;
console.log(falhou === 0 ? '\nCOBERTURA COMPLETA' : '\n' + falhou + ' PENDENCIA(S)');
process.exit(falhou === 0 ? 0 : 1);
