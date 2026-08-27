// Generates all pixel art: splash mountain, starfield tile, the three 320x200
// scene backgrounds, the three 24x36 hero sprites, animated prop strips
// (torch / flask / bird), and the cursor. Run once, outputs are committed:
//   node scripts/gen-pixel-assets.mjs
// ponytail: programmer art — every PNG can be replaced by a hand-drawn export
// with the same dimensions without touching code.
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
function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- palette (issue #45) ---------------------------------------------------
const PALETTE = {
  K: '#000000', F: '#1BAA3B', G: '#57FF57', C: '#4AD7FF', P: '#A64DFF',
  M: '#FF66CC', W: '#F5F5F5', A: '#808080', B: '#A05A2C', U: '#3D4DFF',
}
const RGB = Object.fromEntries(
  Object.entries(PALETTE).map(([k, hex]) => [k, [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))]),
)

// deterministic PRNG so regenerating gives identical art
function prng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 2 ** 32)
}

// ---- tiny paint toolkit ----------------------------------------------------
function Canvas(w, h) {
  const buf = Buffer.alloc(w * h * 4) // starts fully transparent
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= w || y >= h || !c) return
    x |= 0; y |= 0
    const [r, g, b] = RGB[c]
    const i = (y * w + x) * 4
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255
  }
  const get = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return null
    return buf[((y | 0) * w + (x | 0)) * 4 + 3] ? true : null
  }
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c)
  }
  const dither = (x0, y0, x1, y1, a, b) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, (x + y) % 2 ? b : a)
  }
  return { w, h, buf, set, get, rect, dither, png: () => encodePng(w, h, buf) }
}

// frames (same size canvases) -> horizontal strip png
function strip(frames) {
  const { w, h } = frames[0]
  const out = Buffer.alloc(w * frames.length * h * 4)
  frames.forEach((f, i) => {
    for (let y = 0; y < h; y++)
      f.buf.copy(out, (y * w * frames.length + i * w) * 4, y * w * 4, (y + 1) * w * 4)
  })
  return encodePng(w * frames.length, h, out)
}

// whole-canvas 1px downward shift (idle bob second frame)
function shiftDown(c) {
  const out = Canvas(c.w, c.h)
  c.buf.copy(out.buf, c.w * 4, 0, c.w * (c.h - 1) * 4)
  return out
}

// ---- EGA shading toolkit ---------------------------------------------------
// The Sierra look is dithered gradients: a shade value 0..1 mapped through a
// color ramp with a 4x4 ordered-dither threshold deciding between adjacent
// ramp steps. Almost no region should be a flat fill.
// Sierra dither is structured, not stochastic: a region is either a solid
// palette color or an exact 50% checkerboard of two adjacent ramp colors.
// Quantize the shade to that ladder — solid, checker, solid, checker, ...
function ramp(colors, s, x, y) {
  const steps = colors.length * 2 - 1
  const q = Math.min(steps - 1, Math.max(0, Math.round(s * (steps - 1))))
  if (q % 2 === 0) return colors[q / 2]
  return (x + y) % 2 ? colors[(q + 1) / 2] : colors[(q - 1) / 2]
}
const R_STONE = ['K', 'A', 'A', 'W']
const R_GREEN = ['K', 'F', 'F', 'G']
const R_PURPLE = ['K', 'P', 'P', 'M']
const R_WOOD = ['K', 'B', 'B', 'W']
const R_SKY = ['U', 'C', 'C', 'W']

// cheap 2-octave value noise in [0,1], deterministic
function makeNoise(seed) {
  const rnd = prng(seed)
  const grid = Array.from({ length: 64 * 64 }, () => rnd())
  const at = (x, y) => grid[((y & 63) * 64 + (x & 63))]
  const smooth = (x, y, cell) => {
    const gx = x / cell, gy = y / cell
    const x0 = Math.floor(gx), y0 = Math.floor(gy)
    const fx = gx - x0, fy = gy - y0
    const a = at(x0, y0), b = at(x0 + 1, y0), c2 = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1)
    return a + (b - a) * fx + (c2 - a) * fy + (a - b - c2 + d) * fx * fy
  }
  return (x, y, cell = 8) => 0.65 * smooth(x, y, cell) + 0.35 * smooth(x * 2 + 31, y * 2 + 17, cell)
}

// ============================================================================
// SPLASH MOUNTAIN 160x100 — the accepted jagged silhouette (gauntlet G4)
// ============================================================================
function mountain() {
  const c = Canvas(160, 100)
  const peakX = 76, peakY = 12, base = 96
  for (let y = peakY; y <= base; y++) {
    const t = y - peakY
    const wobble = Math.sin(y * 0.55) * 3 + Math.sin(y * 0.21 + 2) * 4
    const half = t * 0.95 + wobble
    for (let x = 0; x < 160; x++) {
      const dx = x - peakX
      if (dx < -half || dx > half * 0.8 + 3) continue
      const even = (x + y) % 2 === 0
      if (t < 12) c.set(x, y, even ? 'W' : 'M')
      else if (dx < -t * 0.3) c.set(x, y, even ? 'M' : 'P')
      else if (dx < t * 0.25) c.set(x, y, even ? 'P' : 'U')
      else c.set(x, y, even ? 'U' : 'K')
    }
  }
  return c.png()
}

// ============================================================================
// STARFIELD TILE 64x64 — clustered like B2's nebula patches, not even speckle
// ============================================================================
function stars() {
  const c = Canvas(64, 64)
  const rnd = prng(42)
  const noise = makeNoise(7)
  for (let i = 0; i < 210; i++) {
    const x = (rnd() * 64) | 0, y = (rnd() * 64) | 0
    // keep only stars falling inside nebula clusters
    if (noise(x, y, 16) < 0.55) continue
    const r = rnd()
    const col = r < 0.6 ? 'U' : r < 0.85 ? 'C' : 'W'
    c.set(x, y, col)
    if (r > 0.92) c.set(x + 1, y, col)
  }
  return c.png()
}

// ============================================================================
// SCENE BACKGROUNDS 320x200 — judged against B8: 3+ depth layers, dither
// everywhere, organic edges, one light direction.
// ============================================================================

