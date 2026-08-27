import { useEffect, useState } from 'react'
import DialogBox from '../DialogBox'
import Sprite from '../Sprite'
import { useScore } from '../score'
import { useSound } from '../sound'
import engineerSheet from '../assets/pixel/engineer.png'
import alchemistSheet from '../assets/pixel/alchemist.png'
import leaderSheet from '../assets/pixel/leader.png'
import styles from './styles.module.css'

// Each class page is a "scene": narration plays in the dialog box, then the
// visitor inspects hotspots (the signposts) for the real content. Points land
// on first visit and first inspection of each hotspot, Sierra-style.
const SCENES = {
  engineer: {
    sheet: engineerSheet,
    accent: 'var(--cyan)',
    ground: 'var(--gray)',
    narration: [
      "You stand in the Engineer's forge. Two decades of craft glow in the coals.",
      'Here Max forges rapid prototypes and best-in-class systems alike — shipped on time, at scale.',
      'Inspect the artifacts on the workshop floor to learn more.',
    ],
    idle: 'The forge hums quietly. The artifacts await your inspection.',
    hotspots: [
      {
        id: 'terrain', label: 'WebGPU Terrain', x: '52%',
        lines: [
          'An infinite-terrain generator, first built in Unity, reforged as a web-native artifact: React, Go compiled to WASM, and WebGPU — deployed to Azure.',
          'It is open source, playable in your browser, and still evolving as Max experiments with biome stitching.',
        ],
        links: [
          { href: 'https://github.com/maxfelker/terrain-webgpu', label: 'View the source' },
          { href: 'https://terrain-gpu-demo.azurewebsites.net/', label: 'Enter the demo' },
        ],
      },
      {
        id: 'unicorn', label: 'The Unicorn Game', x: '72%',
        lines: [
          'When his daughter found no unicorn games in all the land, Max built one.',
          'A 3D third-person game where players explore the world as different types of unicorns.',
        ],
      },
      {
        id: 'craft', label: 'The Craft', x: '30%',
        lines: [
          'Since the age of 8, when he first laid hands on 3D Studio Max, Max has approached games with novel technology.',
          'His forge-marks: agile software delivery optimized at scale, and prototypes that become products.',
        ],
      },
    ],
  },
  alchemist: {
    sheet: alchemistSheet,
    accent: 'var(--magenta)',
    ground: 'var(--purple)',
    narration: [
      "You enter the Alchemist's tower. Strange vessels bubble with half-formed ideas.",
      "Max's superpower is realizing the art of the possible — transmuting raw ideas into living products, 0 to 1.",
      'Examine the vessels to learn more.',
    ],
    idle: 'The vessels bubble on. Examine one to see what it holds.',
    hotspots: [
      {
        id: 'terra-major', label: 'Terra Major', x: '50%',
        lines: [
          'A world conjured from nothing: Terra Major VIII, an arid desert planet where travelers create a character and roam the surface.',
          'They gather and refine strange resources — Cosmocite, Luxium, and Beyon. The demo is free to try.',
        ],
        links: [{ href: 'https://terramajorgame.com/', label: 'Visit Terra Major' }],
      },
      {
        id: 'realms', label: 'Strange Realms', x: '72%',
        lines: [
          'Health care. Commercial retail. Mixed reality. Financial services. Startups.',
          'Each realm a different cauldron — and from each, a working elixir.',
        ],
      },
      {
        id: 'vision', label: 'The Great Work', x: '30%',
        lines: [
          'Shaping product visions and strategic opportunities at the executive level.',
          'The rarest transmutation: turning "what if" into "shipped".',
        ],
      },
    ],
  },
  leader: {
    sheet: leaderSheet,
    accent: 'var(--bright-green)',
    ground: 'var(--forest-green)',
    narration: [
      "You arrive at the Leader's war table. Banners of many campaigns hang above it.",
      'A trusted and versatile leader: Max takes ideas from 0 to 1 and products from 1 to 10.',
      'Study the table to learn more.',
    ],
    idle: 'The banners stir in the draft. Study the war table to learn more.',
    hotspots: [
      {
        id: 'banner', label: 'The Banner', x: '50%',
        lines: [
          'Max presently serves as Principal Technical Program Manager at the Microsoft Frontier Company, in the financial services realm.',
        ],
        links: [{ href: 'https://www.microsoft.com/en-us/frontier-company', label: 'The Frontier Company' }],
      },
      {
        id: 'campaigns', label: 'Campaigns', x: '72%',
        lines: [
          'Driving holistic change management across whole organizations.',
          'Optimizing agile software development lifecycles at scale — many parties, one march.',
        ],
      },
      {
        id: 'guild', label: 'The Guild', x: '30%',
        lines: [
          'Realizing organizational capability through employee skills growth and talent acquisition.',
          'A leader is measured by the heroes trained in their hall.',
        ],
      },
    ],
  },
}

export default function ScenePage({ slug }) {
  const scene = SCENES[slug]
  const { award } = useScore()
  const { play } = useSound()
  const [active, setActive] = useState(null)
  const [narrated, setNarrated] = useState(false)

  useEffect(() => {
    setActive(null)
    setNarrated(false)
    if (award(`visit-${slug}`, 50)) play('ding')
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps -- first-visit award only

  function inspect(h) {
    play(award(`${slug}-${h.id}`, 15) ? 'ding' : 'click')
    setActive(h)
  }

  return (
    <div className={styles.scene}>
      <div className={styles.stage}>
        <div className={styles.ground} style={{ '--ground': scene.ground }} />
        <Sprite
          className={styles.hero}
          sheet={scene.sheet}
          frameWidth={16}
          frameHeight={24}
          frames={2}
          fps={2}
          scale={5}
        />
        {scene.hotspots.map((h) => (
          <button
            key={h.id}
            className={styles.hotspot}
            style={{ left: h.x, '--accent': scene.accent }}
            onClick={() => inspect(h)}
          >
            {h.label}
          </button>
        ))}
      </div>
      <div className={styles.dialogArea}>
        {active ? (
          <>
            <DialogBox key={active.id} lines={active.lines} onDone={() => setActive(null)} />
            {active.links && (
              <p className={styles.links}>
                {active.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer">[{l.label}]</a>
                ))}
              </p>
            )}
          </>
        ) : narrated ? (
          <DialogBox><p>{scene.idle}</p></DialogBox>
        ) : (
          <DialogBox key={slug} lines={scene.narration} onDone={() => setNarrated(true)} />
        )}
      </div>
    </div>
  )
}
