import { useEffect } from 'react'
import DialogBox from '../DialogBox'
import { useScore } from '../score'
import { useSound } from '../sound'
import styles from './styles.module.css'

const STATS = [
  ['Art of the Possible', 19],
  ['Product Vision', 18],
  ['Rapid Prototyping', 18],
  ['Engineering at Scale', 17],
  ['Change Management', 17],
  ['Talent Growth', 16],
]

const INVENTORY = [
  '3D Studio Max (childhood artifact)', 'Unity', 'React', 'Go / WASM',
  'WebGPU', 'Azure', 'Agile at Scale', 'Executive Whispering',
]

const REALMS = ['Financial Services', 'Health Care', 'Commercial Retail', 'Mixed Reality', 'Startups']

// text bar in CP437 blocks, 20 wide — the VGA font renders these natively
const bar = (n) => '▓'.repeat(n) + '░'.repeat(20 - n)

export default function CharacterSheetPage() {
  const { award } = useScore()
  const { play } = useSound()

  useEffect(() => {
    if (award('character-sheet', 50)) play('ding')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- first-visit award only

  return (
    <div className={styles.content}>
      <h1>Character Sheet</h1>

      <DialogBox className={styles.panel}>
        <h2 className={styles.h}>Identity</h2>
        <table className={styles.kv}>
          <tbody>
            <tr><td>Name</td><td>Max Felker</td></tr>
            <tr><td>Class</td><td>Principal Technical Program Manager</td></tr>
            <tr><td>Guild</td><td><a href="https://www.microsoft.com/en-us/frontier-company" target="_blank" rel="noreferrer">Microsoft Frontier Company</a></td></tr>
            <tr><td>Level</td><td>20 — two decades of adventuring</td></tr>
            <tr><td>Power</td><td>Realizing the art of the possible: ideas 0→1, products 1→10</td></tr>
          </tbody>
        </table>
      </DialogBox>

      <DialogBox className={styles.panel}>
        <h2 className={styles.h}>Attributes</h2>
        <table className={styles.stats}>
          <tbody>
            {STATS.map(([name, n]) => (
              <tr key={name}>
                <td>{name}</td>
                <td className={styles.bar} aria-label={`${n} of 20`}>{bar(n)}</td>
                <td>{n}/20</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DialogBox>

      <DialogBox className={styles.panel}>
        <h2 className={styles.h}>Inventory</h2>
        <ul className={styles.tags}>
          {INVENTORY.map((i) => <li key={i}>[{i}]</li>)}
        </ul>
        <h2 className={styles.h}>Realms Traveled</h2>
        <ul className={styles.tags}>
          {REALMS.map((r) => <li key={r}>[{r}]</li>)}
        </ul>
      </DialogBox>

      <DialogBox className={styles.panel}>
        <h2 className={styles.h}>Deeds &amp; Records</h2>
        <p className={styles.links}>
          <a href="https://linkedin.com/in/maxfelker" target="_blank" rel="noreferrer">[LinkedIn]</a>
          <a href="https://github.com/maxfelker" target="_blank" rel="noreferrer">[GitHub]</a>
          <a href="https://stackoverflow.com/users/127012/m-w-felker" target="_blank" rel="noreferrer">[Stack Overflow]</a>
        </p>
      </DialogBox>
    </div>
  )
}