// Engineer: torchlit castle hall. Light pools around the two torches.
function engineerBg() {
  const c = Canvas(320, 200)
  const noise = makeNoise(11)
  const rnd = prng(3)
  const WALL_TOP = 22, WALL_BOT = 132
  // torch flame positions (props overlay near these; bake the light in)
  const lights = [[100, 60], [252, 60]]
  const lightAt = (x, y) => {
    let s = 0
    for (const [lx, ly] of lights) {
      const d = Math.hypot(x - lx, (y - ly) * 1.4)
      s += Math.max(0, 1 - d / 95)
    }
    return Math.min(1, s)
  }

  // ceiling: dark wooden beams receding
  for (let y = 0; y < WALL_TOP; y++)
    for (let x = 0; x < 320; x++)
      c.set(x, y, ramp(R_WOOD, 0.1 + noise(x, y, 18) * 0.1 + (y / WALL_TOP) * 0.12, x, y))
  for (let bx = -20; bx < 340; bx += 46)
    for (let y = 0; y < WALL_TOP; y++)
      for (let dx = 0; dx < 5; dx++) c.set(bx + ((y * (bx - 160)) / 400 | 0) + dx, y, ramp(R_WOOD, 0.05 + noise(bx + dx, y) * 0.1, bx + dx, y))

  // back wall: bricks, each individually shaded, lit by the torches
  for (let y = WALL_TOP; y < WALL_BOT; y++) {
    for (let x = 0; x < 320; x++) {
      const row = ((y - WALL_TOP) / 10) | 0
      const off = row % 2 ? 15 : 0
      const brickX = ((x + off) / 30) | 0
      const mortarY = (y - WALL_TOP) % 10 === 0
      const mortarX = (x + off) % 30 === 0
      const brickSeed = noise(brickX * 7, row * 13, 3)
      // model each brick as a lit form: bright top-left edge falling to shadow
      const bxi = ((x + off) % 30) / 30, byi = ((y - WALL_TOP) % 10) / 10
      // macro value planes: ceiling shadow band up top, dusk band at the skirting
      const plane = y < WALL_TOP + 26 ? -0.26 + ((y - WALL_TOP) / 26) * 0.26
        : y > WALL_BOT - 14 ? -0.14 : 0
      let s = 0.18 + plane + brickSeed * 0.12 + lightAt(x, y) * 0.55 + (0.16 - bxi * 0.12 - byi * 0.2)
      if (mortarY || mortarX) s *= 0.4
      c.set(x, y, ramp(R_STONE, s, x, y))
    }
  }
  // wall cracks: dark meandering lines
  for (const [sx, sy, len] of [[40, 40, 45], [285, 90, 35], [190, 110, 25]]) {
    let x = sx, y = sy
    for (let i = 0; i < len; i++) {
      c.set(x, y, 'K')
      y += 1; x += rnd() < 0.5 ? (rnd() < 0.5 ? -1 : 1) : 0
    }
  }

  // pointed-arch window with night sky
  const wx0 = 138, wx1 = 172, wtop = 30, wbot = 88
  for (let y = wtop; y <= wbot; y++) {
    const t = Math.max(0, 1 - (y - wtop) / 22)
    const inset = Math.round(t * t * 15)
    for (let x = wx0 + inset; x <= wx1 - inset; x++) {
      const s = 0.15 + ((y - wtop) / (wbot - wtop)) * 0.25 + noise(x, y, 9) * 0.1
      c.set(x, y, ramp(['K', 'U', 'U', 'C'], s, x, y))
    }
    // stone sill edge
    c.set(wx0 + inset - 1, y, 'K'); c.set(wx1 - inset + 1, y, 'K')
    c.set(wx0 + inset - 2, y, ramp(R_STONE, 0.7, wx0, y))
    c.set(wx1 - inset + 2, y, ramp(R_STONE, 0.35, wx1, y))
  }
  c.set(150, 44, 'W'); c.set(162, 56, 'W'); c.set(145, 66, 'C'); c.set(166, 40, 'W')
  c.rect(wx0 - 2, wbot + 1, wx1 + 2, wbot + 3, 'A') // sill
  c.rect(wx0 - 2, wbot + 4, wx1 + 2, wbot + 4, 'K')

  // hanging banner, tattered, folds shaded
  for (let y = 26; y < 84; y++) {
    for (let x = 186; x <= 208; x++) {
      const fold = Math.sin(x * 0.9) * 0.18
      const tatter = y > 76 && ((x * 7 + 3) % 11 < 4 ? y > 78 : y > 82)
      if (tatter) continue
      c.set(x, y, ramp(['K', 'U', 'U', 'C'], 0.45 + fold + lightAt(x, y) * 0.2, x, y))
    }
  }
  c.rect(184, 24, 210, 26, 'B')
  // emblem: cyan gear-ish diamond
  for (let d = 0; d < 8; d++) { c.rect(197 - d / 2, 42 + d, 197 + d / 2, 42 + d, 'C'); c.rect(197 - d / 2, 58 - d, 197 + d / 2, 58 - d, 'C') }

  // floor: perspective flagstones, vignette to black at bottom corners
  for (let y = WALL_BOT; y < 200; y++) {
    const depth = (y - WALL_BOT) / (200 - WALL_BOT)
    for (let x = 0; x < 320; x++) {
      const cx = (x - 160) / (1 + depth * 1.6)
      const stoneX = ((cx + 400) / 34) | 0
      const rowY = Math.log(1 + depth * 6) * 34
      const stoneRow = (rowY / 9) | 0
      const seed = noise(stoneX * 9, stoneRow * 5, 3)
      const sxi = ((cx + 400) % 34) / 34 // shade across each flagstone
      let s = 0.24 + seed * 0.12 + lightAt(x, y) * 0.34 - depth * 0.16 + (0.14 - sxi * 0.2)
      s -= Math.max(0, (Math.abs(x - 160) / 160) - 0.4) * 0.85 // corner vignette
      const jointX = ((cx + 400) % 34) < 1.2
      if (jointX) s *= 0.4
      c.set(x, y, ramp(R_STONE, s, x, y))
    }
  }
  // floor row joints
  for (const fy of [138, 146, 156, 168, 182, 196])
    for (let x = 0; x < 320; x++) if (noise(x, fy, 4) > 0.25) c.set(x, fy, 'K')
  // cast shadows on the floor: under the desk and the armor pedestal
  const castShadow = (cx2, cy2, rx, ry) => {
    for (let y = cy2 - ry; y <= cy2 + ry; y++) for (let x = cx2 - rx; x <= cx2 + rx; x++) {
      const d = ((x - cx2) / rx) ** 2 + ((y - cy2) / ry) ** 2
      if (d < 1 && (x + y) % 2 === 0) c.set(x, y, 'K')
    }
  }
  castShadow(255, 154, 62, 9)
  castShadow(62, 138, 32, 5)

  // suit of armor on a pedestal, lit from the right torch side
  const ax = 62
  c.rect(ax - 20, 112, ax + 20, 120, 'A')
  for (let x = ax - 20; x <= ax + 20; x++) for (let y = 112; y <= 120; y++)
    c.set(x, y, ramp(R_STONE, 0.5 - (y - 112) * 0.05 + noise(x, y, 4) * 0.1, x, y))
  c.rect(ax - 22, 120, ax + 22, 122, 'K')
  // darkened alcove behind the armor so it pops off the wall
  for (let y = 40; y < 112; y++) for (let x = ax - 22; x <= ax + 22; x++) {
    const d = Math.abs(x - ax) / 22
    if (d < 0.99) c.set(x, y, ramp(['K', 'K', 'A'], 0.25 + d * 0.35 + ((x + y) % 3 === 0 ? 0.1 : 0), x, y))
  }
  const armorShade = (x, lo, hi) => lo + ((x - (ax - 12)) / 24) * (hi - lo) // lit right
  // legs
  for (let y = 88; y < 112; y++) for (const side of [-7, 3]) for (let dx = 0; dx < 5; dx++)
    c.set(ax + side + dx, y, ramp(R_STONE, armorShade(ax + side + dx, 0.25, 0.75) + noise(ax + side + dx, y, 3) * 0.1, ax + side + dx, y))
  // cuirass
  for (let y = 62; y < 88; y++) {
    const half = 12 - Math.max(0, (y - 80) * 0.5)
    for (let x = ax - half; x <= ax + half; x++)
      c.set(x, y, ramp(R_STONE, armorShade(x, 0.3, 0.85) + noise(x, y, 4) * 0.08, x, y))
  }
  c.rect(ax - 13, 60, ax + 13, 62, 'A') // pauldron line
  // helmet with plume
  for (let y = 46; y < 60; y++) {
    const half = y < 52 ? (y - 44) * 1.6 : 9
    for (let x = ax - half; x <= ax + half; x++)
      c.set(x, y, ramp(R_STONE, armorShade(x, 0.35, 0.9), x, y))
  }
  c.rect(ax - 8, 54, ax + 8, 55, 'K') // visor
  for (let i = 0; i < 8; i++) c.set(ax - 2 + (i % 3), 40 + i, i % 2 ? 'M' : 'P') // plume
  // black outline around the armor silhouette so it reads against the stone
  c.rect(ax - 13, 59, ax + 13, 59, 'K'); c.rect(ax - 14, 62, ax - 14, 84, 'K'); c.rect(ax + 14, 62, ax + 14, 84, 'K')
  for (let y = 46; y < 60; y++) { const half = y < 52 ? (y - 44) * 1.6 : 9; c.set(ax - half - 1, y, 'K'); c.set(ax + half + 1, y, 'K') }
  c.rect(ax - 12, 111, ax + 12, 111, 'K')
  // halberd leaning on wall
  for (let y = 34; y < 118; y++) c.set(96 + ((y - 34) / 14 | 0), y, ramp(R_WOOD, 0.5 + noise(96, y, 3) * 0.2, 96, y))
  for (let y = 30; y < 46; y++) { const half = (46 - y) * 0.55; for (let x = 96 - half; x <= 96 + half + 3; x++) c.set(x, y, ramp(R_STONE, 0.6 + (x - 96) * 0.02, x, y)) }

  // desk with retro computer (right, under torch light)
  // desk top: perspective trapezoid
  for (let y = 116; y < 126; y++) {
    const spread = (y - 116) * 1.4
    for (let x = 212 - spread; x <= 302 + spread * 0.4; x++)
      c.set(x, y, ramp(R_WOOD, 0.45 + noise(x * 3, y, 4) * 0.25 + lightAt(x, y) * 0.15, x, y))
  }
  c.rect(200, 126, 306, 127, 'K')
  // legs
  for (const lx of [206, 296]) for (let y = 127; y < 158; y++) for (let dx = 0; dx < 6; dx++)
    c.set(lx + dx, y, ramp(R_WOOD, 0.35 - (y - 127) * 0.004 + (dx < 2 ? 0.15 : 0), lx + dx, y))
  // CRT: beige case, screen with code + scanlines
  for (let y = 74; y < 116; y++) for (let x = 226; x <= 288; x++)
    c.set(x, y, ramp(R_STONE, 0.62 + (x < 232 ? 0.15 : 0) - (y > 108 ? 0.2 : 0) + noise(x, y, 6) * 0.05, x, y))
  c.rect(226, 74, 288, 74, 'W'); c.rect(226, 74, 226, 115, 'W')
  c.rect(288, 74, 288, 115, 'K'); c.rect(226, 115, 288, 115, 'K')
  c.rect(232, 80, 282, 106, 'K')
  for (let y = 82; y < 105; y++) for (let x = 234; x <= 280; x++)
    c.set(x, y, (y % 2) ? ramp(['K', 'C', 'C'], 0.5, x, y) : 'K') // scanlined screen
  for (let i = 0; i < 6; i++) c.rect(236, 84 + i * 3, 236 + 10 + ((i * 17) % 26), 84 + i * 3, 'G')
  c.set(280, 104, 'G') // cursor blink pixel
  // keyboard
  for (let y = 118; y < 124; y++) for (let x = 234 - (y - 118); x <= 280 + (y - 118); x++)
    c.set(x, y, ramp(R_STONE, 0.5 - (y - 118) * 0.05 + ((x % 4) < 1 ? -0.15 : 0), x, y))

  // vines creeping from the ceiling and up the right corner
  const vine = (sx, sy, len, dir) => {
    let x = sx, y = sy
    for (let i = 0; i < len; i++) {
      c.set(x, y, ramp(R_GREEN, 0.35 + noise(x, y, 4) * 0.3, x, y))
      if (rnd() < 0.4) c.set(x + 1, y, ramp(R_GREEN, 0.3, x + 1, y))
      if (rnd() < 0.3) { // leaf cluster
        for (let d = 0; d < 4; d++) c.set(x + ((rnd() * 5) | 0) - 2, y + ((rnd() * 3) | 0) - 1, ramp(R_GREEN, 0.3 + rnd() * 0.4, x + d, y))
      }
      y += dir; x += rnd() < 0.6 ? 0 : rnd() < 0.5 ? -1 : 1
    }
  }
  vine(124, WALL_TOP, 30, 1); vine(180, WALL_TOP, 22, 1); vine(310, 130, 60, -1); vine(14, 130, 46, -1)

  // FOREGROUND framing layer: black arch silhouettes, organic inner edge
  for (let y = 0; y < 200; y++) {
    const wob = noise(4, y, 10) * 6
    const lw = y < 40 ? 18 - y * 0.3 + wob : 6 + wob
    for (let x = 0; x < lw; x++) c.set(x, y, x > lw - 2 ? ramp(['K', 'A'], 0.3, x, y) : 'K')
    const rw = y < 40 ? 18 - y * 0.3 + noise(300, y, 10) * 6 : 6 + noise(300, y, 10) * 6
    for (let x = 0; x < rw; x++) c.set(319 - x, y, x > rw - 2 ? ramp(['K', 'A'], 0.3, x, y) : 'K')
  }
  for (let x = 0; x < 320; x++) { // arch top
    const drop = 8 + Math.pow(Math.abs(x - 160) / 160, 2) * 26 + noise(x, 0, 12) * 5
    for (let y = 0; y < drop; y++) c.set(x, y, y > drop - 2 ? ramp(['K', 'B'], 0.25, x, y) : 'K')
  }
  return c.png()
}

