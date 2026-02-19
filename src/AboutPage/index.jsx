import styles from './styles.module.css'

export default function AboutPage() {

  return (
    <div className={styles.content}>
      <h1>Max Felker</h1>

      <p>
        <a target="_blank" href="https://linkedin.com/in/mwfelker">LinkedIn</a> • {" "}
        <a target="_blank"  href="https://github.com/mw-felker">GitHub</a> • {" "}
        <a target="_blank"  href="https://twitter.com/mwfelker">Twitter</a> • {" "}
        <a target="_blank"  href="https://stackoverflow.com/users/127012/m-w-felker">Stack Overflow</a>
      </p>

      <h2>I am a trusted and versatile leader</h2>

      <p>My experience across verticals, industries, and technologies allow me to:</p>

      <ul>
        <li>Shape product visions and strategic opportunities at the executive level</li>
        <li>Drive holistic change management across organizations</li>
        <li>Ship rapid prototypes and best-in-class engineering solutions on time</li>
        <li>Optimize agile software development lifecycles at scale</li>
        <li>Realize organizational capabilities through skills growth and talent acquisition</li>
      </ul>

      <p> Read my latest article on Agile best practices:</p>
      <p>
        <a href="https://maxfelker.medium.com/why-you-should-never-schedule-agile-ceremonies-on-monday-or-friday-e049fd51054e" target='_blank'>
        Why you should never schedule agile ceremonies on Monday or Friday (2 min read) - Medium
        </a>
      </p>

      <h2>I am a cloud native expert</h2>
      <p>Check out my talk about using AI and cloud-native technology at Microsoft Build 2024:</p>
      
      <iframe src="https://www.youtube.com/embed/bLcykUmZNrQ?si=7m3ClFMH5nwMPHOH&amp;start=100" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

     

      <h2>I build video games</h2>

      <p>Since I can remember, I have been designing and building video games. It started off when I was 8 and got access to 3D Studio Max. Since then, it's been a personal mission of mine to approach games with novel technology approaches. Below are a few projects that I'm proud of.</p>

      <h3>The Unicorn Game</h3>

      <p>My daughter is a big fan of the Goal Simulator game series but always asked to play as a unicorn. After finding that there were no unicorn games on the market, I decided to build one. The Unicorn Game is a 3D third-person game where players explore the world as different types of unicorns.</p>
      <iframe src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7325987873235636225?compact=1" frameborder="0" allowfullscreen="" title="Embedded post"></iframe>

      <h3>Terra Major</h3>

      <p>The v0.15.25 proof-of-concept is single player demo set in an arrid desert on Terra Major VIII. In this short play through, we are focusing on core mechanics where players can: </p>
     
      <ul><li>Create an account and login</li><li>Create a character and explore the Terra Major planet surface</li><li>Collect and refine various types of resources such as Cosmocite, Luxium, and Beyon</li></ul>

      <p>Demo is free to try at <a target="_blank" href="https://terramajorgame.com/">terramajorgame.com</a></p>

      <img src="/terra-major-screencap.png" alt="Terramajor" />

      <p><a href="/">Back Home</a></p>
    </div>
  )
}
