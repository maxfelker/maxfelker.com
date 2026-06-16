import { Link } from 'react-router-dom'
import { articles } from '../articles'
import ArticleList from '../ArticleList'
import profilePic from './profile-pic.png'
import styles from './styles.module.css'

export default function HomePage() {

  return (
    <div className={styles.content}>
      <header className={styles.hero}>
        <img className={styles.avatar} src={profilePic} alt="Max Felker" />
        <h1>Realizing the art of the possible</h1>
        <p>My name is Max.</p>
        <Link className={styles.cta} to="/about">Learn More</Link>
      </header>

      <ArticleList articles={articles} />

    </div>
  )
}
