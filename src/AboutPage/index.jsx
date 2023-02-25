import styles from './styles.module.css'

export default function AboutPage() {

  return (
    <div className={styles.content}>
      <h1>Max Felker</h1>

      <p>I practice selfless-leadership and hands-on mentorship when working with anyone on any team.</p>

      <p>Currently, I am an Enterprise Architect at Microsoft within the Microsoft 
        Customer and Partner Solutions (MCAPS) group, where I focus on strategic 
        and technical alignment. 
      </p>

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
