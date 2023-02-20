import { useState } from 'react'
import styles from './styles.module.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className={styles.content}>
      <h1>Hi, I'm Max</h1>
      <p>My superpower is empowering others with technology. 
        Day to day, I guide teams through the process of planning, 
        building, and delivering solutions at scale. I practice selfless-leadership 
        and hands-on mentorship as fundamentals when working with any team. 
      </p>

      <p>Currently, I am an Enterprise Architect at Microsoft within the Microsoft 
        Customer and Partner Solutions (MCAPS) group, where I focus on strategic 
        and technical alignment. 
      </p>

      <p>In my personal time, I enjoy working on a variety of creative projects 
        such as building video games, making cross-genre music, and exploring 
        multidisciplinary art. 
      </p>
      <p>
        <a href="https://linkedin.com/in/mwfelker">LinkedIn</a> • {" "}
        <a href="https://github.com/mw-felker">GitHub</a> • {" "}
        <a href="https://twitter.com/mwfelker">Twitter</a> • {" "}
        <a href="https://stackoverflow.com/users/127012/m-w-felker">Stack Overflow</a>
      </p>
    </div>
  )
}

export default App
