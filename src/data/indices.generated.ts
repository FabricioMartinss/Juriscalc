/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ARQUIVO GERADO — NÃO EDITE À MÃO.
 *
 * Produzido por `scripts/sync-indices.mjs` a partir das Tabelas Práticas de
 * Atualização Monetária publicadas pelo TJSP. Para atualizar, rode:
 *
 *     node scripts/sync-indices.mjs
 *
 * O trecho anterior a set/2024 (jan/2024 no caso do IPCA-E) fica congelado em
 * `indicesHistoricos.ts`.
 */

import { SerieIndices } from './serie';

/** Nova Tabela Prática (Lei nº 14.905/2024 — IPCA-15). */
export const SERIE_NOVA: SerieIndices = {
  nome: "Nova Tabela Prática (Lei nº 14.905/2024 — IPCA-15)",
  anoInicial: 2024,
  mesInicial: 9,
  valores: {
    2024: [96.094702, 96.219625, 96.739210, 97.338993], // SET a DEZ
    2025: [97.669945, 97.777381, 98.980042, 99.613514, 100.041852, 100.402002, 100.663047, 100.995235, 100.853841, 101.337939, 101.520347, 101.723387], // JAN a DEZ
    2026: [101.977695, 102.181650, 103.039975, 103.493350, 104.414440, 105.061809, 105.492562, 105.555857], // JAN a AGO
  },
};

/** Antiga Tabela Prática (INPC). */
export const SERIE_ANTIGA: SerieIndices = {
  nome: "Antiga Tabela Prática (INPC)",
  anoInicial: 2024,
  mesInicial: 9,
  valores: {
    2024: [95.778191, 96.237926, 96.824977, 97.144499], // SET a DEZ
    2025: [97.610792, 97.610792, 99.055431, 99.560613, 100.038503, 100.388637, 100.619530, 100.830831, 100.619086, 101.142305, 101.172647, 101.202998], // JAN a DEZ
    2026: [101.415524, 101.811044, 102.381185, 103.312853, 104.149687, 104.826659, 104.973416], // JAN a JUL
  },
};

/** Tabela Prática IPCA-E. */
export const SERIE_IPCA_E: SerieIndices = {
  nome: "Tabela Prática IPCA-E",
  anoInicial: 2024,
  mesInicial: 1,
  valores: {
    2024: [7.600631, 7.624192, 7.683660, 7.711321, 7.727514, 7.761515, 7.791784, 7.815159, 7.830007, 7.840186, 7.882523, 7.931394], // JAN a DEZ
    2025: [7.958360, 7.967114, 8.065109, 8.116725, 8.151626, 8.180971, 8.202241, 8.229308, 8.217786, 8.257231, 8.272094, 8.288638], // JAN a DEZ
    2026: [8.309359, 8.325977, 8.395915, 8.432857, 8.507909, 8.560658, 8.595756, 8.600913], // JAN a AGO
  },
};

/** Procedência dos dados acima. */
export const INDICES_META = {
  geradoEm: "2026-08-04",
  comunicado: "https://www.tjsp.jus.br/PrimeiraInstancia/CalculosJudiciais/Comunicado?codigoComunicado=2524&pagina=1",
  arquivos: {
    SERIE_NOVA: "https://api.tjsp.jus.br/Handlers/Handler/FileFetch.ashx?codigo=195452",
    SERIE_ANTIGA: "https://api.tjsp.jus.br/Handlers/Handler/FileFetch.ashx?codigo=195451",
    SERIE_IPCA_E: "https://api.tjsp.jus.br/Handlers/Handler/FileFetch.ashx?codigo=195450",
  },
} as const;