// Alchemist: wizard's lab lit by the cauldron's green glow and the moon.
function alchemistBg() {
  const c = Canvas(320, 200)
  const noise = makeNoise(23)
  const rnd = prng(5)
  const WALL_BOT = 128
  const glow = (x, y) => Math.max(0, 1 - Math.hypot(x - 80, (y - 165) * 1.2) / 110)
  const moonlight = (x, y) => Math.max(0, 1 - Math.hypot(x - 268, y - 40) / 90)

  // wall: purple stone blocks, green-lit near the cauldron, cool near the moon
  for (let y = 0; y < WALL_BOT; y++) {
    for (let x = 0; x < 320; x++) {
      const row = (y / 12) | 0
      const off = row % 2 ? 17 : 0
      const mortar = y % 12 === 0 || (x + off) % 34 === 0
      const seed = noise(((x + off) / 34 | 0) * 11, row * 7, 3)
      const g = glow(x, y)
      // value planes: ceiling shadow above, lit lower wall, per-block modeling
      const bxi = ((x + off) % 34) / 34, byi = (y % 12) / 12
      let s = 0.08 + (y / WALL_BOT) * 0.3 + seed * 0.12 + moonlight(x, y) * 0.48 + g * 0.36
        + (0.16 - bxi * 0.12 - byi * 0.18)
      if (mortar) s *= 0.4
      c.set(x, y, ramp(g > 0.3 ? ['K', 'F', 'P', 'M'] : R_PURPLE, s, x, y))
    }
  }

  // round moon window
  for (let y = 14; y <= 66; y++) for (let x = 240; x <= 296; x++) {
    const d = Math.hypot(x - 268, y - 40)
    if (d > 26 && d < 30) c.set(x, y, ramp(R_STONE, 0.5 - (x - 268) * 0.008 + noise(x, y, 4) * 0.1, x, y))
    else if (d <= 26) {
      const s = 0.2 + (y - 14) / 100 + noise(x, y, 9) * 0.08
      c.set(x, y, ramp(['K', 'U', 'U', 'C'], s, x, y))
    }
  }
  for (let y = 26; y <= 44; y++) for (let x = 262; x <= 282; x++) { // moon disc + craters
    const d = Math.hypot(x - 272, y - 35)
    if (d <= 8) c.set(x, y, ramp(['A', 'W', 'W'], 0.75 - noise(x * 5, y * 5, 3) * 0.5, x, y))
  }
  c.set(250, 52, 'W'); c.set(256, 22, 'C'); c.set(288, 58, 'W')

  // shelves with perspective side boards + varied glassware
  for (const sy of [44, 84]) {
    for (let y = sy; y < sy + 5; y++) for (let x = 22; x <= 152; x++)
      c.set(x, y, ramp(R_WOOD, 0.55 - (y - sy) * 0.1 + noise(x * 2, y, 5) * 0.2, x, y))
    c.rect(22, sy + 5, 152, sy + 6, 'K')
    // cast shadow the shelf throws down the wall
    for (let y = sy + 7; y < sy + 13; y++) for (let x = 24; x <= 150; x++)
      if ((x + y) % 2 === 0 && noise(x, y, 6) > 0.3) c.set(x, y, 'K')
    for (let y = sy + 6; y < sy + 9; y++) for (let x = 22; x <= 30; x++) c.set(x, y, ramp(R_WOOD, 0.3, x, y)) // bracket
    // glassware: round flask, tall tube, jug, twisted retort — varied per slot
    const cols = ['C', 'G', 'M', 'U', 'G', 'C']
    for (let i = 0; i < 6; i++) {
      const gx = 34 + i * 20, col = cols[(i + (sy === 84 ? 3 : 0)) % 6]
      const kind = (i + (sy === 84 ? 1 : 0)) % 3
      if (kind === 0) { // round-bottom flask
        for (let y = sy - 10; y < sy; y++) { const half = Math.min(5, (y - (sy - 12)) * 1.1); for (let x = gx - half; x <= gx + half; x++) c.set(x, y, ramp(['K', col, col], 0.55 + (x - gx) * -0.04, x, y)) }
        c.rect(gx - 1, sy - 15, gx + 1, sy - 10, 'A'); c.set(gx - 3, sy - 7, 'W')
      } else if (kind === 1) { // tall tube
        c.rect(gx - 2, sy - 16, gx + 2, sy - 1, col)
        for (let y = sy - 16; y < sy; y++) c.set(gx - 2, y, 'W')
        c.rect(gx - 3, sy - 17, gx + 3, sy - 16, 'A')
      } else { // fat jug
        for (let y = sy - 9; y < sy; y++) { const half = 4 + Math.sin((y - sy) * 0.7) * 1.5; for (let x = gx - half; x <= gx + half; x++) c.set(x, y, ramp(['K', 'B', col], 0.5 + (x - gx) * -0.05, x, y)) }
        c.rect(gx - 1, sy - 12, gx + 1, sy - 9, 'B')
      }
    }
  }
  // hanging herbs + chain lantern from ceiling
  for (const hx of [176, 196, 214]) {
    for (let y = 0; y < 16 + (hx % 7); y++) c.set(hx, y, 'A')
    for (let i = 0; i < 14; i++) c.set(hx - 3 + ((rnd() * 7) | 0), 14 + (hx % 7) + ((rnd() * 8) | 0), ramp(R_GREEN, 0.25 + rnd() * 0.35, hx + i, i))
  }
  for (let y = 0; y < 22; y += 2) c.set(160, y, 'A')
  c.rect(156, 22, 164, 32, 'B'); c.rect(158, 24, 162, 30, 'M'); c.set(159, 25, 'W')

  // floor: wood planks in perspective, green pool near cauldron
  for (let y = WALL_BOT; y < 200; y++) {
    const depth = (y - WALL_BOT) / (200 - WALL_BOT)
    for (let x = 0; x < 320; x++) {
      const cx = (x - 160) / (1 + depth * 1.5)
      const plank = ((cx + 400) / 26) | 0
      const g = glow(x, y)
      let s = 0.26 + noise(plank * 13, y, 9) * 0.14 + g * 0.5 - depth * 0.14
      s -= Math.max(0, (Math.abs(x - 160) / 160) - 0.42) * 0.8
      if (((cx + 400) % 26) < 1.2) s *= 0.4
      c.set(x, y, ramp(g > 0.35 ? ['K', 'F', 'F', 'G'] : R_WOOD, s, x, y))
    }
  }
  for (const fy of [136, 148, 164, 184]) for (let x = 0; x < 320; x++) if (noise(x, fy, 5) > 0.3) c.set(x, fy, 'K')
  // cast shadows: under the work table and pooling around the cauldron
  const shadowEllipse = (cx2, cy2, rx, ry) => {
    for (let y = cy2 - ry; y <= cy2 + ry; y++) for (let x = cx2 - rx; x <= cx2 + rx; x++) {
      const d = ((x - cx2) / rx) ** 2 + ((y - cy2) / ry) ** 2
      if (d < 1 && (x + y) % 2 === 0) c.set(x, y, 'K')
    }
  }
  shadowEllipse(248, 146, 66, 10)
  shadowEllipse(80, 188, 42, 7)

  // work table (right) with retort and scrolls
  for (let y = 108; y < 118; y++) {
    const spread = (y - 108) * 1.3
    for (let x = 200 - spread; x <= 304 + spread * 0.3; x++)
      c.set(x, y, ramp(R_WOOD, 0.5 + noise(x * 3, y, 4) * 0.2, x, y))
  }
  c.rect(190, 118, 308, 119, 'K')
  for (const lx of [196, 298]) for (let y = 119; y < 152; y++) for (let dx = 0; dx < 6; dx++)
    c.set(lx + dx, y, ramp(R_WOOD, 0.32 + (dx < 2 ? 0.15 : 0), lx + dx, y))
  // retort: round vessel + curved spout into a small flask
  for (let y = 86; y < 106; y++) { const half = Math.min(11, (y - 84) * 1.2); for (let x = 224 - half; x <= 224 + half; x++) c.set(x, y, ramp(['K', 'F', 'G', 'W'], 0.5 - (x - 224) * 0.03 + noise(x, y, 5) * 0.1, x, y)) }
  c.rect(222, 78, 226, 86, 'A')
  for (let i = 0; i < 16; i++) c.set(235 + i, 90 + ((i * i) / 22 | 0), 'A') // spout
  c.rect(248, 100, 256, 107, 'M'); c.set(249, 101, 'W')
  for (const [sx2, sy2] of [[270, 102], [282, 104]]) { for (let x = sx2; x < sx2 + 14; x++) c.set(x, sy2 + ((x - sx2) / 5 | 0), 'W'); c.set(sx2, sy2, 'B'); c.set(sx2 + 13, sy2 + 2, 'B') } // scrolls

  // cauldron: fat pot, glowing brew, rising steam wisps
  for (let y = 148; y < 186; y++) {
    const half = 26 + Math.sin((y - 148) * 0.14) * 8 - Math.max(0, y - 176) * 1.2
    for (let x = 80 - half; x <= 80 + half; x++)
      c.set(x, y, ramp(['K', 'K', 'A'], 0.25 + (x - (80 - half)) / (half * 4) + noise(x, y, 5) * 0.15, x, y))
  }
  for (let x = 52; x <= 108; x++) for (let y = 144; y < 150; y++) c.set(x, y, ramp(R_STONE, 0.4 - (y - 144) * 0.06, x, y)) // rim
  for (let x = 56; x <= 104; x++) for (let y = 140; y < 145; y++)
    c.set(x, y, ramp(['F', 'G', 'G', 'W'], 0.4 + noise(x * 3, y * 3, 3) * 0.5, x, y)) // brew
  for (const [wx2, len] of [[66, 22], [84, 30], [96, 18]]) { // steam
    let x = wx2
    for (let i = 0; i < len; i++) {
      const y = 138 - i
      if (noise(x, y, 3) > 0.35) c.set(x, y, ramp(['F', 'G', 'W'], 0.3 + i / len, x, y))
      x += Math.sin(i * 0.5 + wx2) > 0 ? 1 : -1
    }
  }
  c.rect(46, 186, 114, 188, 'K')

  // FOREGROUND framing: black organic arch + a shadowed shelf edge lower-right
  for (let y = 0; y < 200; y++) {
    const lw = 8 + noise(2, y, 12) * 8 + (y < 30 ? (30 - y) * 0.5 : 0)
    for (let x = 0; x < lw; x++) c.set(x, y, x > lw - 2 ? ramp(['K', 'P'], 0.25, x, y) : 'K')
    const rw = 6 + noise(310, y, 12) * 7 + (y < 30 ? (30 - y) * 0.5 : 0)
    for (let x = 0; x < rw; x++) c.set(319 - x, y, x > rw - 2 ? ramp(['K', 'P'], 0.25, x, y) : 'K')
  }
  for (let x = 0; x < 320; x++) {
    const drop = 6 + Math.pow(Math.abs(x - 160) / 160, 2) * 22 + noise(x, 5, 14) * 6
    for (let y = 0; y < drop; y++) c.set(x, y, y > drop - 2 ? ramp(['K', 'P'], 0.2, x, y) : 'K')
  }
  return c.png()
}

