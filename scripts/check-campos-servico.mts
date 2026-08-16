/**
 * Confere o mapa de campos extras por serviço contra o de enquadramentos.
 *
 * Roda com `npx tsx scripts/check-campos-servico.mts`. Não substitui conferir
 * no portal — só garante que o mapa é coerente consigo mesmo: ids sem
 * duplicata, todo serviço declarado existindo de verdade, e o relatório de
 * quais enquadramentos passam a pedir campo digitado.
 */
import {
  SERVICOS_PORTAL,
  SERVICOS_POR_ENQUADRAMENTO,
  CAMPOS_POR_SERVICO,
  camposDoServico,
  servicoPadrao,
  type ChaveServico,
} from '../src/data/servicosPortal';

let erros = 0;
const falhar = (m: string) => {
  console.log('  ERRO: ' + m);
  erros++;
};

// 1. Todo serviço declarado em CAMPOS_POR_SERVICO tem que existir.
console.log('servicos declarados existem:');
for (const chave of Object.keys(CAMPOS_POR_SERVICO) as ChaveServico[]) {
  if (!SERVICOS_PORTAL[chave]) falhar(`servico "${chave}" nao existe em SERVICOS_PORTAL`);
}
console.log(`  ${Object.keys(CAMPOS_POR_SERVICO).length} servicos, ${erros} erro(s)`);

// 2. camposDoServico() precisa resolver pelo `valor`, que e o que a tela usa.
console.log('\ncamposDoServico() resolve pelo valor do portal:');
for (const chave of Object.keys(CAMPOS_POR_SERVICO) as ChaveServico[]) {
  const esperado = CAMPOS_POR_SERVICO[chave]!;
  const obtido = camposDoServico(SERVICOS_PORTAL[chave].valor);
  if (obtido.length !== esperado.length) falhar(`${chave}: esperado ${esperado.length}, veio ${obtido.length}`);
  else console.log(`  ${chave} -> ${obtido.map((c) => c.id).join(', ')}`);
}
if (camposDoServico(undefined).length !== 0) falhar('camposDoServico(undefined) deveria ser vazio');
if (camposDoServico('NAO_EXISTE').length !== 0) falhar('servico inexistente deveria ser vazio');

// 3. Ids duplicados dentro de um mesmo servico sobrescreveriam um ao outro.
console.log('\nids duplicados por servico:');
for (const [chave, campos] of Object.entries(CAMPOS_POR_SERVICO)) {
  const ids = campos!.map((c) => c.id);
  if (new Set(ids).size !== ids.length) falhar(`${chave} tem id repetido: ${ids.join(', ')}`);
}
console.log('  nenhum');

// 4. Relatorio: o que cada enquadramento DECLARA, pelo servico padrao.
//
// Nao e o que o usuario vai ver. A tela ainda esconde o que o calculo cobre --
// o comum_10 declara `valorMonteMor` e mesmo assim nao mostra o campo, porque o
// app ja preenche. Para saber o que aparece, olhe `camposParaDigitar`.
console.log('\ncampos declarados por enquadramento (pelo servico padrao):');
for (const [enq, chaves] of Object.entries(SERVICOS_POR_ENQUADRAMENTO)) {
  const campos = camposDoServico(servicoPadrao(enq)?.valor);
  if (campos.length) console.log(`  ${enq.padEnd(10)} ${chaves[0].padEnd(45)} ${campos.map((c) => c.id).join(', ')}`);
}

// 5. Enquadramentos que dividem servico -- onde o filtro da tela e o que separa.
console.log('\nservicos usados por mais de um enquadramento:');
const porServico = new Map<string, string[]>();
for (const [enq, chaves] of Object.entries(SERVICOS_POR_ENQUADRAMENTO)) {
  for (const c of chaves) porServico.set(c, [...(porServico.get(c) || []), enq]);
}
for (const [chave, enqs] of porServico) {
  if (enqs.length > 1 && CAMPOS_POR_SERVICO[chave as ChaveServico]) {
    console.log(`  ${chave}: ${enqs.join(', ')}  <- o filtro da tela decide quem digita`);
  }
}

console.log(`\n${erros === 0 ? 'OK' : erros + ' ERRO(S)'}`);
process.exit(erros === 0 ? 0 : 1);
