import { useState } from 'react'
import { Link } from 'react-router-dom'
import { articles } from '../articles'
import ArticleList from '../ArticleList'
import Sprite from '../Sprite'
import { useScore } from '../score'
import { useSound } from '../sound'
import mountain from '../assets/pixel/mountain.png'
import engineerSheet from '../assets/pixel/engineer.png'
import alchemistSheet from '../assets/pixel/alchemist.png'
import leaderSheet from '../assets/pixel/leader.png'
import musicUrl from '../assets/sfx/music.wav'
import styles from './styles.module.css'

const CLASSES = [
  { slug: 'engineer', name: 'Engineer', tag: 'Forger of systems', sheet: engineerSheet },
  { slug: 'alchemist', name: 'Alchemist', tag: 'Transmuter of ideas', sheet: alchemistSheet },
  { slug: 'leader', name: 'Leader', tag: 'Commander of quests', sheet: leaderSheet },
]

export default function HomePage() {
  const [begun, setBegun] = useState(false)
  const { play, playMusic } = useSound()
  const { award } = useScore()

  function begin() {
    play('start') // the click is also the browser's audio-unlock gesture
    playMusic(musicUrl)
    award('begin', 5)
    setBegun(true)
  }

  if (!begun) {
    return (
      <div
        className={styles.splash}
        role="button"
        tabIndex={0}
        onClick={begin}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && begin()}
      >
        <img className={styles.mountain} src={mountain} alt="" />
        <h1 className={styles.presents}>MAX FELKER</h1>
        <p className={styles.sub}>PRESENTS</p>
        <p className={styles.begin}>CLICK TO BEGIN YOUR QUEST</p>
      </div>
    )
  }

  return (
    <div className={styles.select}>
      <h1 className={styles.choose}>CHOOSE YOUR CHARACTER</h1>
      <div className={styles.classes}>
        {CLASSES.map((c) => (
          <Link
            key={c.slug}
            className={styles.card}
            to={`/${c.slug}`}
            onClick={() => play('click')}
          >
            <span className={styles.frame}>
              <Sprite
                sheet={c.sheet}
                frameWidth={24}
                frameHeight={36}
                frames={2}
                fps={2}
                scale={4}
              />
            </span>
            <span className={styles.name}>{c.name}</span>
            <span className={styles.tag}>{c.tag}</span>
          </Link>
        ))}
      </div>
      <section className={styles.tales}>
        <h2>Tales from the tavern</h2>
        <ArticleList articles={articles} />
      </section>
    </div>
  )
}
