import { timelineData } from '../data/timeline'
import styles from './Timeline.module.css'

export default function Timeline() {
  return (
    <section id="timeline" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Timeline</h2>
        <div className={styles.list}>
          {timelineData.map((item) => (
            <div key={item.number} className={styles.item}>
              <div className={styles.period}>{item.period || ''}</div>
              <div className={styles.content}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.itemDesc}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
