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
    const [r, g, b] = RGB[c]
    const i = (y * w + x) * 4
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255
  }
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c)
  }
  // 2-color checker dither, the core EGA shading trick
  const dither = (x0, y0, x1, y1, a, b) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, (x + y) % 2 ? b : a)
  }
  return { w, h, buf, set, rect, dither, png: () => encodePng(w, h, buf) }
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

// ============================================================================
// SPLASH MOUNTAIN 160x100 — asymmetric, jagged, Sierra-logo style
// ============================================================================
// The jagged sine-wobble silhouette the issue's splash reference shows.
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
      if (t < 12) c.set(x, y, even ? 'W' : 'M')                // snow cap
      else if (dx < -t * 0.3) c.set(x, y, even ? 'M' : 'P')    // lit face
      else if (dx < t * 0.25) c.set(x, y, even ? 'P' : 'U')    // mid
      else c.set(x, y, even ? 'U' : 'K')                        // shadow edge
    }
  }
  return c.png()
}

// ============================================================================
// STARFIELD TILE 64x64 — transparent over black, blue/white speckle
// ============================================================================
function stars() {
  const c = Canvas(64, 64)
  const rnd = prng(42)
  for (let i = 0; i < 46; i++) {
    const x = (rnd() * 64) | 0, y = (rnd() * 64) | 0
    const r = rnd()
    const col = r < 0.6 ? 'U' : r < 0.85 ? 'C' : 'W'
    c.set(x, y, col)
    if (r > 0.92) c.set(x + 1, y, col) // occasional double
  }
  return c.png()
}

// ============================================================================
// HERO SPRITES 24x36, 2 frames — QfG-style: blue tunic, magenta pants, boots
// ============================================================================
function hero(cls) {
  const c = Canvas(24, 36)
  const tunic = cls === 'alchemist' ? 'P' : 'U'
  // head
  c.rect(8, 2, 15, 5, 'B')            // hair
  c.rect(8, 5, 15, 10, 'W')           // face
  c.rect(7, 5, 7, 9, 'B'); c.rect(16, 5, 16, 9, 'B') // hair sides
  c.set(10, 7, 'K'); c.set(13, 7, 'K')               // eyes
  c.rect(11, 9, 12, 9, 'K')                           // mouth
  c.rect(10, 11, 13, 11, 'W')                         // neck
  // torso + arms
  c.rect(7, 12, 16, 22, tunic)
  c.rect(5, 13, 6, 21, tunic); c.rect(17, 13, 18, 21, tunic) // arms
  c.rect(6, 12, 6, 22, 'K'); c.rect(17, 12, 17, 22, 'K')     // arm seams
  c.rect(5, 22, 6, 23, 'W'); c.rect(17, 22, 18, 23, 'W')     // hands
  c.rect(7, 23, 16, 23, 'B')                                  // belt
  c.set(11, 23, 'K'); c.set(12, 23, 'K')                      // buckle
  // legs + boots
  c.rect(8, 24, 10, 30, 'M'); c.rect(13, 24, 15, 30, 'M')
  c.rect(7, 31, 10, 34, 'K'); c.rect(13, 31, 16, 34, 'K')
  // class trims
  if (cls === 'engineer') {
    // wrench in right hand
    c.rect(20, 14, 20, 22, 'A')
    c.set(19, 13, 'A'); c.set(21, 13, 'A'); c.set(20, 12, 'A')
    c.rect(19, 22, 21, 23, 'A')
  }
  if (cls === 'alchemist') {
    // hood over the hair
    c.rect(7, 4, 16, 5, 'P'); c.rect(8, 2, 15, 3, 'P')
    c.rect(10, 0, 13, 1, 'P'); c.set(11, 0, 'P')
    // glowing flask in left hand
    c.rect(2, 18, 3, 19, 'C'); c.rect(1, 20, 4, 23, 'C')
    c.set(2, 17, 'W')
  }
  if (cls === 'leader') {
    c.rect(8, 4, 15, 4, 'G') // headband
    // cape behind left side
    c.rect(3, 13, 4, 27, 'F')
    // sword held at right
    c.rect(21, 10, 21, 21, 'W')
    c.rect(20, 22, 22, 22, 'B'); c.set(21, 23, 'B')
  }
  return c
}

// ============================================================================
// SCENE BACKGROUNDS 320x200
// ============================================================================

