import { useEffect } from 'react'
import { useScore } from '../score'
import { useSound } from '../sound'
import styles from './styles.module.css'

const QUESTS = [
  {
    title: 'The Endless Terrain',
    status: 'IN PROGRESS',
    body: 'Reforge an infinite-terrain generator from ancient Unity runes into a web-native artifact of React, Go/WASM, and WebGPU. Deployed to the Azure highlands; biome stitching still underway.',
    links: [
      { href: 'https://github.com/maxfelker/terrain-webgpu', label: 'Source scroll' },
      { href: 'https://terrain-gpu-demo.azurewebsites.net/', label: 'Play the demo' },
    ],
  },
  {
    title: 'The Unicorn Game',
    status: 'COMPLETED',
    body: 'A young adventurer sought a unicorn game and found none in all the land. Build her one: a 3D third-person world explored as unicorns of every kind.',
    links: [],
  },
  {
    title: 'Terra Major',
    status: 'IN PROGRESS',
    body: 'Conjure the desert planet Terra Major VIII (v0.15.25). Travelers create a character, roam the surface, and refine Cosmocite, Luxium, and Beyon. Free to try.',
    links: [{ href: 'https://terramajorgame.com/', label: 'Enter Terra Major' }],
  },
  {
    title: 'The Hero Quest Interface',
    status: 'IN PROGRESS',
    body: 'Rebuild this very website in the style of the old Sierra masters. You are standing in it.',
    links: [{ href: 'https://github.com/maxfelker/maxfelker.com/issues/45', label: 'Read the prophecy' }],
  },
]

export default function SideQuestsPage() {
  const { award } = useScore()
  const { play } = useSound()

  useEffect(() => {
    if (award('side-quests', 50)) play('ding')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- first-visit award only

  return (
    <div className={styles.content}>
      <div className={styles.scroll}>
        <div className={styles.rollTop} />
        <div className={styles.sheet}>
          <h1 className={styles.title}>Quest Log</h1>
          <p className={styles.intro}>The side quests of Max Felker. New entries appear as the campaigns unfold.</p>
          {QUESTS.map((q) => (
            <section key={q.title} className={styles.quest}>
              <div className={styles.head}>
                <h2 className={styles.questTitle}>{q.title}</h2>
                <span className={q.status === 'COMPLETED' ? styles.done : styles.wip}>
                  [{q.status}]
                </span>
              </div>
              <p>{q.body}</p>
              {q.links.length > 0 && (
                <p className={styles.links}>
                  {q.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer">[{l.label}]</a>
                  ))}
                </p>
              )}
            </section>
          ))}
        </div>
        <div className={styles.rollBottom} />
      </div>
    </div>
  )
}
