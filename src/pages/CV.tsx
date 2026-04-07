import styles from './CV.module.css'

export default function CV() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.name}>Chaewon Yoon</h1>
          <div className={styles.info}>
            <p>Department of Computer Science</p>
            <p>Jeonbuk National University</p>
            <p>567 Baekje-daero, Deokjin-gu, Jeonju-si, Jeonbuk, 54896, Korea</p>
            <div className={styles.contactLinks}>
              <a href="mailto:chaewon0510@gmail.com">chaewon0510@gmail.com</a>
              <span className={styles.dot}>·</span>
              <a href="https://github.com/lluvecwonv" target="_blank" rel="noopener noreferrer">github.com/lluvecwonv</a>
            </div>
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Research Interests</h2>
          <p className={styles.text}>
            Natural Language Processing (NLP), Graph-based Machine Learning, Machine Unlearning,
            Retrieval-Augmented Generation (RAG), and Educational AI Systems.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Education</h2>
          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <strong>Master of Computer Science</strong>
              <span className={styles.date}>Mar. 2024 – Feb. 2026</span>
            </div>
            <div className={styles.entryDetail}>
              <span>Jeonbuk National University, Jeonju, Republic of Korea</span>
            </div>
            <div className={styles.entryDetail}>
              <span>Advisor: <a href="https://sites.google.com/site/songhyunje" target="_blank" rel="noopener noreferrer">Prof. Hyun-Je Song</a></span>
            </div>
          </div>
          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <strong>Bachelor of Library and Information Science & IAB Convergence Studies</strong>
              <span className={styles.date}>Mar. 2020 – Feb. 2024</span>
            </div>
            <div className={styles.entryDetail}>
              <span>Jeonbuk National University, Jeonju, Republic of Korea</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>International Publications</h2>
          <ul className={styles.pubList}>
            <li>
              H. Jin, <strong>C. Yoon</strong>, Y. Oh, and H.-J. Song, "Abstractive Aspect-Based Comparative Summarization,"
              <em>Companion Proceedings of the ACM Web Conference (WWW)</em>, 2025.
            </li>
            <li>
              H. Jin<sup>†</sup>, <strong>C. Yoon</strong><sup>†</sup>, and H.-J. Song, "Curriculum Planning for Independent Majors with Large Language Models,"
              <em>International Conference on Artificial Intelligence in Education (AIED)</em>, 2025. <strong>(† Co-first authors)</strong>
            </li>
            <li>
              <strong>C. Yoon</strong>, D. Kim, and H.-J. Song, "Selective Span-Level Unlearning for Large Language Models,"
              <em>In Proceedings of the 64th Annual Meeting of the Association for Computational Linguistics (ACL)</em>, 2026. <strong>(Main)</strong>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Domestic Publications</h2>
          <ul className={styles.pubList}>
            <li>
              <strong>C. Yoon</strong> and H. Song, "Measuring Memorization in Large Language Models via Paraphrase Generation,"
              <em>Proceedings of the Korea Software Congress</em>, 2025.
            </li>
            <li>
              S. Cho, H. Jin, <strong>C. Yoon</strong>, H. Kim, and H. Song, "Personalized Curriculum Recommendation System for Career Pathways,"
              <em>Proceedings of the Korea Software Congress</em>, 2024. <strong>(Best Paper Award)</strong>
            </li>
            <li>
              <strong>C. Yoon</strong> and H. Song, "Unlearning of Large Language Models Based on Question-Answering,"
              <em>Proceedings of the Korea Computer Congress</em>, 2024.
            </li>
            <li>
              <strong>C. Yoon</strong> and H. Song, "Large Language Model Unlearning based on Question Answering,"
              <em>Proceedings of the Korea Software Congress</em>, 2024.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Skills</h2>
          <ul className={styles.skillList}>
            <li>Proficient in PyTorch and open-source libraries (Hugging Face, LangChain, FAISS) for NLP/IR tasks.</li>
            <li>Experience with retrieval-augmented generation (RAG), machine unlearning, graph-based recommendation systems, LangGraph-based conversational architectures, and text summarization.</li>
            <li>Backend development with FastAPI; deployed microservice-based chatbot systems (AI Mentor for JBNU).</li>
            <li>Languages: Fluent in English, skilled in academic writing and research presentations.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Projects</h2>
          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <strong>Game Agent Development for AI Ethics Education</strong>
            </div>
            <p className={styles.text}>
              Developed a multi-agent dialogue system for an AI ethics dialogue game, designing persona-based agents
              and dialogue flows to promote social perspective-taking and ethical reasoning in AI-related dilemmas.
            </p>
          </div>
          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <strong>AI Mentor for JBNU</strong>
            </div>
            <p className={styles.text}>
              Developed a multi-agent academic mentoring system using LangGraph, FAISS, and FastAPI, providing
              personalized curriculum recommendations and academic guidance based on JBNU's academic information.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Awards</h2>
          <ul className={styles.skillList}>
            <li>Best Paper Award, Korea Software Congress, 2024.</li>
            <li>3rd Place, Local Community Problem-Solving with Public Data Competition (Jeonju, 2022).</li>
            <li>4th Place, Financial Service Proposals using User Payment Data (Big Data Hackathon), Shinhan Financial Group, 2022.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
