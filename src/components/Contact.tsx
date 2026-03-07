import styles from './Contact.module.css'

export default function Contact() {
  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.links}>
          <a href="mailto:hello@chanichan.dev">Email</a>
          <a href="https://github.com/chanichan" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/chaewon-yoon-b378b82b0/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
        <p className={styles.copy}>&copy; 윤채원 2025</p>
      </div>
    </footer>
  )
}