// Leader: the B4 valley — cliffs framing a flower meadow, great tree, peaks.
function leaderBg() {
  const c = Canvas(320, 200)
  const noise = makeNoise(31)
  const rnd = prng(9)

  // sky with dithered clouds
  for (let y = 0; y < 78; y++) for (let x = 0; x < 320; x++) {
    let s = 0.45 + (y / 78) * 0.3
    if (noise(x, y * 2, 20) > 0.62) s += 0.3 // cloud
    c.set(x, y, ramp(R_SKY, s, x, y))
  }

  // far snowy range: jagged, cyan-shadowed snow like B4
  const peaks = [[24, 26], [86, 14], [158, 30], [232, 18], [300, 28]]
  for (const [px, py] of peaks) {
    for (let y = py; y < 102; y++) {
      const t = y - py
      const jag = noise(px, y * 3, 6) * 10
      for (let x = px - t * 1.25 - jag; x <= px + t * 1.15 + jag; x++) {
        const xi = Math.round(x)
        if (xi < 0 || xi > 319) continue
        const snowline = t < 20 + noise(xi * 2, y, 8) * 14
        // model the faces: lit left slope, shaded right slope, ridge shadow line
        const face = (px - xi) * 0.02
        if (snowline) c.set(xi, y, ramp(['U', 'C', 'W', 'W'], 0.55 + face + noise(xi, y, 12) * 0.2, xi, y))
        else c.set(xi, y, ramp(R_STONE, 0.42 + face + noise(xi, y, 12) * 0.15, xi, y))
      }
    }
  }
  // foothill ridge
  for (let x = 0; x < 320; x++) {
    const top = 88 + noise(x, 7, 14) * 10
    for (let y = top; y < 104; y++) c.set(x, y, ramp(['K', 'F', 'F', 'A'], 0.35 + noise(x, y, 6) * 0.25, x, y))
  }

  // organic band boundaries — nothing in nature ends on a ruler line
  const mTop = (x) => 97 + noise(x, 200, 21) * 11
  const gTop = (x) => 141 + noise(x, 240, 17) * 13
  // flower meadow: continuous P/M/W interleave that shimmers like flowers,
  // never resting in a flat band
  for (let x = 0; x < 320; x++) for (let y = mTop(x) | 0; y < gTop(x); y++) {
    let s = 0.18 + ((y - 102) / 46) * 0.35 + noise(x, y, 3) * 0.42
    c.set(x, y, ramp(['K', 'P', 'M', 'M', 'W'], s, x, y))
  }
  for (let i = 0; i < 1100; i++) {
    const x = (rnd() * 320) | 0, y = 102 + ((rnd() * 46) | 0)
    if (noise(x * 2, y * 2, 13) < 0.48) continue // flowers grow in drifts
    const r = rnd()
    c.set(x, y, r < 0.45 ? 'F' : r < 0.7 ? 'W' : r < 0.9 ? 'G' : 'C')
  }
  // blend the foothill->meadow seam with a checker weave along the curve
  for (let x = 0; x < 320; x++) {
    const b = mTop(x) | 0
    for (let y = b; y <= b + 3; y++)
      if ((x + y) % 2 === 0 && noise(x, y, 7) > 0.36) c.set(x, y, 'F')
  }
  // winding path from meadow into foreground
  for (let y = 108; y < 200; y++) {
    const cx = 160 + Math.sin(y * 0.05) * 26
    const half = 3 + (y - 108) * 0.32
    for (let x = cx - half; x <= cx + half; x++)
      c.set(x, y, ramp(['K', 'B', 'B', 'W'], 0.45 + noise(x, y, 4) * 0.25, x, y))
    c.set(cx - half - 1, y, 'K'); c.set(cx + half + 1, y, 'K')
  }

  // foreground grass: brightest mid-band, darkening to the bottom edge
  for (let x = 0; x < 320; x++) for (let y = gTop(x) | 0; y < 200; y++) {
    if (c.get(x, y) && Math.abs(x - (160 + Math.sin(y * 0.05) * 26)) < 4 + (y - 108) * 0.32) continue // keep path
    const band = 1 - Math.abs((y - 162) / 44)
    let s = 0.22 + band * 0.34 + noise(x, y, 3) * 0.34
    c.set(x, y, ramp(['K', 'F', 'F', 'G', 'G'], s, x, y))
  }
  // meadow->grass seam: dither-feathered along the curve
  for (let x = 0; x < 320; x++) {
    const b = gTop(x) | 0
    for (let y = b - 2; y <= b + 2; y++)
      if ((x + y) % 2 === 0 && noise(x + 50, y, 6) > 0.38) c.set(x, y, 'M')
  }
  for (let i = 0; i < 700; i++) {
    const x = (rnd() * 320) | 0, y = 148 + ((rnd() * 52) | 0)
    if (noise(x * 2 + 90, y * 2, 11) < 0.5) continue // tufts cluster
    const r = rnd()
    if (r < 0.75) c.set(x, y, r < 0.4 ? 'G' : 'F')
    else { c.set(x, y, r < 0.9 ? 'W' : 'M'); if (r > 0.96) c.set(x, y + 1, 'F') }
  }

  // framing cliffs left + right, striated, converging on the meadow (B4)
  for (let y = 58; y < 168; y++) {
    const lw = 46 - (y - 58) * 0.34 + noise(3, y, 9) * 10
    for (let x = 0; x < lw; x++) {
      const st = (x + y * 2) % 7 / 7 // shade across each rock stratum
      const strata = ((x + y * 2) / 7) | 0
      c.set(x, y, ramp(['K', 'A', 'P', 'A'], 0.22 + (strata % 3) * 0.14 + (1 - st) * 0.24 + noise(x, y, 14) * 0.08, x, y))
    }
    const rw = 40 - (y - 58) * 0.3 + noise(313, y, 9) * 10
    for (let x = 0; x < rw; x++) {
      const st = (x + y * 2) % 7 / 7
      const strata = ((x + y * 2) / 7) | 0
      c.set(319 - x, y, ramp(['K', 'A', 'P', 'A'], 0.2 + (strata % 3) * 0.14 + (1 - st) * 0.24 + noise(319 - x, y, 14) * 0.08, 319 - x, y))
    }
  }

  // the great tree: grooved trunk, root flare, organic noise canopy
  for (let y = 66; y < 152; y++) {
    const flare = Math.max(0, (y - 138) * 0.6)
    const half = 7 + flare
    for (let x = 159 - half; x <= 159 + half; x++) {
      const groove = noise((x - 159) * 5, y, 4) > 0.6 ? -0.25 : 0
      c.set(x, y, ramp(R_WOOD, 0.45 + (x - 159) * -0.035 + groove, x, y))
    }
  }
  for (let y = 12; y <= 78; y++) for (let x = 92; x <= 226; x++) {
    const dx = (x - 159) / 64, dy = (y - 42) / 30
    const d = dx * dx + dy * dy
    if (d > 1 + (noise(x, y, 10) - 0.5) * 0.5) continue
    let s = 0.5 - dx * 0.28 - dy * 0.15 + noise(x * 2, y * 2, 6) * 0.25
    if (noise(x + 40, y + 60, 7) > 0.68) s = 0.08 // dark leaf clump holes
    c.set(x, y, ramp(R_GREEN, s, x, y))
  }
  c.set(128, 30, 'M'); c.set(134, 31, 'M'); c.set(186, 26, 'M'); c.set(191, 27, 'M') // fruit

  // rune stone
  for (let y = 152; y < 176; y++) {
    const half = 16 - Math.abs(y - 164) * 0.6 + noise(40, y, 5) * 3
    for (let x = 56 - half; x <= 56 + half; x++)
      c.set(x, y, ramp(R_STONE, 0.45 - (x - 56) * 0.02 + noise(x, y, 4) * 0.15, x, y))
  }
  for (const [rx, ry] of [[50, 158], [58, 162], [52, 168], [60, 170]]) c.set(rx, ry, 'K'), c.set(rx + 1, ry, 'K')

  // FOREGROUND: dark organic grass fringe bottom + overhanging leaves top-left
  for (let x = 0; x < 320; x++) {
    const tuft = 4 + noise(x, 99, 5) * 9
    for (let y = 0; y < tuft; y++) c.set(x, 199 - y, y > tuft - 2 ? ramp(['K', 'F'], 0.3, x, y) : 'K')
  }
  for (let x = 0; x < 140; x++) { // overhanging branch, top-left
    const drop = Math.max(0, 26 - x * 0.35) + noise(x, 3, 8) * 12
    for (let y = 0; y < drop; y++) {
      const edge = y > drop - 3
      c.set(x, y, edge ? ramp(['K', 'F', 'F'], 0.4 + noise(x, y, 3) * 0.3, x, y) : 'K')
    }
  }
  for (let x = 200; x < 320; x++) { // and top-right
    const drop = Math.max(0, (x - 200) * 0.16) + noise(x, 90, 9) * 8
    for (let y = 0; y < drop; y++) c.set(x, y, y > drop - 3 ? ramp(['K', 'F'], 0.35, x, y) : 'K')
  }
  return c.png()
}

