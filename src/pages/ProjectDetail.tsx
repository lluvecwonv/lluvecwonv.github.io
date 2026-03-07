import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams, Link } from 'react-router-dom'
import LocaleToggle from '../components/LocaleToggle'
import { useAdminAuth } from '../context/AdminAuthContext'
import { getLocalizedProject, getProjectDetailText, useProjectLocale, type ProjectView } from '../lib/projectI18n'
import { getManagedProjectBySlug, saveProjectTranslationOverride } from '../lib/projectStorage'
import styles from './ProjectDetail.module.css'

interface TranslationSectionFormState {
  heading: string
  body: string
}

interface TranslationFormState {
  subtitle: string
  description: string
  paper: string
  paperTitle: string
  sections: TranslationSectionFormState[]
}

function createTranslationForm(project: ProjectView): TranslationFormState {
  return {
    subtitle: project.displaySubtitle || '',
    description: project.displayDescription,
    paper: project.displayPaper || '',
    paperTitle: project.displayPaperTitle || '',
    sections: project.displaySections.map((section) => ({
      heading: section.heading,
      body: section.body,
    })),
  }
}

export default function ProjectDetail() {
  const location = useLocation()
  const autoOpenEditorRef = useRef(false)
  const { isAdmin } = useAdminAuth()
  const [locale, setLocale] = useProjectLocale()
  const [isEditing, setIsEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const { slug } = useParams<{ slug: string }>()
  const project = slug ? getManagedProjectBySlug(slug) : undefined
  const localizedProject = useMemo(
    () => (project ? getLocalizedProject(project, locale) : undefined),
    [locale, project],
  )
  const [form, setForm] = useState<TranslationFormState | null>(
    () => (localizedProject ? createTranslationForm(localizedProject) : null),
  )
  const pageText = useMemo(
    () => getProjectDetailText(locale),
    [locale],
  )

  useEffect(() => {
    if (!localizedProject || !isEditing) return
    setForm(createTranslationForm(localizedProject))
  }, [localizedProject, locale, isEditing])

  useEffect(() => {
    if (!saveMessage) return
    const timeoutId = window.setTimeout(() => setSaveMessage(''), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [saveMessage])

  useEffect(() => {
    if (!isAdmin || !localizedProject || autoOpenEditorRef.current) return

    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('edit') !== '1') return

    autoOpenEditorRef.current = true
    setForm(createTranslationForm(localizedProject))
    setIsEditing(true)
  }, [isAdmin, localizedProject, location.search])

  const openEditor = () => {
    if (!localizedProject) return
    setForm(createTranslationForm(localizedProject))
    setIsEditing(true)
  }

  const handleSectionChange = (index: number, field: keyof TranslationSectionFormState, value: string) => {
    setForm((current) => {
      if (!current) return current

      return {
        ...current,
        sections: current.sections.map((section, sectionIndex) => (
          sectionIndex === index
            ? { ...section, [field]: value }
            : section
        )),
      }
    })
  }

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!project || !form) return

    saveProjectTranslationOverride(project.slug, locale, {
      subtitle: form.subtitle,
      description: form.description,
      paper: form.paper,
      paperTitle: form.paperTitle,
      sections: form.sections.map((section) => ({
        heading: section.heading,
        body: section.body,
      })),
    })

    setIsEditing(false)
    setSaveMessage(locale === 'ko' ? '한국어 버전을 저장했어요.' : 'English version saved.')
  }

  if (!localizedProject) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.topBar}>
            <Link to="/projects" className={styles.back}>{pageText.backToProjects}</Link>
            <div className={styles.topControls}>
              <LocaleToggle value={locale} onChange={setLocale} />
            </div>
          </div>
          <p>{pageText.notFound}</p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <Link to="/projects" className={styles.back}>{pageText.backToProjects}</Link>
          <div className={styles.topControls}>
            <LocaleToggle value={locale} onChange={setLocale} />
            {isAdmin && (
              <button type="button" className={styles.editButton} onClick={openEditor}>
                {locale === 'ko' ? 'KO 수정' : 'EN Edit'}
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.category}>{localizedProject.displayCategory}</span>
          <h1 className={styles.title}>{localizedProject.displayTitle}</h1>
          {localizedProject.displaySubtitle && (
            <p className={styles.subtitle}>{localizedProject.displaySubtitle}</p>
          )}
          <div className={styles.tags}>
            {localizedProject.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
          <div className={styles.links}>
            {localizedProject.displayPaper && localizedProject.paperUrl ? (
              <a
                href={localizedProject.paperUrl}
                className={styles.paperBadgeLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {localizedProject.displayPaper}
              </a>
            ) : localizedProject.displayPaper ? (
              <span className={styles.paperBadge}>{localizedProject.displayPaper}</span>
            ) : null}
            {localizedProject.github && (
              <a href={localizedProject.github} className={styles.githubLink} target="_blank" rel="noopener noreferrer">
                GitHub →
              </a>
            )}
            {localizedProject.demo && (
              <a href={localizedProject.demo} className={styles.githubLink} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.75rem' }}>
                Demo →
              </a>
            )}
          </div>
        </div>

        {isAdmin && isEditing && form && (
          <form className={styles.editorCard} onSubmit={handleSave}>
            <div className={styles.editorHeader}>
              <div>
                <h2 className={styles.editorTitle}>
                  {locale === 'ko' ? '현재 한국어 버전 수정' : 'Edit current English version'}
                </h2>
                <p className={styles.editorText}>
                  프로젝트 제목은 원문 그대로 유지됩니다. 지금 보이는 {locale.toUpperCase()} 버전의 설명과 섹션만 수정합니다.
                </p>
              </div>
            </div>

            <label className={styles.field}>
              Subtitle
              <input
                type="text"
                value={form.subtitle}
                onChange={(event) => setForm((current) => (
                  current ? { ...current, subtitle: event.target.value } : current
                ))}
                className={styles.input}
              />
            </label>

            <label className={styles.field}>
              카드 설명
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => (
                  current ? { ...current, description: event.target.value } : current
                ))}
                className={styles.textarea}
                rows={4}
              />
            </label>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                논문/행사명
                <input
                  type="text"
                  value={form.paper}
                  onChange={(event) => setForm((current) => (
                    current ? { ...current, paper: event.target.value } : current
                  ))}
                  className={styles.input}
                />
              </label>

              <label className={styles.field}>
                논문 제목
                <input
                  type="text"
                  value={form.paperTitle}
                  onChange={(event) => setForm((current) => (
                    current ? { ...current, paperTitle: event.target.value } : current
                  ))}
                  className={styles.input}
                />
              </label>
            </div>

            <div className={styles.sectionEditor}>
              {form.sections.map((section, index) => (
                <div key={`${localizedProject.slug}-${locale}-${index}`} className={styles.sectionCard}>
                  <h3 className={styles.sectionEditorTitle}>섹션 {index + 1}</h3>
                  <label className={styles.field}>
                    섹션 제목
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(event) => handleSectionChange(index, 'heading', event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    섹션 본문
                    <textarea
                      value={section.body}
                      onChange={(event) => handleSectionChange(index, 'body', event.target.value)}
                      className={styles.textarea}
                      rows={6}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => {
                  setIsEditing(false)
                  setForm(createTranslationForm(localizedProject))
                }}
              >
                취소
              </button>
              <button type="submit" className={styles.primaryButton}>
                저장
              </button>
            </div>
          </form>
        )}

        {/* Sections */}
        <div className={styles.content}>
          {localizedProject.displaySections.map((section, i) => (
            <section key={i} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.heading}</h2>
              {section.body.includes('\n\n') ? (
                section.body.split('\n\n').map((para, pi) => (
                  <p key={pi} className={styles.text}>{para}</p>
                ))
              ) : (
                <p className={styles.text}>{section.body}</p>
              )}
              {section.html && (
                <div className={styles.tableWrap} dangerouslySetInnerHTML={{ __html: section.html }} />
              )}
              {section.images && section.images.length > 0 && (
                <div className={styles.imageGrid}>
                  {section.images.map((img, j) => (
                    <figure key={j} className={styles.figure}>
                      <img src={img.src} alt={img.caption} className={styles.image} />
                      <figcaption className={styles.caption}>{img.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Tech Stack */}
          {localizedProject.techStack && localizedProject.techStack.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{pageText.techStack}</h2>
              <div className={styles.techTags}>
                {localizedProject.techStack.map((tech) => (
                  <span key={tech} className={styles.techTag}>{tech}</span>
                ))}
              </div>
            </section>
          )}

          {/* Paper reference */}
          {localizedProject.displayPaperTitle && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{pageText.paper}</h2>
              <p className={styles.paperRef}>
                {localizedProject.paperUrl ? (
                  <a
                    href={localizedProject.paperUrl}
                    className={styles.paperTitleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    "{localizedProject.displayPaperTitle}"
                  </a>
                ) : (
                  `"${localizedProject.displayPaperTitle}"`
                )}{' '}
                — {localizedProject.displayPaper}
              </p>
            </section>
          )}
        </div>
      </div>

      {saveMessage && <div className={styles.toast}>{saveMessage}</div>}
    </main>
  )
}
