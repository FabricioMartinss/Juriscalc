/**
 * Gerador de ícones da extensão (PNG) sem dependências externas.
 * Desenha a marca JudsCalc SP — balança (cyan #22d3ee) sobre fundo navy (#0b2545),
 * com cantos arredondados. Renderiza em 4x (supersampling) e reduz por média,
 * gerando bordas suaves. Saída: extension-src/icons/icon{16,32,48,128}.png
 *
 * Uso: node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../extension-src/icons');

const NAVY = [11, 37, 69];    // #0b2545
const CYAN = [34, 211, 238];  // #22d3ee

// ---- Geometria em coordenadas normalizadas (0..1) ----
const dist = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);

function inRoundRect(nx, ny, rr) {
  const ax = nx < rr ? rr - nx : nx > 1 - rr ? nx - (1 - rr) : 0;
  const ay = ny < rr ? rr - ny : ny > 1 - rr ? ny - (1 - rr) : 0;
  return ax * ax + ay * ay <= rr * rr;
}

// Balança da justiça montada com primitivas simples.
function inGlyph(nx, ny) {
  const post = nx >= 0.46 && nx <= 0.54 && ny >= 0.24 && ny <= 0.72;
  const knob = dist(nx, ny, 0.5, 0.2) <= 0.055;
  const beam = ny >= 0.26 && ny <= 0.305 && nx >= 0.17 && nx <= 0.83;
  const hangerL = nx >= 0.185 && nx <= 0.215 && ny >= 0.3 && ny <= 0.43;
  const hangerR = nx >= 0.785 && nx <= 0.815 && ny >= 0.3 && ny <= 0.43;
  const panL = (() => { const d = dist(nx, ny, 0.2, 0.42); return d >= 0.095 && d <= 0.125 && ny >= 0.42 && ny <= 0.55; })();
  const panR = (() => { const d = dist(nx, ny, 0.8, 0.42); return d >= 0.095 && d <= 0.125 && ny >= 0.42 && ny <= 0.55; })();
  const base = ny >= 0.72 && ny <= 0.78 && nx >= 0.34 && nx <= 0.66;
  return post || knob || beam || hangerL || hangerR || panL || panR || base;
}

function renderRGBA(size) {
  const SS = 4; // supersampling
  const R = size * SS;
  const rr = 0.22; // raio dos cantos (normalizado)
  // acumuladores por pixel final
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const nx = (px * SS + sx + 0.5) / R;
          const ny = (py * SS + sy + 0.5) / R;
          if (!inRoundRect(nx, ny, rr)) continue; // fora → transparente
          const c = inGlyph(nx, ny) ? CYAN : NAVY;
          r += c[0]; g += c[1]; b += c[2]; a += 255;
        }
      }
      const n = SS * SS;
      const idx = (py * size + px) * 4;
      // média (alpha premultiplicado corretamente: cor só onde há cobertura)
      const cover = a / 255;
      buf[idx] = cover ? Math.round(r / (cover)) : 0;
      buf[idx + 1] = cover ? Math.round(g / (cover)) : 0;
      buf[idx + 2] = cover ? Math.round(b / (cover)) : 0;
      buf[idx + 3] = Math.round(a / n);
    }
  }
  return buf;
}

// ---- Codificação PNG (RGBA, 8 bits) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  // 10,11,12 = 0 (compression, filter, interlace)
  // scanlines com filtro 0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- Main ----
mkdirSync(OUT_DIR, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const png = encodePNG(size, renderRGBA(size));
  const file = path.join(OUT_DIR, `icon${size}.png`);
  writeFileSync(file, png);
  console.log(`ok  ${path.relative(path.resolve(__dirname, '..'), file)}  (${png.length} bytes)`);
}
console.log('Ícones gerados.');