// ============================================================================
// HERO SPRITES 24x36, 2 frames — shaded, outlined, asymmetric (gauntlet G2)
// ============================================================================
function hero(cls) {
  const c = Canvas(24, 36)
  const tunic = cls === 'alchemist' ? 'P' : 'U'
  const tunicHi = cls === 'alchemist' ? 'M' : 'C'
  // lit-left shading: highlight column, solid base, K-checker shadow edge
  const shade3 = (x0, x1, y, base, hi) => {
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / Math.max(1, x1 - x0)
      c.set(x, y, t < 0.28 ? hi : t > 0.75 ? ((x + y) % 2 ? 'K' : base) : base)
    }
  }
  // head: 7 rows total — QfG proportion, not a paper-doll balloon
  for (let y = 1; y <= 2; y++) shade3(9, 14, y, 'B', 'B') // hair
  c.set(10, 1, 'W'); c.set(11, 1, 'W') // shine
  c.set(9, 3, 'B'); c.set(14, 3, 'B')  // hair sides
  for (let y = 3; y <= 6; y++) shade3(10, 14, y, 'W', 'W') // face
  c.set(14, 4, 'A'); c.set(14, 5, 'A') // shaded cheek
  c.set(11, 4, 'K'); c.set(13, 4, 'K') // eyes
  c.rect(11, 6, 12, 6, 'K')            // mouth
  c.rect(11, 7, 12, 7, 'W')            // neck
  // torso: broad shoulders tapering to belt
  for (let y = 8; y <= 17; y++) {
    const inset = y > 14 ? 1 : 0
    shade3(7 + inset, 16 - inset, y, tunic, tunicHi)
  }
  c.rect(7, 8, 16, 8, tunic) // shoulder line
  // fold shadows so the tunic reads as cloth, not a rectangle
  c.set(10, 12, 'K'); c.set(11, 12, 'K')
  c.set(12, 15, 'K'); c.set(13, 15, 'K')
  c.set(9, 16, 'K')
  // right arm (viewer left) hangs; left arm raised with gear
  for (let y = 9; y <= 17; y++) { c.set(5, y, tunicHi); c.set(6, y, (y % 2) ? tunic : 'K') }
  c.rect(5, 18, 6, 19, 'W') // hand
  for (let y = 9; y <= 12; y++) { c.set(17, y, tunic); c.set(18, y, (y % 2) ? 'K' : tunic) }
  c.rect(18, 12, 19, 13, tunic)
  c.rect(19, 11, 20, 12, 'W') // raised hand
  // belt + buckle
  for (let x = 8; x <= 15; x++) c.set(x, 18, (x + 18) % 2 ? 'K' : 'B')
  c.set(11, 18, 'W'); c.set(12, 18, 'B')
  // legs: long, stance apart, left leg a step forward
  for (let y = 19; y <= 29; y++) { shade3(8, 10, y, 'M', 'M'); c.set(10, y, (y % 2) ? 'K' : 'M') }
  for (let y = 20; y <= 30; y++) { shade3(13, 15, y, 'M', 'M'); c.set(15, y, (y % 2) ? 'K' : 'M') }
  // boots with lit top edge
  c.rect(7, 30, 10, 33, 'K'); c.rect(7, 30, 9, 30, 'A')
  c.rect(13, 31, 16, 34, 'K'); c.rect(13, 31, 15, 31, 'A')
  // class gear
  if (cls === 'engineer') {
    for (let y = 5; y <= 11; y++) c.set(20, y, 'A') // wrench shaft in raised hand
    c.set(19, 4, 'A'); c.set(21, 4, 'A'); c.set(19, 3, 'A'); c.set(21, 3, 'A'); c.set(20, 5, 'W')
    c.set(8, 18, 'A'); c.set(8, 19, 'A') // tool pouch
  }
  if (cls === 'alchemist') {
    for (let y = 0; y <= 3; y++) { const half = 1 + y; c.rect(12 - half, y, 11 + half, y, 'P'); c.set(12 - half, y, 'M') } // hood
    c.rect(10, 0, 13, 0, 'P')
    c.rect(19, 8, 21, 11, 'G'); c.set(19, 8, 'W'); c.set(20, 7, 'A') // glowing flask
    c.set(18, 9, 'G'); c.set(22, 10, 'G') // glow flecks
  }
  if (cls === 'leader') {
    for (let y = 0; y <= 9; y++) c.set(21, y, 'W') // sword on shoulder
    c.rect(20, 10, 22, 10, 'B'); c.set(21, 11, 'B')
    // cape: solid tapered sheet off the shoulder, lit edge on the left
    c.rect(4, 9, 6, 9, 'F') // clasp to shoulder
    for (let y = 10; y <= 26; y++) {
      const wdt = y < 18 ? 2 : 1
      for (let dx = 0; dx <= wdt; dx++) c.set(2 + dx, y, dx === 0 ? 'G' : 'F')
    }
  }
  // 1px black outline around the whole silhouette
  const outline = []
  for (let y = 0; y < 36; y++) for (let x = 0; x < 24; x++) {
    if (c.get(x, y)) continue
    if (c.get(x + 1, y) || c.get(x - 1, y) || c.get(x, y + 1) || c.get(x, y - 1)) outline.push([x, y])
  }
  for (const [x, y] of outline) c.set(x, y, 'K')
  return c
}

