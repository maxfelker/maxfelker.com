import { Link } from 'react-router-dom'
import styles from './styles.module.css'

export default function ArticleList({ articles }) {
  if (!articles.length) return null

  return (
    <>
      <h2>Latest articles</h2>
      <ul className={styles.articles}>
        {articles.map((article) => (
          <li key={article.slug}>
            <Link to={`/article/${article.slug}`}>{article.title}</Link>
            <p className={styles.meta}>{article.date}</p>
            <p>{article.summary}</p>
          </li>
        ))}
      </ul>
    </>
  )
}
