import { Outlet } from 'react-router-dom'
import TitleBar from '../TitleBar'
import { ScoreProvider } from '../score'
import styles from './styles.module.css'

// Layout shell for every page: Sierra title bar on top, scrolling viewport below.
export default function GameFrame() {
  return (
    <ScoreProvider>
      <TitleBar />
      <main className={styles.viewport}>
        <Outlet />
      </main>
    </ScoreProvider>
  )
}
