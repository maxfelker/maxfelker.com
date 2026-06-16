import { useParams, Link } from 'react-router-dom'
import { getArticle } from '../articles'
import styles from './styles.module.css'

export default function ArticlePage() {
  const { slug } = useParams()
  const article = getArticle(slug)

  if (!article) {
    return (
      <div className={styles.content}>
        <h1>Article not found</h1>
        <p><Link to="/">Back home</Link></p>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      <h1>{article.title}</h1>
      <p className={styles.date}>{article.date}</p>
      {article.image && <img className={styles.hero} src={article.image} alt={article.title} />}
      {/* ponytail: first-party Markdown from this repo, not user input — safe to render directly. */}
      <div dangerouslySetInnerHTML={{ __html: article.html }} />
      <p><Link to="/">Back home</Link></p>
    </div>
  )
}
