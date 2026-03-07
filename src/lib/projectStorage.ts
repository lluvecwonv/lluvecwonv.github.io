import { projects as baseProjects, type Project } from '../data/projects'
import type {
  LocalizedProjectImageTranslation,
  LocalizedProjectSectionTranslation,
  LocalizedProjectTranslation,
  ProjectLocale,
} from '../data/projectTranslations'

const CUSTOM_PROJECTS_KEY = 'customProjects'
const CUSTOM_PROJECT_CATEGORIES_KEY = 'customProjectCategories'
const PROJECT_TRANSLATIONS_KEY = 'projectTranslationOverrides'
export const PROJECT_STORAGE_EVENT = 'projects-storage-changed'

export interface ManagedProject extends Project {
  source: 'base' | 'custom'
  createdAt?: string
  updatedAt?: string
}

interface CategoryMutationResult {
  ok: boolean
  message: string
  category?: string
}

type ProjectTranslationOverrides = Record<string, Partial<Record<ProjectLocale, LocalizedProjectTranslation>>>

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function notifyStorageChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PROJECT_STORAGE_EVENT))
}

export function slugifyProjectTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeProject(project: Partial<ManagedProject>): ManagedProject {
  return {
    slug: project.slug?.trim() || 'untitled-project',
    title: project.title?.trim() || 'Untitled Project',
    subtitle: project.subtitle?.trim() || undefined,
    description: project.description?.trim() || '',
    tags: (project.tags || []).map((tag) => tag.trim()).filter(Boolean),
    category: project.category?.trim() || 'Uncategorized',
    github: project.github?.trim() || undefined,
    paper: project.paper?.trim() || undefined,
    paperUrl: project.paperUrl?.trim() || undefined,
    paperTitle: project.paperTitle?.trim() || undefined,
    thumbnail: project.thumbnail?.trim() || undefined,
    sections: (project.sections || [])
      .map((section) => ({
        heading: section.heading.trim(),
        body: section.body.trim(),
        images: section.images?.map((image) => ({
          src: image.src.trim(),
          caption: image.caption.trim(),
        })).filter((image) => image.src && image.caption),
        html: section.html?.trim() || undefined,
      }))
      .filter((section) => section.heading && section.body),
    techStack: project.techStack?.map((tech) => tech.trim()).filter(Boolean),
    source: project.source || 'custom',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

function getStoredCustomProjects() {
  return readJson<ManagedProject[]>(CUSTOM_PROJECTS_KEY, []).map(normalizeProject)
}

function getStoredCustomCategories() {
  return readJson<string[]>(CUSTOM_PROJECT_CATEGORIES_KEY, [])
    .map((category) => category.trim())
    .filter(Boolean)
}

function normalizeLocalizedImageTranslation(image: Partial<LocalizedProjectImageTranslation> | undefined) {
  if (!image) return undefined

  return {
    caption: typeof image.caption === 'string' ? image.caption.trim() : undefined,
  }
}

function normalizeLocalizedSectionTranslation(section: Partial<LocalizedProjectSectionTranslation> | undefined) {
  if (!section) return undefined

  return {
    heading: typeof section.heading === 'string' ? section.heading.trim() : undefined,
    body: typeof section.body === 'string' ? section.body.trim() : undefined,
    html: typeof section.html === 'string' ? section.html.trim() : undefined,
    images: section.images?.map(normalizeLocalizedImageTranslation),
  }
}

function normalizeLocalizedTranslation(translation: Partial<LocalizedProjectTranslation> | undefined) {
  if (!translation) return undefined

  return {
    subtitle: typeof translation.subtitle === 'string' ? translation.subtitle.trim() : undefined,
    description: typeof translation.description === 'string' ? translation.description.trim() : undefined,
    paper: typeof translation.paper === 'string' ? translation.paper.trim() : undefined,
    paperTitle: typeof translation.paperTitle === 'string' ? translation.paperTitle.trim() : undefined,
    sections: translation.sections?.map(normalizeLocalizedSectionTranslation),
  }
}

export function getStoredProjectTranslationOverrides() {
  const overrides = readJson<ProjectTranslationOverrides>(PROJECT_TRANSLATIONS_KEY, {})

  return Object.fromEntries(
    Object.entries(overrides).map(([slug, locales]) => [
      slug,
      Object.fromEntries(
        Object.entries(locales).flatMap(([locale, translation]) => {
          const normalizedTranslation = normalizeLocalizedTranslation(translation)
          return normalizedTranslation ? [[locale, normalizedTranslation]] : []
        }),
      ),
    ]),
  ) as ProjectTranslationOverrides
}

function persistCustomProjects(projects: ManagedProject[]) {
  writeJson(CUSTOM_PROJECTS_KEY, projects)
  notifyStorageChanged()
}

function persistCustomCategories(categories: string[]) {
  writeJson(CUSTOM_PROJECT_CATEGORIES_KEY, categories)
  notifyStorageChanged()
}

export function getManagedProjects() {
  const customProjects = getStoredCustomProjects()
    .sort((left, right) => (right.updatedAt || '').localeCompare(left.updatedAt || ''))
  const baseSlugs = new Set(baseProjects.map((project) => project.slug))
  const customProjectsBySlug = new Map(customProjects.map((project) => [project.slug, project]))

  const standaloneCustomProjects = customProjects.filter((project) => !baseSlugs.has(project.slug))
  const mergedBaseProjects = baseProjects.map((project) => (
    customProjectsBySlug.get(project.slug) ?? {
      ...project,
      source: 'base' as const,
    }
  ))

  return [...standaloneCustomProjects, ...mergedBaseProjects]
}

export function getManagedProjectBySlug(slug: string) {
  return getManagedProjects().find((project) => project.slug === slug)
}

export function getProjectCategories() {
  const baseCategories = baseProjects.map((project) => project.category)
  const customCategories = getStoredCustomCategories()
  const customProjectCategories = getStoredCustomProjects().map((project) => project.category)

  return Array.from(new Set([
    ...baseCategories,
    ...customCategories,
    ...customProjectCategories,
  ]))
}

export function addProjectCategory(input: string): CategoryMutationResult {
  const category = input.trim()

  if (!category) {
    return { ok: false, message: '카테고리 이름을 입력해주세요.' }
  }

  const categories = getProjectCategories()
  if (categories.includes(category)) {
    return { ok: false, message: '이미 존재하는 카테고리예요.' }
  }

  const customCategories = getStoredCustomCategories()
  persistCustomCategories([...customCategories, category])

  return {
    ok: true,
    message: `카테고리 "${category}"를 추가했어요.`,
    category,
  }
}

export function saveProjectTranslationOverride(
  slug: string,
  locale: ProjectLocale,
  translation: Partial<LocalizedProjectTranslation>,
) {
  const overrides = getStoredProjectTranslationOverrides()
  const normalizedTranslation = normalizeLocalizedTranslation(translation)

  if (!normalizedTranslation) return

  writeJson(PROJECT_TRANSLATIONS_KEY, {
    ...overrides,
    [slug]: {
      ...overrides[slug],
      [locale]: normalizedTranslation,
    },
  })
  notifyStorageChanged()
}

export function removeProjectCategory(input: string): CategoryMutationResult {
  const category = input.trim()
  const baseCategories = new Set(baseProjects.map((project) => project.category))

  if (baseCategories.has(category)) {
    return { ok: false, message: '기본 카테고리는 삭제할 수 없어요.' }
  }

  const projectsUsingCategory = getManagedProjects().filter((project) => project.category === category)
  if (projectsUsingCategory.length > 0) {
    return { ok: false, message: '이 카테고리를 사용하는 프로젝트가 있어서 먼저 옮기거나 삭제해야 해요.' }
  }

  const customCategories = getStoredCustomCategories()
  const nextCategories = customCategories.filter((item) => item !== category)

  if (customCategories.length === nextCategories.length) {
    return { ok: false, message: '삭제할 수 있는 커스텀 카테고리가 아니에요.' }
  }

  persistCustomCategories(nextCategories)

  return {
    ok: true,
    message: `카테고리 "${category}"를 삭제했어요.`,
  }
}

export function saveCustomProject(project: Project, previousSlug?: string) {
  const now = new Date().toISOString()
  const customProjects = getStoredCustomProjects()
  const existingProject = customProjects.find((item) => item.slug === previousSlug || item.slug === project.slug)
  const normalizedProject = normalizeProject({
    ...project,
    source: 'custom',
    createdAt: existingProject?.createdAt || now,
    updatedAt: now,
  })

  const nextProjects = customProjects
    .filter((item) => item.slug !== previousSlug && item.slug !== project.slug)
    .concat(normalizedProject)

  const categories = getStoredCustomCategories()
  if (!getProjectCategories().includes(normalizedProject.category) && !categories.includes(normalizedProject.category)) {
    writeJson(CUSTOM_PROJECT_CATEGORIES_KEY, [...categories, normalizedProject.category])
  }

  persistCustomProjects(nextProjects)
  return normalizedProject
}

export function deleteCustomProject(slug: string) {
  const customProjects = getStoredCustomProjects()
  const nextProjects = customProjects.filter((project) => project.slug !== slug)

  if (nextProjects.length === customProjects.length) {
    return false
  }

  persistCustomProjects(nextProjects)
  return true
}
