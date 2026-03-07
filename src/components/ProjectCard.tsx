import { Link } from 'react-router-dom'
import type { Project } from '../data/projects'
import type { ProjectView } from '../lib/projectI18n'
import styles from './ProjectCard.module.css'

type ProjectCardProject = Project | ProjectView

interface Props {
  project: ProjectCardProject
  onEdit?: () => void
}

export default function ProjectCard({ project, onEdit }: Props) {
  const title = 'displayTitle' in project ? project.displayTitle : project.title
  const subtitle = 'displaySubtitle' in project ? project.displaySubtitle : project.subtitle
  const description = 'displayDescription' in project ? project.displayDescription : project.description
  const paper = 'displayPaper' in project ? project.displayPaper : project.paper

  return (
    <div className={styles.cardShell}>
      {onEdit && (
        <button
          type="button"
          className={styles.editButton}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onEdit()
          }}
        >
          Edit
        </button>
      )}

      <Link to={`/projects/${project.slug}`} className={styles.card}>
        <div className={styles.tags}>
          {project.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}
        <p className={styles.desc}>{description}</p>
        <div className={styles.meta}>
          {paper && (
            <span className={styles.paper}>{paper}</span>
          )}
          {project.github && (
            <span className={styles.github}>GitHub</span>
          )}
        </div>
      </Link>
    </div>
  )
}