// ============================================================================
// ANIMATED PROPS
// ============================================================================
function torch() { // 12x28, 3 frames
  return [0, 1, 2].map((f) => {
    const c = Canvas(12, 28)
    c.rect(5, 16, 7, 26, 'B')
    c.rect(4, 26, 8, 27, 'A')
    c.rect(4, 14, 8, 16, 'A')
    const flick = [0, 1, -1][f]
    c.rect(4, 8 + flick, 8, 13, 'M')
    c.rect(5, 5 + flick, 7, 9 + flick, 'M')
    c.rect(5, 9 + flick, 7, 13, 'W')
    c.set(6, 3 + flick, 'M')
    if (f === 1) c.set(3, 10, 'M')
    if (f === 2) c.set(9, 9, 'M')
    return c
  })
}

function flask() { // 16x24, 3 frames
  return [0, 1, 2].map((f) => {
    const c = Canvas(16, 24)
    c.rect(6, 4, 9, 10, 'A')
    c.rect(3, 10, 12, 21, 'G')
    c.rect(3, 10, 3, 21, 'W')
    c.rect(2, 21, 13, 22, 'K')
    const ys = [[18, 14], [15, 11], [12, 7]][f]
    c.set(6, ys[0], 'W'); c.set(9, ys[1], 'W')
    if (f === 2) c.set(7, 2, 'G')
    return c
  })
}

