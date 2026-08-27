import { Link, NavLink } from 'react-router-dom'
import { MAX_SCORE, useScore } from '../score'
import { useSound } from '../sound'
import styles from './styles.module.css'

export default function TitleBar() {
  const { score } = useScore()
  const { muted, toggleMuted } = useSound()

  return (
    <header className={styles.bar}>
      <Link className={styles.title} to="/">Max Felker - I make the things happen</Link>
      <nav className={styles.nav}>
        <NavLink to="/side-quests">Side Quests</NavLink>
        <NavLink to="/character-sheet">Character Sheet</NavLink>
        <span className={styles.score}>[score {score} of {MAX_SCORE}]</span>
        <button
          className={styles.mute}
          onClick={toggleMuted}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        >
          {muted ? '[♪ off]' : '[♪ on]'}
        </button>
      </nav>
    </header>
  )
}
