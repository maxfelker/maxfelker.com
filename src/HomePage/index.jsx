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
        <h1>My name is Max and my super power is realizing the art of the possible</h1>
        <Link className={styles.cta} to="/about">Learn More</Link>
      </header>

      <ArticleList articles={articles} />

    </div>
  )
}
