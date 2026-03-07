import { Link } from 'react-router-dom'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero} id="about">
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.text}>
            <h1 className={styles.greeting}>
              CHAEWON YOON
            </h1>
            <p className={styles.role}>AI Developer & Researcher</p>
            <p className={styles.affiliation}>
              M.S. Student, Department of Computer Science and AI<br />
              Jeonbuk National University
            </p>
            <div className={styles.interests}>
              <h3>Research Interests</h3>
              <ul>
                <li>Natural Language Processing</li>
                <li>Conversational AI & Dialogue Systems</li>
                <li>Multi-Agent Systems & LLM Applications</li>
                <li>Machine Unlearning</li>
                <li>Retrieval-Augmented Generation</li>
              </ul>
            </div>
            <div className={styles.skills}>
              <h3>Tech Stack</h3>
              <div className={styles.skillTags}>
                <span>Python</span>
                <span>PyTorch</span>
                <span>Hugging Face</span>
                <span>LangChain</span>
                <span>FAISS</span>
                <span>FastAPI</span>
                <span>React</span>
                <span>TypeScript</span>
                <span>Docker</span>
              </div>
            </div>
            <div className={styles.linksGroup}>
              <div className={styles.links}>
                <span className={styles.linksLabel}>About Me</span>
                <Link to="/cv" className={styles.cvLink}>CV</Link>
                <span className={styles.divider}>|</span>
                <Link to="/projects" className={styles.cvLink}>Projects</Link>
                <span className={styles.divider}>|</span>
                <Link to="/blog" className={styles.cvLink}>Blog</Link>
              </div>
              <div className={styles.links}>
                <span className={styles.linksLabel}>Contact Me</span>
                <a href="mailto:chaewon0510@gmail.com" className={styles.link}>Email</a>
                <span className={styles.divider}>|</span>
                <a href="https://github.com/lluvecwonv" className={styles.link} target="_blank" rel="noopener noreferrer">GitHub</a>
                <span className={styles.divider}>|</span>
                <a href="https://www.linkedin.com/in/chaewon-yoon-b378b82b0/" className={styles.link} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </div>
          </div>
          <div className={styles.photo}>
            <img src="/profile.jpg" alt="윤채원" className={styles.profileImg} />
          </div>
        </div>
      </div>
    </section>
  )
}
