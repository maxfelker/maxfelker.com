import styles from './styles.module.css'

export default function HomePage() {

  return (
    <div className={styles.content}>
      <h1>Hi, I'm Max</h1>
      <p>My name is Max and I make things happen. I am passionate about fostering safe spaces where people thrive. I accelerate creative and enterprise product teams.</p>
      
      <p>Today, I work at Microsoft where I focus on cross-functional technology and strategy innovation at scale. With over 17 years of experience, I am a trusted and versatile leader.</p>

      <p>Learn more <a href="/about">about me</a>.</p>

    </div>
  )
}