// Engineer: castle hall — brick wall, armor, torch bracket, desk with retro computer
function engineerBg() {
  const c = Canvas(320, 200)
  // brick wall
  c.dither(0, 0, 319, 139, 'A', 'A')
  for (let y = 0; y < 140; y += 10) {
    c.rect(0, y, 319, y, 'K')
    const off = (y / 10) % 2 ? 14 : 0
    for (let x = off; x < 320; x += 28) c.rect(x, y, x, y + 9, 'K')
  }
  // shade upper wall
  c.dither(0, 0, 319, 30, 'K', 'A')
  // arrow-slit window with night sky
  c.rect(140, 20, 156, 60, 'K')
  c.rect(142, 22, 154, 58, 'U')
  c.set(146, 30, 'W'); c.set(150, 42, 'C'); c.set(145, 50, 'W')
  // stone floor
  c.dither(0, 140, 319, 199, 'A', 'K')
  for (let y = 145; y < 200; y += 12) c.rect(0, y, 319, y, 'K')
  c.rect(0, 140, 319, 141, 'K')
  c.rect(0, 142, 319, 142, 'W') // horizon highlight
  // suit of armor, left
  c.rect(52, 62, 76, 66, 'K')          // plinth shadow later
  c.rect(58, 50, 70, 58, 'A')          // helmet
  c.rect(58, 54, 70, 55, 'K')          // visor
  c.set(59, 50, 'W'); c.set(60, 49, 'W')
  c.rect(54, 60, 74, 84, 'A')          // cuirass
  c.rect(54, 60, 74, 61, 'W')
  c.rect(52, 62, 53, 80, 'A'); c.rect(75, 62, 76, 80, 'A') // pauldrons/arms
  c.rect(56, 86, 62, 104, 'A'); c.rect(66, 86, 72, 104, 'A') // legs
  c.rect(54, 104, 76, 108, 'K')        // sabatons
  c.rect(46, 108, 84, 116, 'A')        // pedestal
  c.rect(46, 108, 84, 109, 'W')
  c.rect(44, 116, 86, 118, 'K')
  // halberd
  c.rect(88, 40, 89, 110, 'B')
  c.rect(84, 36, 93, 44, 'A'); c.rect(86, 32, 91, 36, 'A')
  // desk with retro computer, right
  c.rect(210, 108, 300, 114, 'B')      // desktop
  c.rect(210, 108, 300, 108, 'W')
  c.rect(214, 114, 220, 150, 'B'); c.rect(290, 114, 296, 150, 'B') // legs
  c.rect(230, 70, 282, 106, 'W')       // beige tower/monitor shell
  c.rect(230, 70, 282, 71, 'K'); c.rect(230, 106, 282, 106, 'K')
  c.rect(230, 70, 231, 106, 'K'); c.rect(281, 70, 282, 106, 'K')
  c.rect(236, 76, 276, 98, 'K')        // bezel
  c.rect(238, 78, 274, 96, 'C')        // screen
  for (let i = 0; i < 5; i++) c.rect(241, 81 + i * 3, 241 + 8 + i * 4, 81 + i * 3, 'G') // code lines
  c.rect(240, 100, 272, 103, 'A')      // keyboard
  // wall banner
  c.rect(180, 24, 196, 64, 'U')
  c.rect(180, 24, 196, 26, 'B')
  c.rect(186, 34, 190, 50, 'C')
  return c.png()
}

// Alchemist: wizard's lab — purple wall, shelves of vials, table with flasks
function alchemistBg() {
  const c = Canvas(320, 200)
  c.dither(0, 0, 319, 129, 'P', 'K') // gloomy wall
  // moon window
  c.rect(240, 18, 280, 54, 'K')
  c.rect(244, 22, 276, 50, 'U')
  c.rect(262, 26, 270, 34, 'W') // moon
  c.set(250, 40, 'C'); c.set(256, 30, 'W')
  // shelves
  for (const sy of [46, 86]) {
    c.rect(30, sy, 170, sy + 4, 'B')
    c.rect(30, sy, 170, sy, 'W')
    c.rect(30, sy + 4, 170, sy + 5, 'K')
    // vials on shelf
    const cols = ['C', 'G', 'M', 'U', 'C', 'G']
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 22
      c.rect(x, sy - 14, x + 6, sy - 1, cols[i])
      c.rect(x + 2, sy - 17, x + 4, sy - 14, 'A') // cork/neck
      c.set(x + 1, sy - 12, 'W') // glint
    }
  }
  // floor
  c.dither(0, 130, 319, 199, 'K', 'A')
  c.rect(0, 130, 319, 131, 'K')
  c.rect(0, 132, 319, 132, 'P') // horizon accent
  // work table
  c.rect(200, 100, 300, 108, 'B')
  c.rect(200, 100, 300, 100, 'W')
  c.rect(204, 108, 210, 148, 'B'); c.rect(290, 108, 296, 148, 'B')
  // big retort on table
  c.rect(214, 84, 226, 98, 'G')  // round vessel
  c.rect(218, 76, 222, 84, 'A')  // neck
  c.set(215, 86, 'W')
  // second flask
  c.rect(240, 88, 252, 98, 'M')
  c.rect(244, 80, 248, 88, 'A')
  c.set(241, 90, 'W')
  // cauldron on floor
  c.rect(60, 156, 100, 180, 'K')
  c.rect(58, 152, 102, 158, 'A')
  c.rect(64, 148, 96, 152, 'F') // brew surface
  c.rect(56, 180, 104, 182, 'K')
  return c.png()
}

