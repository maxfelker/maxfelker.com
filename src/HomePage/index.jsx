import { Link } from 'react-router-dom'
import { articles } from '../articles'
import styles from './styles.module.css'

export default function HomePage() {

  return (
    <div className={styles.content}>
      <h1>Hi, I'm Max</h1>
      <p>My name is Max and my super power is realizing the art-of-the-possible. </p>
      
      <p>With two decades of experience in technology across disciplines and industries, I am a trusted leader who knows how to take ideas from 0 to 1 and products from 1 to 10. </p>
      
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