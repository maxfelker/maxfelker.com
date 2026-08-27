// Generates the game's sound effects as tiny 16-bit mono WAVs — square-wave
// bleeps in the AdLib/PC-speaker idiom. Run once, outputs are committed:
//   node scripts/gen-sfx.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RATE = 22050
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/sfx')

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((s, i) => data.writeInt16LE((Math.max(-1, Math.min(1, s)) * 32767) | 0, i * 2))
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8)
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22)
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34)
  h.write('data', 36); h.writeUInt32LE(data.length, 40)
  return Buffer.concat([h, data])
}

// One square-wave note; optional pitch slide and linear decay envelope.
function tone({ freq, dur, vol = 0.35, slideTo = null, decay = true }) {
  const n = Math.floor(RATE * dur)
  const out = new Float32Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const f = slideTo ? freq + (slideTo - freq) * t : freq
    phase += f / RATE
    out[i] = (phase % 1 < 0.5 ? 1 : -1) * vol * (decay ? 1 - t : 1)
  }
  return out
}

const seq = (...parts) => {
  const out = new Float32Array(parts.reduce((a, p) => a + p.length, 0))
  let o = 0
  for (const p of parts) { out.set(p, o); o += p.length }
  return out
}

const sfx = {
  // button press
  click: tone({ freq: 880, dur: 0.04 }),
  // dialog advance
  blip: tone({ freq: 300, slideTo: 620, dur: 0.06 }),
  // points awarded
  ding: seq(tone({ freq: 660, dur: 0.09, decay: false }), tone({ freq: 1320, dur: 0.22 })),
  // "click to begin" fanfare: C5 E5 G5 C6
  start: seq(
    tone({ freq: 523, dur: 0.11, decay: false }),
    tone({ freq: 659, dur: 0.11, decay: false }),
    tone({ freq: 784, dur: 0.11, decay: false }),
    tone({ freq: 1047, dur: 0.35 }),
  ),
}

mkdirSync(OUT, { recursive: true })
for (const [name, samples] of Object.entries(sfx)) {
  writeFileSync(join(OUT, `${name}.wav`), wav(samples))
  console.log(`${name}.wav  ${(samples.length / RATE * 1000).toFixed(0)}ms`)
}
