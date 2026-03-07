import ScrollReveal from './ScrollReveal'
import styles from './About.module.css'

const skills = [
  'Python', 'TypeScript', 'PyTorch', 'LangChain',
  'React', 'NLP', 'LLM', 'Multi-Agent',
  'Deep Learning', 'Reinforcement Learning', 'FastAPI', 'Docker',
]

export default function About() {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.container}>
        <ScrollReveal>
          <span className={styles.badge}>About Me</span>
          <h2 className={styles.title}>AI로 더 나은 세상을 만듭니다</h2>
          <p className={styles.subtitle}>
            연구와 개발의 경계를 넘나드는 AI 엔지니어
          </p>
        </ScrollReveal>

        <div className={styles.content}>
          <ScrollReveal delay={0.1}>
            <div className={styles.bio}>
              <p>
                안녕하세요, 채니챈(윤채원)입니다.
                자연어 처리와 대화형 AI를 중심으로 연구와 개발을 병행하고 있습니다.
              </p>
              <p>
                특히 LLM 기반 멀티 에이전트 시스템과 AI 윤리에 깊은 관심을 갖고 있으며,
                사람과 AI가 더 의미 있게 소통할 수 있는 방법을 탐구하고 있습니다.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className={styles.skillsBox}>
              <h3 className={styles.skillsTitle}>Tech Stack</h3>
              <div className={styles.skills}>
                {skills.map((skill) => (
                  <span key={skill} className={styles.skill}>{skill}</span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
