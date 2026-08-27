// Generates the background music loop: a 16-bar square-wave minstrel tune in
// A minor, two voices (melody + bass), rendered to an 11 kHz mono WAV so the
// whole loop stays small. MIDI-idiom without a runtime synth. Run once:
//   node scripts/gen-music.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RATE = 11025
const BPM = 110
const BEAT = 60 / BPM // seconds per quarter note

// note name -> frequency
const N = (() => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const out = {}
  for (let oct = 2; oct <= 6; oct++)
    names.forEach((n, i) => { out[n + oct] = 440 * 2 ** ((oct - 4) + (i - 9) / 12) })
  return out
})()

// [note, beats] — melody: a wandering minstrel line over Am F C G / Am F E Am
const MELODY = [
  ['A4', 1], ['C5', 1], ['E5', 1], ['C5', 1],
  ['F4', 1], ['A4', 1], ['C5', 1.5], ['A4', 0.5],
  ['C4', 1], ['E4', 1], ['G4', 1], ['E4', 1],
  ['G4', 1], ['B4', 1], ['D5', 2],
  ['A4', 1], ['C5', 1], ['E5', 1.5], ['D5', 0.5],
  ['C5', 1], ['A4', 1], ['F4', 2],
  ['E4', 0.5], ['F4', 0.5], ['G4', 1], ['B4', 1], ['G4', 1],
  ['A4', 3], [null, 1],
]
// bass: root-fifth plod, one pair per bar
const BASS = [
  ['A2', 2], ['E3', 2], ['F2', 2], ['C3', 2],
  ['C3', 2], ['G3', 2], ['G2', 2], ['D3', 2],
  ['A2', 2], ['E3', 2], ['F2', 2], ['C3', 2],
  ['E2', 2], ['B2', 2], ['A2', 2], ['E3', 2],
]

function renderVoice(seq, vol, duty) {
  const total = seq.reduce((a, [, b]) => a + b, 0) * BEAT
  const out = new Float32Array(Math.round(total * RATE))
  let t0 = 0
  for (const [note, beats] of seq) {
    const dur = beats * BEAT
    if (note) {
      const freq = N[note]
      const n = Math.round(dur * RATE)
      const start = Math.round(t0 * RATE)
      let phase = 0
      for (let i = 0; i < n && start + i < out.length; i++) {
        phase += freq / RATE
        // little decay per note so it plucks instead of droning
        const env = Math.min(1, (n - i) / (RATE * 0.05)) * (1 - (i / n) * 0.35)
        out[start + i] = (phase % 1 < duty ? 1 : -1) * vol * env
      }
    }
    t0 += dur
  }
  return out
}

const melody = renderVoice(MELODY, 0.22, 0.25) // thin 25% duty lead, NES-flute-ish
const bass = renderVoice(BASS, 0.18, 0.5)
const len = Math.max(melody.length, bass.length)
const mix = new Float32Array(len)
for (let i = 0; i < len; i++) mix[i] = (melody[i] ?? 0) + (bass[i] ?? 0)

const data = Buffer.alloc(len * 2)
mix.forEach((s, i) => data.writeInt16LE((Math.max(-1, Math.min(1, s)) * 32767) | 0, i * 2))
const h = Buffer.alloc(44)
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8)
h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22)
h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34)
h.write('data', 36); h.writeUInt32LE(data.length, 40)

const out = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/sfx/music.wav')
writeFileSync(out, Buffer.concat([h, data]))
console.log(`music.wav  ${(len / RATE).toFixed(1)}s  ${((44 + data.length) / 1024).toFixed(0)}KB`)
