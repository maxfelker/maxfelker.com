import { Link } from 'react-router-dom'
import { articles } from '../articles'
import styles from './styles.module.css'

export default function HomePage() {

  return (
    <div className={styles.content}>
      <h1>Hi, I'm Max</h1>
      <p>My name is Max and I make things happen. My super power is accelerating creative and enterprise product teams. I am passionate about fostering safe spaces where people thrive. </p>

      <p>Today, I work at Microsoft where I focus on cross-functional technology and strategy innovation at scale. With over 17 years of experience, I am a trusted and versatile leader.</p>

      <p>Learn more <a href="/about">about me</a>.</p>

      {articles.length > 0 && (
        <>
          <h2>Latest articles</h2>
          <ul className={styles.articles}>
            {articles.map((a) => (
              <li key={a.slug}>
                <Link to={`/article/${a.slug}`}>{a.title}</Link>
                <p className={styles.meta}>{a.date}</p>
                <p>{a.summary}</p>
              </li>
            ))}
          </ul>
        </>
      )}

    </div>
  )
}