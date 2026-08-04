/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sincroniza `src/data/indices.generated.ts` com as Tabelas Práticas de
 * Atualização Monetária publicadas pelo TJSP.
 *
 * Fluxo: raspa a página do comunicado -> baixa os 3 PDFs -> extrai o texto ->
 * lê a grade (linha de anos + linhas de mês) -> VALIDA -> reescreve o arquivo.
 *
 * O script só ACRESCENTA meses. Qualquer divergência num mês já conhecido é
 * tratada como erro fatal: ou o TJSP revisou um fator (decisão humana), ou o
 * layout do PDF mudou e o parser está lendo a coluna errada. Nos dois casos a
 * atualização automática precisa parar.
 *
 * Uso:
 *   node scripts/sync-indices.mjs            # valida e grava se houver novidade
 *   node scripts/sync-indices.mjs --check    # não grava; sai 1 se estiver desatualizado
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ARQUIVO_GERADO = resolve(AQUI, '../src/data/indices.generated.ts');

const PAGINA_COMUNICADO =
  'https://www.tjsp.jus.br/PrimeiraInstancia/CalculosJudiciais/Comunicado?codigoComunicado=2524&pagina=1';

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/**
 * Séries mantidas por este script. `anoInicial`/`mesInicial` marcam a fronteira
 * com `indicesHistoricos.ts` — antes disso os fatores são congelados à mão.
 */
const SERIES = [
  {
    chave: 'SERIE_NOVA',
    nome: 'Nova Tabela Prática (Lei nº 14.905/2024 — IPCA-15)',
    anoInicial: 2024,
    mesInicial: 9,
    // Identifica o link na página do comunicado.
    casaCom: (rotulo) => rotulo.includes('14.905'),
  },
  {
    chave: 'SERIE_ANTIGA',
    nome: 'Antiga Tabela Prática (INPC)',
    anoInicial: 2024,
    mesInicial: 9,
    casaCom: (rotulo) => rotulo.includes('antiga'),
  },
  {
    chave: 'SERIE_IPCA_E',
    nome: 'Tabela Prática IPCA-E',
    anoInicial: 2024,
    mesInicial: 1,
    casaCom: (rotulo) => rotulo.includes('ipca-e'),
  },
];

/** Faixa plausível de variação mês a mês. Fora disso, algo está errado. */
const VAR_MIN = -0.02;
const VAR_MAX = 0.04;

const modoCheck = process.argv.includes('--check');

function falhar(msg) {
  console.error(`\n[ERRO] ${msg}\n`);
  process.exit(1);
}

/** Decodifica as entidades HTML que aparecem nos rótulos do TJSP. */
function decodificar(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

/** Remove acentos e baixa a caixa, para casar rótulos sem depender de grafia. */
function normalizar(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

async function descobrirArquivos() {
  const resp = await fetch(PAGINA_COMUNICADO, {
    headers: { 'User-Agent': 'JurisCalc-SP sync-indices (+github.com/FabricioMartinss/Juriscalc)' },
  });
  if (!resp.ok) falhar(`página do comunicado retornou HTTP ${resp.status}`);
  const html = await resp.text();

  const links = [];
  const re = /<a[^>]*href="([^"]*FileFetch[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const rotulo = normalizar(decodificar(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim());
    links.push({ url: m[1].replace(/&amp;/g, '&'), rotulo });
  }
  if (links.length === 0) falhar('nenhum link de tabela encontrado na página do comunicado');

  const achados = {};
  for (const serie of SERIES) {
    const casados = links.filter((l) => serie.casaCom(l.rotulo));
    if (casados.length !== 1) {
      falhar(
        `esperava exatamente 1 link para "${serie.nome}", achei ${casados.length}. ` +
          `Rótulos disponíveis: ${links.map((l) => JSON.stringify(l.rotulo)).join(', ')}`
      );
    }
    achados[serie.chave] = casados[0].url;
  }
  return achados;
}

/**
 * Tolerância vertical (em unidades do PDF) para considerar que dois fragmentos
 * pertencem à mesma linha. No layout do TJSP o rótulo do mês e os fatores da
 * linha não ficam exatamente no mesmo Y, e as linhas distam ~16 unidades — daí
 * agrupar por proximidade em vez de por Y exato.
 */
const TOLERANCIA_Y = 6;

/** Extrai as linhas de texto do PDF, agrupando os fragmentos por proximidade vertical. */
async function extrairLinhas(buffer) {
  const doc = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: false }).promise;
  const linhas = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const conteudo = await (await doc.getPage(p)).getTextContent();

    const itens = [];
    for (const item of conteudo.items) {
      if (!item.str || !item.str.trim()) continue;
      itens.push({ x: item.transform[4], y: item.transform[5], texto: item.str });
    }
    itens.sort((a, b) => b.y - a.y);

    const grupos = [];
    for (const item of itens) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && Math.abs(ultimo.y - item.y) <= TOLERANCIA_Y) ultimo.itens.push(item);
      else grupos.push({ y: item.y, itens: [item] });
    }

    for (const grupo of grupos) {
      linhas.push(
        grupo.itens
          .sort((a, b) => a.x - b.x)
          .map((i) => i.texto)
          .join(' ')
      );
    }
  }
  return linhas;
}

