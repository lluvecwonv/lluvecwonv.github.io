import type { ProjectLocale } from '../data/projectTranslations'
import styles from './LocaleToggle.module.css'

interface Props {
  value: ProjectLocale
  onChange: (locale: ProjectLocale) => void
  className?: string
}

export default function LocaleToggle({ value, onChange, className }: Props) {
  const rootClassName = className ? `${styles.toggle} ${className}` : styles.toggle

  return (
    <div className={rootClassName} aria-label="Project language toggle">
      <button
        type="button"
        className={value === 'ko' ? `${styles.option} ${styles.optionActive}` : styles.option}
        onClick={() => onChange('ko')}
        aria-pressed={value === 'ko'}
      >
        KO
      </button>
      <button
        type="button"
        className={value === 'en' ? `${styles.option} ${styles.optionActive}` : styles.option}
        onClick={() => onChange('en')}
        aria-pressed={value === 'en'}
      >
        EN
      </button>
    </div>
  )
}
