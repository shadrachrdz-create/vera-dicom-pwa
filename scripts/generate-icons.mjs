// Genera los iconos de la PWA sin descargar recursos ni usar imagenes externas.
import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c >>> 0;
}
function chunk(name, data) {
  const type = Buffer.from(name);
  let crc = 0xffffffff;
  for (const b of Buffer.concat([type, data])) crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([len, type, data, checksum]);
}
function icon(size) {
  const scanline = size * 4 + 1;
  const pixels = Buffer.alloc(scanline * size);
  const gold = [211, 188, 132, 255];
  const green = [16, 47, 41, 255];
  const nearLine = (x, y, ax, ay, bx, by, width) => {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) < width;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const X = x / size, Y = y / size;
      const border = X > .06 && X < .94 && Y > .06 && Y < .94 && (X < .075 || X > .925 || Y < .075 || Y > .925);
      const v = nearLine(X,Y,.19,.29,.37,.72,.03) || nearLine(X,Y,.37,.72,.55,.29,.03);
      const d = nearLine(X,Y,.63,.28,.63,.72,.03) || (X >= .63 && X <= .85 && Math.abs(Math.hypot((X-.62)/.27,(Y-.5)/.22)-1) < .14 && X >= .65);
      const color = border || v || d ? gold : green;
      pixels.set(color, y*scanline + 1 + x*4);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size,0); header.writeUInt32BE(size,4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR',header), chunk('IDAT',deflateSync(pixels, { level: 9 })), chunk('IEND',Buffer.alloc(0))]);
}
await mkdir(new URL('../public/icons/',import.meta.url), { recursive: true });
for (const size of [192,512]) {
  await writeFile(new URL(`../public/icons/icon-${size}.png`,import.meta.url), icon(size));
}
