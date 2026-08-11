import styles from './styles.module.css'

export default function AboutPage() {

  return (
    <div className={styles.content}>
      <h1>Max Felker</h1>

      <p>
        <a target="_blank" href="https://linkedin.com/in/maxfelker">LinkedIn</a> • {" "}
        <a target="_blank"  href="https://github.com/maxfelker">GitHub</a> • {" "}
        <a target="_blank"  href="https://stackoverflow.com/users/127012/m-w-felker">Stack Overflow</a>
      </p>

      <h2>I am a trusted and versatile leader</h2>

      <p>My super power is realizing the art-of-the-possible. With two decades of experience in technology across disciplines and industries, I am a trusted leader who knows how to take ideas from 0 to 1 and products from 1 to 10. My day to day looks like:</p>

      <ul>
        <li>Shaping product visions and strategic opportunities at the executive level</li>
        <li>Driving holistic change management across organizations</li>
        <li>Shipping both rapid prototypes and best-in-class engineering solutions on time</li>
        <li>Optimizing agile software development lifecycles at scale</li>
        <li>Realizing organizational capabilities through employee skills growth and talent acquisition</li>
      </ul>

      <p>I currently work at the <a target="_blank" href="https://www.microsoft.com/en-us/frontier-company">Microsoft Frontier Company</a> as a Principal Technical Program Manager in the financial services sector. In the past, I have worked in health care, commercial retail, mixed reality, and startup /verticals.</p>

      <h2>I build video games</h2>

      <p>Since I can remember, I have been designing and building video games. It started off when I was 8 and got access to 3D Studio Max. Since then, it's been a personal mission of mine to approach games with novel technology approaches. Below are a few projects that I'm proud of.</p>

      <h3>The Unicorn Game</h3>

      <p>My daughter is a big fan of the Goal Simulator game series but always asked to play as a unicorn. After finding that there were no unicorn games on the market, I decided to build one. The Unicorn Game is a 3D third-person game where players explore the world as different types of unicorns.</p>
      <iframe src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7325987873235636225?compact=1" frameborder="0" allowfullscreen="" title="Embedded post"></iframe>

      <h3>Web-native terrain generator demo</h3>

      <p>I took an infinite-terrain generator I originally built in Unity 6 years ago and rebuilt it as a web-native application using React, Go/WASM, WebGPU, and then deployed it to Azure. The project is an exploration of the art of the possible: what happens when a traditional game-engine workload is rethought around modern browser, cloud, and GPU-native technologies. It is open source on <a target="_blank" href="https://github.com/maxfelker/terrain-webgpu">GitHub</a>, playable live, and still evolving as I experiment with capabilities such as biome stitching.</p>

<iframe src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7440113627061379072?compact=1" frameborder="0" allowfullscreen="" title="Embedded post"></iframe>

      <p><a target="_blank" href="https://terrain-gpu-demo.azurewebsites.net/">See the live demo in your browser</a></p>

      <h3>Terra Major</h3>

      <p>The v0.15.25 proof-of-concept is single player demo set in an arrid desert on Terra Major VIII. In this short play through, we are focusing on core mechanics where players can: </p>
     
      <ul><li>Create an account and login</li><li>Create a character and explore the Terra Major planet surface</li><li>Collect and refine various types of resources such as Cosmocite, Luxium, and Beyon</li></ul>

      <p>Demo is free to try at <a target="_blank" href="https://terramajorgame.com/">terramajorgame.com</a></p>

      <img src="/terra-major-screencap.png" alt="Terramajor" />

      <p><a href="/">Back Home</a></p>
    </div>
  )
}
