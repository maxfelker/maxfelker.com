import { useEffect } from 'react'
import Sprite from '../Sprite'
import PixelButton from '../PixelButton'
import { MAX_SCORE, useScore } from '../score'
import { useSound } from '../sound'
import leaderSheet from '../assets/pixel/leader.png'
import styles from './styles.module.css'

// Two skill columns, QfG character-screen style.
const SKILLS_LEFT = [
  ['Art of the Possible', 19],
  ['Product Vision', 18],
  ['Rapid Prototyping', 18],
  ['Engineering at Scale', 17],
  ['Change Management', 17],
  ['Talent Growth', 16],
]
const SKILLS_RIGHT = [
  ['Unity / 3D', 16],
  ['React / Web', 17],
  ['Go / WASM', 15],
  ['WebGPU', 15],
  ['Azure', 16],
  ['Executive Whispering', 18],
]

const REALMS = ['Financial Services', 'Health Care', 'Commercial Retail', 'Mixed Reality', 'Startups']

export default function CharacterSheetPage() {
  const { score, award } = useScore()
  const { play } = useSound()

  useEffect(() => {
    if (award('character-sheet', 50)) play('ding')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- first-visit award only

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <p className={styles.nameRow}>
          Name : <span className={styles.nameValue}>Max Felker</span>
        </p>

        <div className={styles.columns}>
          {/* portrait in the ornate frame, like the QfG stat screen */}
          <div className={styles.portraitCol}>
            <span className={styles.frame}>
              <Sprite sheet={leaderSheet} frameWidth={24} frameHeight={36} frames={2} fps={2} scale={3} />
            </span>
            <p className={styles.klass}>Principal TPM</p>
            <p className={styles.guild}>
              <a href="https://www.microsoft.com/en-us/frontier-company" target="_blank" rel="noreferrer">Microsoft Frontier Co.</a>
            </p>
          </div>

          <table className={styles.skills}>
            <tbody>
              {SKILLS_LEFT.map(([name, n]) => (
                <tr key={name}><td>{name}</td><td className={styles.num}>{n}</td></tr>
              ))}
            </tbody>
          </table>

          <table className={styles.skills}>
            <tbody>
              {SKILLS_RIGHT.map(([name, n]) => (
                <tr key={name}><td>{name}</td><td className={styles.num}>{n}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pointsRow}>
          <span className={styles.pointsLabel}>Quest Points</span>
          <span className={styles.pointsBar} aria-label={`${score} of ${MAX_SCORE}`}>
            <span className={styles.pointsFill} style={{ width: `${(score / MAX_SCORE) * 100}%` }} />
          </span>
          <span className={styles.pointsNum}>{score} / {MAX_SCORE}</span>
        </div>
        <p className={styles.hint}>Explore the realm to earn more points.</p>

        <div className={styles.bottom}>
          <div className={styles.vitals}>
            <p>Level <span className={styles.num}>20</span> — two decades of adventuring</p>
            <p>Realms traveled: {REALMS.join(', ')}</p>
          </div>
          <div className={styles.actions}>
            <PixelButton onClick={() => window.open('https://linkedin.com/in/maxfelker', '_blank')}>LinkedIn</PixelButton>
            <PixelButton onClick={() => window.open('https://github.com/maxfelker', '_blank')}>GitHub</PixelButton>
            <PixelButton onClick={() => window.open('https://stackoverflow.com/users/127012/m-w-felker', '_blank')}>Stack Overflow</PixelButton>
          </div>
        </div>
      </div>
    </div>
  )
}
