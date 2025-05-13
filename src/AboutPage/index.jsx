import styles from './styles.module.css'

export default function AboutPage() {

  return (
    <div className={styles.content}>
      <h1>Max Felker</h1>

      <p>Today, I work at Microsoft where I focus on cross-functional technology and strategy innovation at scale. With over 17 years of experience, I am a trusted and versatile leader who knows how to:</p>
      
      <ul>
        <li>Shape product visions and strategic opportunities at the executive level</li>
        <li>Drive holistic change management across organizations</li>
        <li>Ship rapid prototypes and best-in-class engineering solutions on time</li>
        <li>Optimize agile software development lifecycles at scale</li>
        <li>Realize organizational capabilities through skills growth and talent acquisition</li>
      </ul>

      <p>Learn more <a href="/about">about me</a> and my innovation journey.</p>

      <p> I am building a <a target="_blank" href="https://terramajornonprod.z13.web.core.windows.net/">sci-fi videogame</a> {" "}
          and I also make <a target="_blank" href="https://music.maxfelker.com">music</a></p>

      <p>
        <a target="_blank" href="https://linkedin.com/in/mwfelker">LinkedIn</a> • {" "}
        <a target="_blank"  href="https://github.com/mw-felker">GitHub</a> • {" "}
        <a target="_blank"  href="https://twitter.com/mwfelker">Twitter</a> • {" "}
        <a target="_blank"  href="https://stackoverflow.com/users/127012/m-w-felker">Stack Overflow</a>
      </p>

      <p><a href="/">Back Home</a></p>
    </div>
  )
}
