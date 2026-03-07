import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const BLOG_THEME_KEY = 'my-site-blog-theme'

interface BlogThemeContextValue {
  isBlogLight: boolean
  setBlogLight: (next: boolean) => void
  toggleBlogTheme: () => void
}

const BlogThemeContext = createContext<BlogThemeContextValue | null>(null)

function getStoredBlogTheme() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(BLOG_THEME_KEY) === 'light'
}

export function BlogThemeProvider({ children }: { children: ReactNode }) {
  const [isBlogLight, setIsBlogLight] = useState(getStoredBlogTheme)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(BLOG_THEME_KEY, isBlogLight ? 'light' : 'dark')
  }, [isBlogLight])

  const value = useMemo<BlogThemeContextValue>(() => ({
    isBlogLight,
    setBlogLight: setIsBlogLight,
    toggleBlogTheme: () => setIsBlogLight((current) => !current),
  }), [isBlogLight])

  return (
    <BlogThemeContext.Provider value={value}>
      {children}
    </BlogThemeContext.Provider>
  )
}

export function useBlogTheme() {
  const context = useContext(BlogThemeContext)

  if (!context) {
    throw new Error('useBlogTheme must be used within BlogThemeProvider')
  }

  return context
}
