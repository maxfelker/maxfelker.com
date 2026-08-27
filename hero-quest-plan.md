# Hero Quest Redesign — Style Guide & Implementation Plan

Issue: [#45](https://github.com/maxfelker/maxfelker.com/issues/45)

Redesign maxfelker.com as a Sierra point-and-click adventure (Hero's Quest / Quest
for Glory, 1989). The site becomes a "game": the home page is a character-class
select, each class opens a scene showcasing a skill set, and a score in the title
bar ticks up as visitors explore.

---

## 1. Style guide (from the reference screenshots)

### 1.1 The frame

Every Sierra screen has the same anatomy, and every page of the site will too:

```
┌──────────────────────────────────────────────────────────────┐
│ Max Felker - I make the things happen   [score 120 of 500]   │  ← title bar
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    SCENE (16:10, pixel art)                  │  ← 320×200 canvas,
│         ┌────────────────────────────────────┐               │    integer-scaled
│         │ Dialog box: white, black border,   │               │
│         │ serif pixel font, drop shadow      │               │
│         └────────────────────────────────────┘               │
│                       ▒ sprite ▒                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- **Canvas**: scenes are authored at **320×200** (or 640×400) and scaled up with
  `image-rendering: pixelated` at integer multiples. Letterbox with black when the
  viewport doesn't divide evenly — black bars are period-correct.
- **Title bar**: white background, black text, single-pixel black rule beneath —
  exactly like `So You Want To Be A Hero  [score 220 of 500]`. Left: name + tagline.
  Right: nav ("Side Quests", "Character Sheet") + live score counter.
- **Dialog boxes**: white fill, 2px black border with a 1px white inner gap
  (double-border look), hard black drop shadow offset down-right, no border radius,
  no anti-aliasing anywhere.

### 1.2 Palette

The 10 colors from the issue are the entire palette. No gradients, no alpha
blending — mixed tones come from **dithering** (checkerboard/scanline patterns of
two palette colors), which is the single most load-bearing visual trick in the
references.

| Token | Hex | Use |
|---|---|---|
| `--black` | `#000000` | Backgrounds, borders, letterbox, text |
| `--forest-green` | `#1BAA3B` | Foliage, mid-tones |
| `--bright-green` | `#57FF57` | Highlights, grass, "success" |
| `--cyan` | `#4AD7FF` | Sky, water, links/interactive |
| `--purple` | `#A64DFF` | Mountains, shadows, magic (Alchemist) |
| `--magenta` | `#FF66CC` | Accents, Sierra-logo pinks |
| `--white` | `#F5F5F5` | Dialog boxes, title bar, text on dark |
| `--gray` | `#808080` | Stone, disabled, secondary text |
| `--brown` | `#A05A2C` | Wood, earth, buildings |
| `--blue` | `#3D4DFF` | Player sprite clothing, deep water |

Class accent colors: **Engineer** = cyan, **Alchemist** = purple/magenta,
**Leader** = bright green.

### 1.3 Typography

- **Body/dialog**: the IBM VGA 8×16 bitmap font — self-host
  [Web437 "IBM VGA" from the Ultimate Oldschool PC Font Pack](https://int10h.org/oldschool-pc-fonts/)
  (CC BY-SA 4.0, woff2). This is the actual font in the screenshots.
  Fallback: `"VT323", monospace`.
- **Rendering**: `font-smooth: never; -webkit-font-smoothing: none;` and sizes in
  multiples of the native size (16px, 32px) so glyphs stay crisp.
- No italics, no font weights — emphasis is done with color or `ALL CAPS`,
  like the originals.

### 1.4 Texture rules

- Dithering via tiny repeating `background-image` patterns (2×2 px checkerboards
  of two palette colors, scaled up) or baked into the scene art.
- Optional CRT scanline overlay: a `repeating-linear-gradient` at 10–15% black on
  a fixed overlay div. Cheap, togglable, sells the effect.
- Cursor: pixel-art arrow (`cursor: url(...)`) matching the EGA pointer.

---

## 2. Site map & UX

```
/            Character select — "the beginning of the game"
/engineer    Scene: engineering skills
/alchemist   Scene: product/creative skills
/leader      Scene: leadership skills
/side-quests Projects page (quest log)
/character-sheet  Resume as RPG stat sheet (+ PDF download, LinkedIn)
/article/:slug    Existing articles, restyled as "scrolls"/dialog pages
```

- **Home**: Sierra-style title screen. "MAX FELKER PRESENTS" splash (mirroring the
  "SIERRA PRESENTS" mountain reference) fades to the character-select scene with
  three sprites standing side by side — Engineer / Alchemist / Leader, the
  fighter/thief/mage trio. Hover = sprite animates + name plate; click = walk-off
  animation, then navigate.
- **Scenes** (`/engineer` etc.): full-bleed pixel background, an idle-animated
  sprite, and content delivered through sequential dialog boxes (click/Enter to
  advance, like reading game narration). Interactive hotspots ("LOOK AT",
  "TALK TO" verbs optional flourish) reveal skill details and award points.
- **Side Quests**: quest-log UI — list of projects as quest entries with
  COMPLETED/IN PROGRESS status and reward text.
- **Character Sheet**: stat block (STR/INT/COM remapped to real skills with
  point bars), inventory (tools/tech), "Export to PDF" and LinkedIn buttons
  styled as game menu items.
- **Score**: points for first-time events (visit a scene +25, open a hotspot +5,
  read an article +10, view character sheet +20 …) totaling a fixed max so the
  bar can read `[score N of 500]`. Persisted in `localStorage`; a
  point-award "ding" + brief `+25` toast when it increments.
- **Accessibility**: all content is real HTML text (dialog boxes are styled divs,
  not canvas), `prefers-reduced-motion` disables sprite/CRT animation, sound is
  opt-in and remembers the choice.

---

## 3. React components

Keep the existing stack (Vite + React Router). No new runtime dependencies —
sprites are CSS, audio is the native `Audio` API.

| Component | Purpose |
|---|---|
| `GameFrame` | Layout shell: title bar + 16:10 letterboxed scene viewport; integer pixel scaling |
| `TitleBar` | Name/tagline left; Side Quests, Character Sheet, `[score N of 500]` right |
| `Scene` | Full-bleed pixel background + positioned children (sprites, hotspots) |
| `DialogBox` | White/black-double-border box; typewriter text; click-to-advance queue |
| `Sprite` | Sprite-sheet animation via CSS `steps()`; props: sheet, frames, fps, playing |
| `Hotspot` | Invisible/outlined clickable region in a scene; awards points, opens dialog |
| `PixelButton` | Beveled EGA button with click/hover SFX |
| `CharacterSelect` | The three-class chooser on the home page |
| `QuestLog` / `QuestEntry` | Side Quests list |
| `StatBlock`, `StatBar`, `Inventory` | Character Sheet pieces |
| `ScoreProvider` | Context: `award(id, points)` (idempotent per id), total, localStorage persistence |
| `SoundProvider` | Context: `play(sfx)`, music toggle, mute state, autoplay-gate handling |
| `CrtOverlay` | Optional scanline layer, honors `prefers-reduced-motion` |

---

## 4. Sprite implementation

**Approach: sprite sheets + CSS `steps()` animation.** No canvas, no game loop,
no library — the browser compositor does the work.

1. Author each animation as a horizontal strip PNG at native resolution
   (e.g. 6 frames of a 32×48 idle = 192×48 px), transparent background,
   palette colors only.
2. Render as a div with the sheet as `background-image`, animate
   `background-position` with `animation-timing-function: steps(N)`:

```css
.sprite {
  width: calc(32px * var(--px));   /* --px = integer zoom from GameFrame */
  height: calc(48px * var(--px));
  background: url(idle.png) 0 0 no-repeat;
  background-size: calc(192px * var(--px)) calc(48px * var(--px));
  image-rendering: pixelated;
  animation: idle 0.8s steps(6) infinite;
}
@keyframes idle {
  to { background-position: calc(-192px * var(--px)) 0; }
}
```

3. The `Sprite` component just maps props (frame count, fps, sheet) onto those
   CSS custom properties. Walk-offs are the same thing plus a `transform:
   translateX` transition with a `steps()` walk cycle running.
4. Asset production: pixel-art tools (Aseprite exports strips directly);
   scene backgrounds authored at 320×200 and shipped as PNG — they're tiny
   (the entire QfG screen above is ~34 KB).

Interactive/branching animation (rare here) can swap the `animation-name` via a
prop — still no JS ticker.

## 5. Sound implementation

**SFX — native `Audio`, preloaded, cloned per play:**

```js
const sfx = { click: new Audio(clickUrl), award: new Audio(awardUrl), ... };
function play(name) {
  if (muted) return;
  sfx[name].cloneNode().play();   // cloneNode allows overlapping plays
}
```

Short OGG/MP3 files (a few KB each): button click, dialog advance blip,
point-award ding, page-transition chime. Sourced from jsfxr/generated bleeps so
they read as AdLib-era.

**Music — pre-rendered loops, not live MIDI.** Real in-browser MIDI needs a
soundfont synth (~large JS + samples). Instead: compose/source MIDI, render it
through an OPL2/FM soundfont offline, ship as looping OGG (~1 MB per track).
Identical sound, zero runtime cost. One ambient track per scene area,
crossfaded on route change via two `Audio` elements.
<!-- ponytail: pre-rendered OGG loops; swap in a JS OPL emulator only if
     genuinely dynamic MIDI ever becomes a requirement -->

**Autoplay policy**: browsers block audio before a user gesture. The splash
screen's "CLICK TO BEGIN YOUR QUEST" (period-correct anyway) is the gesture that
starts the music. Persistent mute toggle in the title bar, choice saved in
`localStorage`.

---

## 6. Implementation order

1. **Foundation** — palette tokens, VGA font, `GameFrame` + `TitleBar` + integer
   scaling, pixel cursor. Existing pages still render inside the frame.
2. **Core kit** — `DialogBox`, `PixelButton`, `Sprite`, `ScoreProvider`,
   `SoundProvider` + SFX.
3. **Home** — splash + `CharacterSelect` with three sprites and first scene art.
4. **Scenes** — `/engineer`, `/alchemist`, `/leader` with hotspots and scoring.
5. **Side Quests + Character Sheet** — quest log, stat block, PDF/LinkedIn links.
6. **Polish** — music loops, CRT overlay, article page restyle, reduced-motion
   and mobile passes.

Each phase ships independently — the site stays deployable after every step.
