import { useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getArticle } from '../articles'
import { useScore } from '../score'
import { useSound } from '../sound'
import styles from './styles.module.css'

export default function ArticlePage() {
  const { slug } = useParams()
  const article = getArticle(slug)
  const bodyRef = useRef(null)
  const { award } = useScore()
  const { play } = useSound()

  // reading a tavern tale is worth points, once per tale
  useEffect(() => {
    if (article && award(`article-${slug}`, 15)) play('ding')
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps -- first-read award only

  // The article HTML comes from marked, so the copy buttons for the prompt blocks
  // get added here instead of in the Markdown. Progressive enhancement: no JS, no button.
  useEffect(() => {
    const root = bodyRef.current
    if (!root) return
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector(`.${styles.copy}`)) return
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = styles.copy
      btn.textContent = 'Copy'
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')
        await navigator.clipboard.writeText(code ? code.innerText : pre.innerText)
        btn.textContent = 'Copied'
        setTimeout(() => { btn.textContent = 'Copy' }, 1500)
      })
      pre.appendChild(btn)
    })
  }, [article])

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
      <div ref={bodyRef} dangerouslySetInnerHTML={{ __html: article.html }} />
      <p><Link to="/">Back home</Link></p>
    </div>
  )
}