// Leader: the QfG valley — sky, snowy peaks, great tree, flower meadow
function leaderBg() {
  const c = Canvas(320, 200)
  const rnd = prng(99)
  c.rect(0, 0, 319, 79, 'C') // sky
  c.dither(0, 0, 319, 14, 'C', 'U') // high sky
  // snowy mountain range
  const peaks = [[30, 30], [95, 18], [170, 34], [240, 22], [300, 30]]
  for (const [px, py] of peaks) {
    for (let y = py; y < 100; y++) {
      const t = y - py
      for (let x = px - t * 1.3; x <= px + t * 1.3; x++) {
        const xi = Math.round(x)
        if (xi < 0 || xi > 319) continue
        const even = (xi + y) % 2 === 0
        if (t < 10) c.set(xi, y, even ? 'W' : 'A')          // snow cap
        else if (xi < px) c.set(xi, y, even ? 'A' : 'W')    // lit
        else c.set(xi, y, even ? 'A' : 'K')                 // shade
      }
    }
  }
  // foothills
  c.dither(0, 88, 319, 99, 'F', 'A')
  // flower meadow band
  c.dither(0, 100, 319, 144, 'M', 'P')
  for (let i = 0; i < 260; i++) {
    const x = (rnd() * 320) | 0, y = 100 + ((rnd() * 44) | 0)
    c.set(x, y, rnd() < 0.5 ? 'F' : rnd() < 0.7 ? 'W' : 'G')
  }
  // grass foreground
  c.dither(0, 145, 319, 199, 'G', 'F')
  for (let i = 0; i < 200; i++) {
    const x = (rnd() * 320) | 0, y = 145 + ((rnd() * 55) | 0)
    c.set(x, y, rnd() < 0.8 ? 'F' : 'W')
  }
  c.rect(0, 144, 319, 144, 'K')
  // the great tree
  c.rect(150, 74, 162, 130, 'B')                        // trunk
  c.rect(150, 74, 151, 130, 'K')
  c.rect(144, 120, 150, 130, 'B'); c.rect(162, 118, 168, 130, 'B') // roots
  for (let y = 20; y <= 80; y++) {                      // canopy blob
    const t = (y - 50) / 30
    const half = Math.sqrt(Math.max(0, 1 - t * t)) * 58 + (rnd() - 0.5) * 6
    for (let x = 156 - half; x <= 156 + half; x++) {
      const xi = Math.round(x)
      const even = (xi + y) % 2 === 0
      c.set(xi, y, xi < 156 - half / 3 ? (even ? 'G' : 'F') : even ? 'F' : 'K')
    }
  }
  c.set(140, 38, 'M'); c.set(146, 39, 'M') // fruit
  // standing stone
  c.rect(40, 160, 76, 176, 'A')
  c.rect(40, 160, 76, 161, 'W')
  c.dither(44, 166, 72, 174, 'A', 'K')
  return c.png()
}

// ============================================================================
// ANIMATED PROPS — self-contained strips (never need to align with bg pixels)
// ============================================================================
function torch() { // 12x28, 3 frames: bracket + flickering flame
  return [0, 1, 2].map((f) => {
    const c = Canvas(12, 28)
    c.rect(5, 16, 7, 26, 'B')          // handle
    c.rect(4, 26, 8, 27, 'A')          // bracket
    c.rect(4, 14, 8, 16, 'A')          // cup
    const flick = [0, 1, -1][f]
    c.rect(4, 8 + flick, 8, 13, 'M')   // outer flame
    c.rect(5, 5 + flick, 7, 9 + flick, 'M')
    c.rect(5, 9 + flick, 7, 13, 'W')   // hot core
    c.set(6, 3 + flick, 'M')
    if (f === 1) c.set(3, 10, 'M')     // spark
    if (f === 2) c.set(9, 9, 'M')
    return c
  })
}

function flask() { // 16x24, 3 frames: bubbling green flask
  return [0, 1, 2].map((f) => {
    const c = Canvas(16, 24)
    c.rect(6, 4, 9, 10, 'A')           // neck
    c.rect(3, 10, 12, 21, 'G')         // body
    c.rect(3, 10, 3, 21, 'W')          // glint
    c.rect(2, 21, 13, 22, 'K')         // base
    // bubbles rise with each frame
    const ys = [[18, 14], [15, 11], [12, 7]][f]
    c.set(6, ys[0], 'W'); c.set(9, ys[1], 'W')
    if (f === 2) c.set(7, 2, 'G')      // escaping puff
    return c
  })
}

function bird() { // 16x10, 2 frames: gliding silhouette
  return [0, 1].map((f) => {
    const c = Canvas(16, 10)
    c.rect(6, 4, 9, 5, 'K') // body
    c.set(10, 4, 'K')       // head
    if (f === 0) { c.rect(2, 1, 5, 3, 'K'); c.rect(10, 1, 13, 3, 'K') } // wings up
    else { c.rect(2, 6, 5, 8, 'K'); c.rect(10, 6, 13, 8, 'K') }         // wings down
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