/**
 * Lê a grade do PDF. Retorna `{ '2026-8': '105.555857', ... }` — o valor fica
 * como string para preservar exatamente as casas decimais publicadas.
 *
 * Só interessa o trecho a partir de `mesMinimo/anoMinimo`. O trecho anterior
 * atravessa várias trocas de padrão monetário e tem colunas vazias à esquerda
 * (out/1964), que tornariam o mapeamento posicional traiçoeiro — e é imutável
 * de qualquer forma.
 */
function lerGrade(linhas, anoMinimo, mesMinimo) {
  const limite = anoMinimo * 12 + mesMinimo;
  const fatores = {};
  let anosDaColuna = [];

  for (const linha of linhas) {
    const compacto = linha.replace(/\s/g, '');

    // Cabeçalho de anos: os dígitos vêm espaçados ("2 0 2 4 2 0 2 5 ...").
    if (/^\d+$/.test(compacto) && compacto.length % 4 === 0 && compacto.length >= 4) {
      const anos = [];
      for (let i = 0; i < compacto.length; i += 4) anos.push(Number(compacto.slice(i, i + 4)));
      if (anos.every((a) => a > 1900 && a < 2100)) {
        anosDaColuna = anos;
        continue;
      }
    }

    const m = /^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.*)$/.exec(linha.trim());
    if (!m || anosDaColuna.length === 0) continue;

    const mes = MESES.indexOf(m[1]) + 1;
    const numeros = m[2].match(/[\d.]+,\d+/g) || [];
    if (numeros.length > anosDaColuna.length) {
      falhar(
        `linha "${linha.trim()}" tem ${numeros.length} valores para ${anosDaColuna.length} colunas de ano — ` +
          'o layout do PDF provavelmente mudou'
      );
    }
    numeros.forEach((bruto, i) => {
      const ano = anosDaColuna[i];
      if (ano * 12 + mes < limite) return;
      fatores[`${ano}-${mes}`] = bruto.replace(/\./g, '').replace(',', '.');
    });
  }
  return fatores;
}

/** Lê o arquivo gerado atual para comparação. Formato conhecido — nós o escrevemos. */
function lerGeradoAtual() {
  if (!existsSync(ARQUIVO_GERADO)) return null;
  const src = readFileSync(ARQUIVO_GERADO, 'utf8');
  const series = {};
  for (const { chave } of SERIES) {
    const bloco = new RegExp(`${chave}[\\s\\S]*?valores:\\s*\\{([\\s\\S]*?)\\n  \\},`).exec(src);
    if (!bloco) continue;
    const valores = {};
    const re = /(\d{4}):\s*\[([^\]]*)\]/g;
    let m;
    while ((m = re.exec(bloco[1])) !== null) {
      valores[Number(m[1])] = m[2].split(',').map((s) => s.trim()).filter(Boolean);
    }
    series[chave] = valores;
  }
  return series;
}

