import styles from './styles.module.css'

export default function HomePage() {

  return (
    <div className={styles.content}>
      <h1>Hi, I'm Max</h1>
      <p>My superpower is empowering people with technology. I guide others through planning, 
        building, and delivering solutions at scale.</p>

      <p>Learn more <a href="/about">about me</a> and my innovation journey.</p>

      <p> I am building a <a target="_blank" href="https://terramajornonprod.z13.web.core.windows.net/">sci-fi videogame</a> {" "}
          and I also make <a target="_blank" href="https://music.maxfelker.com">music</a></p>
    </div>
  )
}