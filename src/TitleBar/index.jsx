import { Link, NavLink } from 'react-router-dom'
import { MAX_SCORE, useScore } from '../score'
import styles from './styles.module.css'

export default function TitleBar() {
  const { score } = useScore()

  return (
    <header className={styles.bar}>
      <Link className={styles.title} to="/">Max Felker - I make the things happen</Link>
      <nav className={styles.nav}>
        <NavLink to="/side-quests">Side Quests</NavLink>
        <NavLink to="/character-sheet">Character Sheet</NavLink>
        <span className={styles.score}>[score {score} of {MAX_SCORE}]</span>
      </nav>
    </header>
  )
}
