import { useEffect, useState } from 'react'
import { useSound } from '../sound'
import styles from './styles.module.css'

const CHARS_PER_SEC = 40
const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Sierra narration box: white, double black border, hard drop shadow.
// With `lines`, it types text out and advances line-by-line on click/Enter
// (click mid-type completes the line first, like the originals).
// Without `lines`, it's a static styled box for arbitrary children.
export default function DialogBox({ lines, onDone, children, className = '' }) {
  const [lineIdx, setLineIdx] = useState(0)
  const [shown, setShown] = useState(0)
  const { play } = useSound()

  const line = lines?.[lineIdx] ?? ''
  const typing = lines && shown < line.length
  const lastLine = lines && lineIdx >= lines.length - 1

  useEffect(() => {
    if (!lines) return
    setShown(reducedMotion() ? lines[lineIdx].length : 0)
  }, [lines, lineIdx])

  useEffect(() => {
    if (!typing) return
    const t = setInterval(() => setShown((n) => n + 1), 1000 / CHARS_PER_SEC)
    return () => clearInterval(t)
  }, [typing])

  if (!lines) return <div className={`${styles.box} ${className}`}>{children}</div>

  function advance() {
    play('blip')
    if (typing) return setShown(line.length)
    if (!lastLine) return setLineIdx((i) => i + 1)
    onDone?.()
  }

  return (
    <div
      className={`${styles.box} ${styles.clickable} ${className}`}
      role="button"
      tabIndex={0}
      onClick={advance}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && advance()}
    >
      <p className={styles.text}>{line.slice(0, shown)}</p>
      {!typing && <span className={styles.more}>{lastLine ? '■' : '▼'}</span>}
    </div>
  )
}
