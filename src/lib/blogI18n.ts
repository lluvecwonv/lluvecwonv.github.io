import { useEffect, useState } from 'react'
import type { PostLanguage } from '../data/posts'

const BLOG_LOCALE_STORAGE_KEY = 'blog-locale'
const DEFAULT_BLOG_LOCALE: PostLanguage = 'ko'

const blogPageText = {
  ko: {
    title: 'Blog',
    subtitle: '목적은 AI, 개발, 연구에 대한 기록과 인사이트를 공유하려고 만든 공간.\n실사용은 고양이 자랑 공간, 너만없어 고양이.',
    empty: '아직 이 카테고리에 글이 없습니다.',
    loading: '로딩중...',
    notFound: '글을 찾을 수 없습니다',
    backToList: '블로그로 돌아가기',
    write: '글쓰기',
    darkMode: '다크 모드로 전환',
    lightMode: '라이트 모드로 전환',
    globeLoading: '지구본 로딩중...',
    deleteConfirm: (title: string) => `"${title}" 글을 삭제하시겠습니까?`,
    deleted: (title: string) => `"${title}" 삭제됨`,
    deleteFailed: '삭제에 실패했어요.',
  },
  en: {
    title: 'Blog',
    subtitle: 'A space for sharing insights and notes on AI, development, and research.\nAlso a cat appreciation zone — everyone has a cat except you.',
    empty: 'No posts in this category yet.',
    loading: 'Loading...',
    notFound: 'Post not found',
    backToList: 'Back to blog',
    write: 'Write',
    darkMode: 'Switch to dark mode',
    lightMode: 'Switch to light mode',
    globeLoading: 'Loading globe...',
    deleteConfirm: (title: string) => `Delete "${title}"?`,
    deleted: (title: string) => `"${title}" deleted`,
    deleteFailed: 'Failed to delete.',
  },
}

function getStoredBlogLocale(): PostLanguage {
  if (typeof window === 'undefined') return DEFAULT_BLOG_LOCALE

  const stored = window.localStorage.getItem(BLOG_LOCALE_STORAGE_KEY)
  return stored === 'ko' || stored === 'en' ? stored : DEFAULT_BLOG_LOCALE
}

export function useBlogLocale() {
  const [locale, setLocale] = useState<PostLanguage>(() => getStoredBlogLocale())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(BLOG_LOCALE_STORAGE_KEY, locale)
  }, [locale])

  return [locale, setLocale] as const
}

export function getBlogPageText(locale: PostLanguage) {
  return blogPageText[locale]
}
