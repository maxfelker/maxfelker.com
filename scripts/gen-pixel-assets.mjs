// Generates the pixel art: character sprite strips (ASCII grids below), the
// splash-screen mountain, and the cursor. Run once, outputs are committed:
//   node scripts/gen-pixel-assets.mjs
// ponytail: programmer art — each PNG can be replaced by a hand-drawn Aseprite
// export with the same dimensions without touching any code.
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/pixel')

// ---- minimal PNG encoder (RGBA, 8-bit) ------------------------------------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4)
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- the issue #45 palette -------------------------------------------------
const PALETTE = {
  K: '#000000', F: '#1BAA3B', G: '#57FF57', C: '#4AD7FF', P: '#A64DFF',
  M: '#FF66CC', W: '#F5F5F5', A: '#808080', B: '#A05A2C', U: '#3D4DFF',
}
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

// grid: array of strings; '.'=transparent, letters=palette (after per-sprite remap)
function gridToRgba(grid, w, h, remap = {}) {
  const buf = Buffer.alloc(w * h * 4)
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = remap[row[x]] ?? row[x]
      if (ch === '.') continue
      const [r, g, b] = rgb(PALETTE[ch])
      const i = (y * w + x) * 4
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255
    }
  })
  return buf
}

// frames side by side -> horizontal strip
function strip(frames, w, h, remap) {
  const buf = Buffer.alloc(w * frames.length * h * 4)
  frames.forEach((grid, f) => {
    const fr = gridToRgba(grid, w, h, remap)
    for (let y = 0; y < h; y++)
      fr.copy(buf, (y * w * frames.length + f * w) * 4, y * w * 4, (y + 1) * w * 4)
  })
  return png(w * frames.length, h, buf)
}

// ---- character template, 16x24 ---------------------------------------------
// H=hair, T=tunic, L=legs (remapped per class), W=skin, B=boots
const HERO = [
  '................',
  '................',
  '....HHHHHHH.....',
  '...HHHHHHHHH....',
  '...HHHHHHHHH....',
  '...KWWWWWWWK....',
  '...KWKWWWKWK....',
  '...KWWWWWWWK....',
  '....KWWWWWK.....',
  '.....KWWWK......',
  '...KTTTTTTTK....',
  '..KTTTTTTTTTK...',
  '..KWTTTTTTTWK...',
  '..KWTTTTTTTWK...',
  '..KTTTTTTTTTK...',
  '...KTTTTTTTK....',
  '...KLLLLLLLK....',
  '....KLLLLLK.....',
  '....KLL.LLK.....',
  '....KLL.LLK.....',
  '....KLL.LLK.....',
  '....KBB.BBK.....',
  '....KBB.BBK.....',
  '....KKK.KKK.....',
]
// idle frame 2: whole body bobs down one pixel
const bob = (g) => ['.'.repeat(16), ...g.slice(0, -1)]

// alchemist wears a pointed hood over the hair rows
const hooded = (g) => {
  const out = [...g]
  out[1] = '.......H........'
  out[2] = '......HHH.......'
  out[3] = '....HHHHHHH.....'
  out[4] = '...HHHHHHHHH....'
  return out
}
// leader wears a bright headband
const banded = (g) => {
  const out = [...g]
  out[4] = '...GGGGGGGGG....'
  return out
}

const CLASSES = {
  engineer:  { grid: HERO,         remap: { H: 'B', T: 'C', L: 'U' } },
  alchemist: { grid: hooded(HERO), remap: { H: 'P', T: 'P', L: 'A' } },
  leader:    { grid: banded(HERO), remap: { H: 'B', T: 'F', L: 'B' } },
}

// ---- splash mountain, 160x100 (Sierra "presents" style) --------------------
function mountain() {
  const w = 160, h = 100
  const buf = Buffer.alloc(w * h * 4)
  const put = (x, y, hex) => {
    const [r, g, b] = rgb(hex)
    const i = (y * w + x) * 4
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255
  }
  const peakX = 76, peakY = 12, base = 96
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      put(x, y, PALETTE.K)
      if (y < peakY || y > base) continue
      // jagged edge: slope wobbles with a couple of sine terms
      const t = y - peakY
      const wobble = Math.sin(y * 0.55) * 3 + Math.sin(y * 0.21 + 2) * 4
      const half = t * 0.95 + wobble
      const dx = x - peakX
      if (dx < -half || dx > half * 0.8 + 3) continue
      const checker = (x + y) % 2 === 0
      // snow cap → magenta face → purple/blue dithered shadow side
      if (t < 12) put(x, y, checker ? PALETTE.W : PALETTE.M)
      else if (dx < -t * 0.3) put(x, y, checker ? PALETTE.M : PALETTE.P) // lit face
      else if (dx < t * 0.25) put(x, y, checker ? PALETTE.P : PALETTE.U) // shadow
      else put(x, y, checker ? PALETTE.U : PALETTE.K) // dark edge
    }
  }
  return png(w, h, buf)
}

// ---- cursor, 12x18 classic arrow -------------------------------------------
const CURSOR = [
  'K...........',
  'KK..........',
  'KWK.........',
  'KWWK........',
  'KWWWK.......',
  'KWWWWK......',
  'KWWWWWK.....',
  'KWWWWWWK....',
  'KWWWWWWWK...',
  'KWWWWWWWWK..',
  'KWWWWWKKKKK.',
  'KWWKWWK.....',
  'KWK.KWWK....',
  'KK..KWWK....',
  'K....KWWK...',
  '.....KWWK...',
  '......KK....',
  '............',
]

mkdirSync(OUT, { recursive: true })
for (const [name, { grid, remap }] of Object.entries(CLASSES)) {
  writeFileSync(join(OUT, `${name}.png`), strip([grid, bob(grid)], 16, 24, remap))
  console.log(`${name}.png  16x24 x2 frames`)
}
writeFileSync(join(OUT, 'mountain.png'), mountain())
writeFileSync(join(OUT, 'cursor.png'), png(12, 18, gridToRgba(CURSOR, 12, 18)))
console.log('mountain.png 160x100\ncursor.png 12x18')
