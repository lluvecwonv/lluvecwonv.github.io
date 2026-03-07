import { useEffect, useState } from 'react'
import type { Project, ProjectImage, ProjectSection } from '../data/projects'
import {
  type LocalizedProjectTranslation,
  projectTitleEnglishGlossary,
  projectTranslations,
  type LocalizedProjectImageTranslation,
  type LocalizedProjectSectionTranslation,
  type ProjectLocale,
} from '../data/projectTranslations'
import { getStoredProjectTranslationOverrides } from './projectStorage'

const PROJECT_LOCALE_STORAGE_KEY = 'project-locale'
const DEFAULT_PROJECT_LOCALE: ProjectLocale = 'ko'
const HANGUL_REGEX = /[가-힣]/

const projectsPageText = {
  ko: {
    title: '프로젝트',
    subtitle: '연구 및 개발 프로젝트',
  },
  en: {
    title: 'Projects',
    subtitle: 'Research and development projects',
  },
}

const projectDetailText = {
  ko: {
    backToProjects: '← 프로젝트',
    notFound: '프로젝트를 찾을 수 없습니다.',
    techStack: '기술 스택',
    paper: '논문',
  },
  en: {
    backToProjects: '← Projects',
    notFound: 'Project not found.',
    techStack: 'Tech Stack',
    paper: 'Paper',
  },
}

export interface ProjectView extends Project {
  displayTitle: string
  displayCategory: string
  displaySubtitle?: string
  displayDescription: string
  displayPaper?: string
  displayPaperTitle?: string
  displaySections: ProjectSection[]
}

function getStoredProjectLocale(): ProjectLocale {
  if (typeof window === 'undefined') return DEFAULT_PROJECT_LOCALE

  const stored = window.localStorage.getItem(PROJECT_LOCALE_STORAGE_KEY)
  return stored === 'ko' || stored === 'en' ? stored : DEFAULT_PROJECT_LOCALE
}

export function useProjectLocale() {
  const [locale, setLocale] = useState<ProjectLocale>(() => getStoredProjectLocale())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(PROJECT_LOCALE_STORAGE_KEY, locale)
  }, [locale])

  return [locale, setLocale] as const
}

export function getLocalizedCategoryLabel(category: string, locale: ProjectLocale) {
  void locale
  return category
}

export function getProjectsPageText(locale: ProjectLocale) {
  return projectsPageText[locale]
}

export function getProjectDetailText(locale: ProjectLocale) {
  return projectDetailText[locale]
}

export function getProjectDisplayTitle(project: Project) {
  const englishGloss = projectTitleEnglishGlossary[project.slug]

  if (HANGUL_REGEX.test(project.title) && englishGloss) {
    return `${project.title} (${englishGloss})`
  }

  return project.title
}

function getLocalizedImages(
  images: ProjectImage[] | undefined,
  localizedImages: LocalizedProjectImageTranslation[] | undefined,
) {
  return images?.map((image, index) => ({
    ...image,
    caption: localizedImages?.[index]?.caption ?? image.caption,
  }))
}

function getLocalizedSections(
  sections: ProjectSection[],
  localizedSections: LocalizedProjectSectionTranslation[] | undefined,
) {
  return sections.map((section, index) => {
    const localizedSection = localizedSections?.[index]

    return {
      ...section,
      heading: localizedSection?.heading ?? section.heading,
      body: localizedSection?.body ?? section.body,
      html: localizedSection?.html ?? section.html,
      images: getLocalizedImages(section.images, localizedSection?.images),
    }
  })
}

function mergeLocalizedSections(
  baseSections: LocalizedProjectSectionTranslation[] | undefined,
  overrideSections: LocalizedProjectSectionTranslation[] | undefined,
) {
  if (!baseSections && !overrideSections) return undefined

  const sectionCount = Math.max(baseSections?.length || 0, overrideSections?.length || 0)

  return Array.from({ length: sectionCount }, (_, index) => ({
    heading: overrideSections?.[index]?.heading ?? baseSections?.[index]?.heading,
    body: overrideSections?.[index]?.body ?? baseSections?.[index]?.body,
    html: overrideSections?.[index]?.html ?? baseSections?.[index]?.html,
    images: overrideSections?.[index]?.images ?? baseSections?.[index]?.images,
  }))
}

function mergeLocalizedTranslation(
  baseTranslation: LocalizedProjectTranslation | undefined,
  overrideTranslation: LocalizedProjectTranslation | undefined,
) {
  if (!baseTranslation && !overrideTranslation) return undefined

  return {
    subtitle: overrideTranslation?.subtitle ?? baseTranslation?.subtitle,
    description: overrideTranslation?.description ?? baseTranslation?.description,
    paper: overrideTranslation?.paper ?? baseTranslation?.paper,
    paperTitle: overrideTranslation?.paperTitle ?? baseTranslation?.paperTitle,
    sections: mergeLocalizedSections(baseTranslation?.sections, overrideTranslation?.sections),
  }
}

export function getLocalizedProject(project: Project, locale: ProjectLocale): ProjectView {
  const translationOverride = getStoredProjectTranslationOverrides()[project.slug]?.[locale]
  const translation = mergeLocalizedTranslation(projectTranslations[project.slug]?.[locale], translationOverride)

  return {
    ...project,
    displayTitle: getProjectDisplayTitle(project),
    displayCategory: getLocalizedCategoryLabel(project.category, locale),
    displaySubtitle: translation?.subtitle ?? project.subtitle,
    displayDescription: translation?.description ?? project.description,
    displayPaper: translation?.paper ?? project.paper,
    displayPaperTitle: translation?.paperTitle ?? project.paperTitle,
    displaySections: getLocalizedSections(project.sections, translation?.sections),
  }
}