/** Converte `{ano: [strings]}` para `{'ano-mes': string}`. */
function achatar(valores, anoInicial, mesInicial) {
  const saida = {};
  for (const [anoStr, lista] of Object.entries(valores)) {
    const ano = Number(anoStr);
    const base = ano === anoInicial ? mesInicial : 1;
    lista.forEach((v, i) => {
      saida[`${ano}-${i + base}`] = v;
    });
  }
  return saida;
}

/** Sequência de períodos de (anoInicial, mesInicial) até o fim da série lida. */
function periodosDe(fatores, anoInicial, mesInicial) {
  const periodos = [];
  let ano = anoInicial;
  let mes = mesInicial;
  while (fatores[`${ano}-${mes}`] !== undefined) {
    periodos.push([ano, mes]);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
  return periodos;
}

function validar(serie, doPdf, atual) {
  const { chave, nome, anoInicial, mesInicial } = serie;

  const periodos = periodosDe(doPdf, anoInicial, mesInicial);
  if (periodos.length === 0) {
    falhar(`${nome}: o PDF não trouxe nenhum fator a partir de ${mesInicial}/${anoInicial}`);
  }

  // Contiguidade: nada lido do PDF pode ficar fora da sequência a partir do início.
  const esperados = new Set(periodos.map(([a, m]) => `${a}-${m}`));
  for (const k of Object.keys(doPdf)) {
    if (!esperados.has(k)) {
      falhar(`${nome}: fator avulso em ${k} — há um buraco na série lida do PDF`);
    }
  }

  // Variação mês a mês dentro de faixa plausível.
  for (let i = 1; i < periodos.length; i++) {
    const [aA, mA] = periodos[i - 1];
    const [aB, mB] = periodos[i];
    const anterior = Number(doPdf[`${aA}-${mA}`]);
    const atualVal = Number(doPdf[`${aB}-${mB}`]);
    const variacao = atualVal / anterior - 1;
    if (variacao < VAR_MIN || variacao > VAR_MAX) {
      falhar(
        `${nome}: variação implausível de ${mA}/${aA} (${anterior}) para ${mB}/${aB} (${atualVal}): ` +
          `${(variacao * 100).toFixed(2)}%`
      );
    }
  }

  if (!atual || !atual[chave]) {
    console.log(`  ${nome}: primeira geração, ${periodos.length} meses.`);
    return { novos: periodos.length };
  }

  const conhecidos = achatar(atual[chave], anoInicial, mesInicial);

  // Nenhum mês já conhecido pode mudar nem sumir.
  let novos = 0;
  for (const [k, v] of Object.entries(conhecidos)) {
    const doArquivo = doPdf[k];
    if (doArquivo === undefined) {
      falhar(`${nome}: o período ${k} existia no repositório e sumiu do PDF`);
    }
    if (Number(doArquivo) !== Number(v)) {
      falhar(
        `${nome}: o fator de ${k} MUDOU — repositório=${v}, PDF=${doArquivo}. ` +
          'Isso exige conferência humana: ou o TJSP revisou a tabela, ou o parser leu a coluna errada.'
      );
    }
  }
  for (const k of Object.keys(doPdf)) {
    if (conhecidos[k] === undefined) novos++;
  }

  const ultimo = periodos[periodos.length - 1];
  console.log(
    `  ${nome}: ${novos > 0 ? `+${novos} mês(es)` : 'sem novidade'}` +
      ` (último: ${String(ultimo[1]).padStart(2, '0')}/${ultimo[0]} = ${doPdf[`${ultimo[0]}-${ultimo[1]}`]})`
  );
  return { novos };
}

function gerarArquivo(dados, urls) {
  const linhas = [];
  linhas.push('/**');
  linhas.push(' * @license');
  linhas.push(' * SPDX-License-Identifier: Apache-2.0');
  linhas.push(' *');
  linhas.push(' * ARQUIVO GERADO — NÃO EDITE À MÃO.');
  linhas.push(' *');
  linhas.push(' * Produzido por `scripts/sync-indices.mjs` a partir das Tabelas Práticas de');
  linhas.push(' * Atualização Monetária publicadas pelo TJSP. Para atualizar, rode:');
  linhas.push(' *');
  linhas.push(' *     node scripts/sync-indices.mjs');
  linhas.push(' *');
  linhas.push(' * O trecho anterior a set/2024 (jan/2024 no caso do IPCA-E) fica congelado em');
  linhas.push(' * `indicesHistoricos.ts`.');
  linhas.push(' */');
  linhas.push('');
  linhas.push("import { SerieIndices } from './serie';");
  linhas.push('');

  for (const serie of SERIES) {
    const { chave, nome, anoInicial, mesInicial } = serie;
    const fatores = dados[chave];
    const periodos = periodosDe(fatores, anoInicial, mesInicial);
    const porAno = new Map();
    for (const [ano, mes] of periodos) {
      if (!porAno.has(ano)) porAno.set(ano, []);
      porAno.get(ano).push(fatores[`${ano}-${mes}`]);
    }

    linhas.push(`/** ${nome}. */`);
    linhas.push(`export const ${chave}: SerieIndices = {`);
    linhas.push(`  nome: ${JSON.stringify(nome)},`);
    linhas.push(`  anoInicial: ${anoInicial},`);
    linhas.push(`  mesInicial: ${mesInicial},`);
    linhas.push('  valores: {');
    for (const [ano, lista] of porAno) {
      const base = ano === anoInicial ? mesInicial : 1;
      const primeiro = MESES[base - 1];
      const ultimo = MESES[base + lista.length - 2];
      linhas.push(`    ${ano}: [${lista.join(', ')}], // ${primeiro} a ${ultimo}`);
    }
    linhas.push('  },');
    linhas.push('};');
    linhas.push('');
  }

  linhas.push('/** Procedência dos dados acima. */');
  linhas.push('export const INDICES_META = {');
  linhas.push(`  geradoEm: ${JSON.stringify(new Date().toISOString().slice(0, 10))},`);
  linhas.push(`  comunicado: ${JSON.stringify(PAGINA_COMUNICADO)},`);
  linhas.push('  arquivos: {');
  for (const serie of SERIES) {
    linhas.push(`    ${serie.chave}: ${JSON.stringify(urls[serie.chave])},`);
  }
  linhas.push('  },');
  linhas.push('} as const;');
  linhas.push('');

  return linhas.join('\n');
}

async function main() {
  console.log('Descobrindo os arquivos publicados pelo TJSP...');
  const urls = await descobrirArquivos();
  for (const serie of SERIES) console.log(`  ${serie.chave}: ${urls[serie.chave]}`);

  const atual = lerGeradoAtual();
  console.log('\nBaixando e conferindo...');

  const dados = {};
  let totalNovos = 0;
  for (const serie of SERIES) {
    const resp = await fetch(urls[serie.chave], {
      headers: { 'User-Agent': 'JurisCalc-SP sync-indices' },
    });
    if (!resp.ok) falhar(`${serie.nome}: download retornou HTTP ${resp.status}`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    if (buffer.subarray(0, 4).toString() !== '%PDF') {
      falhar(`${serie.nome}: o download não é um PDF`);
    }

    const linhas = await extrairLinhas(buffer);
    const fatores = lerGrade(linhas, serie.anoInicial, serie.mesInicial);
    const { novos } = validar(serie, fatores, atual);
    dados[serie.chave] = fatores;
    totalNovos += novos;
  }

  if (totalNovos === 0) {
    console.log('\nNada novo — as tabelas já estão em dia.');
    return;
  }

  if (modoCheck) {
    console.log(`\n${totalNovos} mês(es) novo(s) disponível(is). Rode sem --check para aplicar.`);
    process.exit(1);
  }

  writeFileSync(ARQUIVO_GERADO, gerarArquivo(dados, urls), 'utf8');
  console.log(`\nGravado ${ARQUIVO_GERADO} (+${totalNovos} mês(es)).`);
}

main().catch((e) => falhar(e.stack || String(e)));
