import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LocaleToggle from '../components/LocaleToggle'
import ProjectCard from '../components/ProjectCard'
import { useAdminAuth } from '../context/AdminAuthContext'
import { getLocalizedCategoryLabel, getLocalizedProject, getProjectsPageText, useProjectLocale } from '../lib/projectI18n'
import { addProjectCategory, deleteCustomProject, getManagedProjects, getProjectCategories, removeProjectCategory, saveCustomProject, slugifyProjectTitle, type ManagedProject } from '../lib/projectStorage'
import styles from './Projects.module.css'

interface ProjectSectionDraft {
  heading: string
  body: string
}

interface ProjectFormState {
  title: string
  slug: string
  subtitle: string
  description: string
  category: string
  tags: string
  github: string
  paper: string
  paperTitle: string
  thumbnail: string
  techStack: string
  sections: ProjectSectionDraft[]
}

function createEmptySection(): ProjectSectionDraft {
  return {
    heading: '',
    body: '',
  }
}

function createEmptyForm(category = ''): ProjectFormState {
  return {
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    category,
    tags: '',
    github: '',
    paper: '',
    paperTitle: '',
    thumbnail: '',
    techStack: '',
    sections: [createEmptySection()],
  }
}

export default function Projects() {
  const navigate = useNavigate()
  const { isAdmin } = useAdminAuth()
  const [locale, setLocale] = useProjectLocale()
  const [projectList, setProjectList] = useState(getManagedProjects)
  const [categories, setCategories] = useState(getProjectCategories)
  const [customCategory, setCustomCategory] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState<ProjectFormState>(() => createEmptyForm(getProjectCategories()[0] || ''))

  useEffect(() => {
    const sync = () => {
      setProjectList(getManagedProjects())
      setCategories(getProjectCategories())
    }

    window.addEventListener('projects-storage-changed', sync)
    return () => window.removeEventListener('projects-storage-changed', sync)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (!form.category && categories.length > 0) {
      setForm((current) => ({ ...current, category: categories[0] }))
    }
  }, [categories, form.category])

  const customProjects = useMemo(
    () => projectList.filter((project) => project.source === 'custom'),
    [projectList],
  )

  const visibleCategories = useMemo(
    () => categories.filter((category) => isAdmin || projectList.some((project) => project.category === category)),
    [categories, isAdmin, projectList],
  )

  const localizedProjects = useMemo(
    () => new Map(projectList.map((project) => [project.slug, getLocalizedProject(project, locale)])),
    [locale, projectList],
  )

  const pageText = useMemo(
    () => getProjectsPageText(locale),
    [locale],
  )

  const baseCategories = useMemo(
    () => new Set(projectList.filter((project) => project.source === 'base').map((project) => project.category)),
    [projectList],
  )

  const resetForm = (nextCategory = categories[0] || '') => {
    setForm(createEmptyForm(nextCategory))
    setEditingSlug(null)
  }

  const handleOpenComposer = () => {
    setIsComposerOpen((current) => {
      const next = !current
      if (!next) resetForm(form.category || categories[0] || '')
      return next
    })
  }

  const handleTitleChange = (title: string) => {
    setForm((current) => {
      const currentAutoSlug = slugifyProjectTitle(current.title)
      const nextAutoSlug = slugifyProjectTitle(title)

      return {
        ...current,
        title,
        slug: !current.slug || current.slug === currentAutoSlug ? nextAutoSlug : current.slug,
      }
    })
  }

  const handleSectionChange = (index: number, field: keyof ProjectSectionDraft, value: string) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) => (
        sectionIndex === index
          ? { ...section, [field]: value }
          : section
      )),
    }))
  }

  const handleAddCategory = () => {
    const result = addProjectCategory(customCategory)
    setToast(result.message)

    if (!result.ok) return

    setCustomCategory('')
    if (result.category) {
      setForm((current) => ({ ...current, category: result.category || current.category }))
    }
  }

  const handleRemoveCategory = (category: string) => {
    const result = removeProjectCategory(category)
    setToast(result.message)
  }

  const handleSaveProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const existingProject = editingSlug
      ? projectList.find((project) => project.slug === editingSlug)
      : undefined
    const title = form.title.trim()
    const slug = form.slug.trim() || slugifyProjectTitle(form.title)
    const description = form.description.trim()
    const category = form.category.trim()
    const sections = form.sections
      .map((section, index) => ({
        heading: section.heading.trim(),
        body: section.body.trim(),
        images: existingProject?.sections[index]?.images,
        html: existingProject?.sections[index]?.html,
      }))
      .filter((section) => section.heading || section.body)

    if (!title || !slug || !description || !category) {
      setToast('제목, 슬러그, 설명, 카테고리를 모두 입력해주세요.')
      return
    }

    if (sections.length === 0 || sections.some((section) => !section.heading || !section.body)) {
      setToast('섹션은 최소 1개 필요하고, 제목과 본문을 모두 채워야 해요.')
      return
    }

    const hasDuplicateSlug = projectList.some((project) => (
      project.slug === slug && project.slug !== editingSlug
    ))

    if (hasDuplicateSlug) {
      setToast('이미 같은 슬러그가 있어서 다른 슬러그를 써야 해요.')
      return
    }

    saveCustomProject({
      slug,
      title,
      subtitle: form.subtitle.trim() || undefined,
      description,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      category,
      github: form.github.trim() || undefined,
      paper: form.paper.trim() || undefined,
      paperUrl: existingProject?.paperUrl,
      paperTitle: form.paperTitle.trim() || undefined,
      thumbnail: form.thumbnail.trim() || undefined,
      sections,
      techStack: form.techStack.split(',').map((tech) => tech.trim()).filter(Boolean),
    }, editingSlug || undefined)

    setToast(editingSlug ? '프로젝트를 수정했어요.' : '프로젝트를 저장했어요.')
    resetForm(category)
    setIsComposerOpen(false)
  }

  const handleEditProject = (project: ManagedProject) => {
    navigate(`/projects/${project.slug}?edit=1`)
  }

  const handleDeleteProject = (project: ManagedProject) => {
    if (!confirm(`"${project.title}" 프로젝트를 삭제할까요?`)) return

    const deleted = deleteCustomProject(project.slug)
    if (!deleted) {
      setToast('삭제할 프로젝트를 찾지 못했어요.')
      return
    }

    if (editingSlug === project.slug) {
      resetForm(categories[0] || '')
      setIsComposerOpen(false)
    }

    setToast('프로젝트를 삭제했어요.')
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <h1 className={styles.title}>{pageText.title}</h1>
            <p className={styles.subtitle}>{pageText.subtitle}</p>
          </div>
          <LocaleToggle value={locale} onChange={setLocale} />
        </div>

        {isAdmin && (
          <section className={styles.adminPanel}>
            <div className={styles.adminSummary}>
              <div className={styles.adminSummaryContent}>
                <div>
                  <span className={styles.adminBadge}>관리자 모드</span>
                  <h2 className={styles.adminTitle}>프로젝트와 카테고리를 여기서 직접 관리할 수 있어요.</h2>
                  <p className={styles.adminText}>
                    지금 버전은 브라우저 `localStorage`에 저장됩니다. 실제 배포용 관리자 기능은 추후 백엔드 인증으로 바꾸면 됩니다.
                  </p>
                </div>
                <button type="button" className={styles.primaryButton} onClick={handleOpenComposer}>
                  {isComposerOpen ? '작성 닫기' : '프로젝트 작성'}
                </button>
              </div>
            </div>

            <div className={styles.adminGrid}>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>카테고리 관리</h3>
                  <p className={styles.panelText}>새 카테고리를 추가하고, 비어 있는 커스텀 카테고리는 삭제할 수 있어요.</p>
                </div>

                <div className={styles.inlineForm}>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(event) => setCustomCategory(event.target.value)}
                    className={styles.input}
                    placeholder="새 카테고리 이름"
                  />
                  <button type="button" className={styles.secondaryButton} onClick={handleAddCategory}>
                    추가
                  </button>
                </div>

                <div className={styles.chipList}>
                  {categories.map((category) => {
                    const isBaseCategory = baseCategories.has(category)

                    return (
                      <div key={category} className={styles.categoryChip}>
                        <div>
                          <strong>{category}</strong>
                          <span>{isBaseCategory ? '기본' : '커스텀'}</span>
                        </div>
                        {!isBaseCategory && (
                          <button type="button" className={styles.chipAction} onClick={() => handleRemoveCategory(category)}>
                            삭제
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>커스텀 프로젝트</h3>
                  <p className={styles.panelText}>관리자 작성 프로젝트는 수정/삭제가 가능합니다.</p>
                </div>

                <div className={styles.projectAdminList}>
                  {customProjects.length > 0 ? customProjects.map((project) => (
                    <div key={project.slug} className={styles.projectAdminItem}>
                      <div>
                        <strong>{project.title}</strong>
                        <span>{project.category}</span>
                      </div>
                      <div className={styles.projectAdminActions}>
                        <button type="button" className={styles.secondaryButton} onClick={() => handleEditProject(project)}>
                          수정
                        </button>
                        <button type="button" className={styles.dangerButton} onClick={() => handleDeleteProject(project)}>
                          삭제
                        </button>
                      </div>
                    </div>
                  )) : (
                    <p className={styles.emptyAdmin}>아직 직접 작성한 프로젝트가 없어요.</p>
                  )}
                </div>
              </div>
            </div>

            {isComposerOpen && (
              <form className={styles.editorCard} onSubmit={handleSaveProject}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>
                    {editingSlug ? '프로젝트 수정' : '새 프로젝트 작성'}
                  </h3>
                  <p className={styles.panelText}>
                    카드 목록과 상세 페이지에 바로 반영되는 프로젝트를 추가합니다.
                  </p>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    제목
                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) => handleTitleChange(event.target.value)}
                      className={styles.input}
                      placeholder="프로젝트 제목"
                    />
                  </label>

                  <label className={styles.field}>
                    슬러그
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(event) => setForm((current) => ({ ...current, slug: slugifyProjectTitle(event.target.value) }))}
                      className={styles.input}
                      placeholder="project-slug"
                    />
                  </label>

                  <label className={styles.field}>
                    서브타이틀
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))}
                      className={styles.input}
                      placeholder="짧은 설명"
                    />
                  </label>

                  <label className={styles.field}>
                    카테고리
                    <select
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                      className={styles.input}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className={styles.field}>
                  카드 설명
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className={styles.textarea}
                    placeholder="목록 카드에 들어갈 대표 설명"
                    rows={4}
                  />
                </label>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    태그
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                      className={styles.input}
                      placeholder="LLM, Unlearning, Research"
                    />
                  </label>

                  <label className={styles.field}>
                    기술 스택
                    <input
                      type="text"
                      value={form.techStack}
                      onChange={(event) => setForm((current) => ({ ...current, techStack: event.target.value }))}
                      className={styles.input}
                      placeholder="Python, React, FastAPI"
                    />
                  </label>

                  <label className={styles.field}>
                    GitHub 링크
                    <input
                      type="url"
                      value={form.github}
                      onChange={(event) => setForm((current) => ({ ...current, github: event.target.value }))}
                      className={styles.input}
                      placeholder="https://github.com/..."
                    />
                  </label>

                  <label className={styles.field}>
                    썸네일 URL
                    <input
                      type="text"
                      value={form.thumbnail}
                      onChange={(event) => setForm((current) => ({ ...current, thumbnail: event.target.value }))}
                      className={styles.input}
                      placeholder="/projects/example.png"
                    />
                  </label>

                  <label className={styles.field}>
                    논문/행사명
                    <input
                      type="text"
                      value={form.paper}
                      onChange={(event) => setForm((current) => ({ ...current, paper: event.target.value }))}
                      className={styles.input}
                      placeholder="Under Review"
                    />
                  </label>

                  <label className={styles.field}>
                    논문 제목
                    <input
                      type="text"
                      value={form.paperTitle}
                      onChange={(event) => setForm((current) => ({ ...current, paperTitle: event.target.value }))}
                      className={styles.input}
                      placeholder="논문 제목"
                    />
                  </label>
                </div>

                <div className={styles.sectionEditor}>
                  <div className={styles.sectionEditorHeader}>
                    <div>
                      <h4 className={styles.sectionTitle}>상세 섹션</h4>
                      <p className={styles.panelText}>프로젝트 상세 페이지에 표시할 섹션을 작성해주세요.</p>
                    </div>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setForm((current) => ({
                        ...current,
                        sections: [...current.sections, createEmptySection()],
                      }))}
                    >
                      섹션 추가
                    </button>
                  </div>

                  <div className={styles.sectionList}>
                    {form.sections.map((section, index) => (
                      <div key={`${editingSlug || 'new'}-${index}`} className={styles.sectionCard}>
                        <div className={styles.sectionCardHeader}>
                          <strong>섹션 {index + 1}</strong>
                          {form.sections.length > 1 && (
                            <button
                              type="button"
                              className={styles.chipAction}
                              onClick={() => setForm((current) => ({
                                ...current,
                                sections: current.sections.filter((_, sectionIndex) => sectionIndex !== index),
                              }))}
                            >
                              제거
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={section.heading}
                          onChange={(event) => handleSectionChange(index, 'heading', event.target.value)}
                          className={styles.input}
                          placeholder="섹션 제목"
                        />
                        <textarea
                          value={section.body}
                          onChange={(event) => handleSectionChange(index, 'body', event.target.value)}
                          className={styles.textarea}
                          placeholder="섹션 본문"
                          rows={5}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => {
                      resetForm(categories[0] || '')
                      setIsComposerOpen(false)
                    }}
                  >
                    취소
                  </button>
                  <button type="submit" className={styles.primaryButton}>
                    {editingSlug ? '프로젝트 수정' : '프로젝트 저장'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {visibleCategories.map((category) => (
          <section key={category} className={styles.section}>
            <h2 className={styles.categoryTitle}>{getLocalizedCategoryLabel(category, locale)}</h2>
            <div className={styles.grid}>
              {projectList
                .filter((p) => p.category === category)
                .map((project) => (
                  <ProjectCard
                    key={project.slug}
                    project={localizedProjects.get(project.slug) ?? getLocalizedProject(project, locale)}
                  />
                ))}
            </div>
            {isAdmin && projectList.filter((project) => project.category === category).length === 0 && (
              <p className={styles.emptyCategory}>아직 이 카테고리에는 프로젝트가 없습니다.</p>
            )}
          </section>
        ))}
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </main>
  )
}