function bird() { // 16x10, 2 frames
  return [0, 1].map((f) => {
    const c = Canvas(16, 10)
    c.rect(6, 4, 9, 5, 'K')
    c.set(10, 4, 'K')
    if (f === 0) { c.rect(2, 1, 5, 3, 'K'); c.rect(10, 1, 13, 3, 'K') }
    else { c.rect(2, 6, 5, 8, 'K'); c.rect(10, 6, 13, 8, 'K') }
    return c
  })
}

// ---- cursor 12x18 ----------------------------------------------------------
function cursor() {
  const c = Canvas(12, 18)
  const rows = [
    'K...........', 'KK..........', 'KWK.........', 'KWWK........', 'KWWWK.......',
    'KWWWWK......', 'KWWWWWK.....', 'KWWWWWWK....', 'KWWWWWWWK...', 'KWWWWWWWWK..',
    'KWWWWWKKKKK.', 'KWWKWWK.....', 'KWK.KWWK....', 'KK..KWWK....', 'K....KWWK...',
    '.....KWWK...', '......KK....', '............',
  ]
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && c.set(x, y, ch)))
  return c.png()
}

// ---- write everything ------------------------------------------------------
mkdirSync(OUT, { recursive: true })
const write = (name, data) => { writeFileSync(join(OUT, name), data); console.log(name) }

write('mountain.png', mountain())
write('stars.png', stars())
write('bg-engineer.png', engineerBg())
write('bg-alchemist.png', alchemistBg())
write('bg-leader.png', leaderBg())
for (const cls of ['engineer', 'alchemist', 'leader']) {
  const f1 = hero(cls)
  write(`${cls}.png`, strip([f1, shiftDown(f1)]))
}
write('torch.png', strip(torch()))
write('flask.png', strip(flask()))
write('bird.png', strip(bird()))
write('cursor.png', cursor())
