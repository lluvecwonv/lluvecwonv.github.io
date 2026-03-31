import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import InteractiveBackground from '../components/InteractiveBackground'
import BlogCard from '../components/BlogCard'
import LocaleToggle from '../components/LocaleToggle'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useBlogTheme } from '../context/BlogThemeContext'
import { getPosts, deletePost, categories, researchThemes, getPostTheme } from '../data/posts'
import type { Post, Category, ResearchTheme } from '../data/posts'
import { useBlogLocale, getBlogPageText } from '../lib/blogI18n'
import type { ProjectLocale } from '../data/projectTranslations'
import styles from './Blog.module.css'

const TravelGlobe = lazy(() => import('../components/TravelGlobe'))

const CAT_PHOTO_URL = 'https://images.weserv.nl/?url=xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/cat-geumbi.heic&output=jpg&q=85'

type ViewMode = 'grid' | 'list'

export default function Blog() {
  const navigate = useNavigate()
  const { isAdmin } = useAdminAuth()
  const { isBlogLight, toggleBlogTheme } = useBlogTheme()
  const [blogLocale, setBlogLocale] = useBlogLocale()
  const t = getBlogPageText(blogLocale)
  const [activeCategory, setActiveCategory] = useState<Category>('전체')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [posts, setPosts] = useState<Post[]>([])
  const [toast, setToast] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTheme, setActiveTheme] = useState<ResearchTheme>('전체')
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set())

  const toggleTheme = (theme: string) => {
    setExpandedThemes((prev) => {
      const next = new Set(prev)
      if (next.has(theme)) next.delete(theme)
      else next.add(theme)
      return next
    })
  }

  const expandAll = () => {
    setExpandedThemes(new Set(researchThemes.filter((t) => t !== '전체')))
  }

  const collapseAll = () => {
    setExpandedThemes(new Set())
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    getPosts().then(setPosts)
  }, [])

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(t.deleteConfirm(title))) return
    const ok = await deletePost(slug)
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.slug !== slug))
      setToast(t.deleted(title))
      setTimeout(() => setToast(''), 3000)
    } else {
      alert(t.deleteFailed)
    }
  }

  // Reset theme filter when switching away from 연구노트
  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat)
    if (cat !== '연구노트') setActiveTheme('전체')
  }

  // For 연구노트 category, filter by selected language; for others show all (default: ko posts only)
  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return (activeCategory === '전체'
      ? posts
      : posts.filter((p) => p.category === activeCategory)
    )
      .filter((p) =>
        (p.category === '연구노트' || p.category === '알고리즘') ? p.language === blogLocale : p.language === 'ko'
      )
      .filter((p) => {
        if (activeCategory !== '연구노트' || activeTheme === '전체') return true
        return getPostTheme(p) === activeTheme
      })
      .filter((p) => {
        if (!q) return true
        return (
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          p.content.toLowerCase().includes(q)
        )
      })
  }, [posts, activeCategory, blogLocale, searchQuery, activeTheme])

  // Count posts per theme (for badge display)
  const themeCounts = useMemo(() => {
    if (activeCategory !== '연구노트') return {}
    const langFiltered = posts
      .filter((p) => p.category === '연구노트' && p.language === blogLocale)
    const counts: Record<string, number> = { '전체': langFiltered.length }
    researchThemes.slice(1).forEach((theme) => {
      counts[theme] = langFiltered.filter((p) => getPostTheme(p) === theme).length
    })
    return counts
  }, [posts, activeCategory, blogLocale])

  // Group posts by theme for accordion view (연구노트 only)
  const groupedByTheme = useMemo(() => {
    if (activeCategory !== '연구노트') return []
    const q = searchQuery.toLowerCase().trim()
    const langFiltered = posts
      .filter((p) => p.category === '연구노트' && p.language === blogLocale)
      .filter((p) => {
        if (!q) return true
        return (
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          p.content.toLowerCase().includes(q)
        )
      })

    return researchThemes
      .filter((t) => t !== '전체')
      .map((theme) => ({
        theme,
        posts: langFiltered.filter((p) => getPostTheme(p) === theme),
      }))
      .filter((group) => group.posts.length > 0)
  }, [posts, activeCategory, blogLocale, searchQuery])

  return (
    <>
      {!isBlogLight && <InteractiveBackground />}
      <main className={`${styles.main} ${isBlogLight ? styles.light : ''}`}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div>
                <h1 className={styles.title}>Blog</h1>
                <p className={styles.subtitle}>
                  {t.subtitle.split('\n').map((line, i) => (
                    <span key={i}>{line}{i === 0 && <br />}</span>
                  ))}
                </p>
              </div>
              <div className={styles.headerActions}>
                {(activeCategory === '연구노트' || activeCategory === '알고리즘') && (
                  <LocaleToggle
                    value={blogLocale as ProjectLocale}
                    onChange={(v) => setBlogLocale(v as 'ko' | 'en')}
                  />
                )}
                <button
                  type="button"
                  className={styles.themeBtn}
                  onClick={toggleBlogTheme}
                  aria-label={isBlogLight ? t.darkMode : t.lightMode}
                  title={isBlogLight ? t.darkMode : t.lightMode}
                >
                  {isBlogLight ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3c0 4.97 4.03 9 9 9 .27 0 .53-.01.79-.21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" /><path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" /><path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                  )}
                </button>
                {isAdmin && (
                  <button onClick={() => navigate('/blog/write')} className={styles.writeBtn}>
                    {t.write}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hero: Cat photo (left) + Globe (right) — both sticky */}
          <div className={styles.heroRow}>
            <div className={styles.heroPhoto}>
              <img src={CAT_PHOTO_URL} alt="금비" className={styles.catImg} loading="lazy" />
              <span className={styles.catCaption}>우리집 최강 귀요미, 해피바이러스. 금비를 소개함돠</span>
            </div>
            <div className={styles.heroGlobe}>
              <Suspense fallback={<p className={styles.empty}>{t.globeLoading}</p>}>
                <TravelGlobe compact />
              </Suspense>
            </div>
          </div>

          {/* Category toolbar + posts below */}
          <div className={styles.postsSection}>
            {/* Search bar */}
            <div className={styles.searchBar}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={blogLocale === 'ko' ? '논문 제목, 태그, 내용으로 검색...' : 'Search by title, tags, content...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className={styles.searchClear}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <div className={styles.toolbar}>
              <div className={styles.categories}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`${styles.catBtn} ${activeCategory === cat ? styles.catActive : ''}`}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className={styles.toolbarActions}>
                <div className={styles.viewToggle}>
                  <button
                    className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="그리드 뷰"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </button>
                  <button
                    className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
                    onClick={() => setViewMode('list')}
                    aria-label="리스트 뷰"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Accordion grouped view for 연구노트 */}
            {activeCategory === '연구노트' ? (
              <div className={styles.accordionContainer}>
                <div className={styles.accordionToolbar}>
                  <span className={styles.accordionSummary}>
                    {blogLocale === 'ko'
                      ? `${groupedByTheme.length}개 분류, ${groupedByTheme.reduce((s, g) => s + g.posts.length, 0)}편의 논문`
                      : `${groupedByTheme.length} categories, ${groupedByTheme.reduce((s, g) => s + g.posts.length, 0)} papers`}
                  </span>
                  <div className={styles.accordionActions}>
                    <button className={styles.accordionToggleAll} onClick={expandAll}>
                      {blogLocale === 'ko' ? '모두 펼치기' : 'Expand All'}
                    </button>
                    <button className={styles.accordionToggleAll} onClick={collapseAll}>
                      {blogLocale === 'ko' ? '모두 접기' : 'Collapse All'}
                    </button>
                  </div>
                </div>

                {groupedByTheme.map((group) => (
                  <div key={group.theme} className={styles.accordionGroup}>
                    <button
                      className={`${styles.accordionHeader} ${expandedThemes.has(group.theme) ? styles.accordionOpen : ''}`}
                      onClick={() => toggleTheme(group.theme)}
                    >
                      <div className={styles.accordionLeft}>
                        <svg
                          className={styles.accordionArrow}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span className={styles.accordionTitle}>{group.theme}</span>
                        <span className={styles.accordionBadge}>{group.posts.length}</span>
                      </div>
                    </button>
                    {expandedThemes.has(group.theme) && (
                      <div className={viewMode === 'grid' ? styles.accordionGrid : styles.accordionList}>
                        {group.posts.map((post, i) => (
                          <BlogCard
                            key={post.slug}
                            post={post}
                            index={i}
                            viewMode={viewMode}
                            onDelete={isAdmin && post.source !== 'local' ? () => handleDelete(post.slug, post.title) : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {groupedByTheme.length === 0 && (
                  <p className={styles.empty}>{t.empty}</p>
                )}
              </div>
            ) : activeCategory === '여행' ? (
              <Suspense fallback={<p className={styles.empty}>{t.globeLoading}</p>}>
                <TravelGlobe />
              </Suspense>
            ) : (
              <div className={viewMode === 'grid' ? styles.grid : styles.list}>
                {filteredPosts.map((post, i) => (
                  <BlogCard
                    key={post.slug}
                    post={post}
                    index={i}
                    viewMode={viewMode}
                    onDelete={isAdmin && post.source !== 'local' ? () => handleDelete(post.slug, post.title) : undefined}
                  />
                ))}
                {filteredPosts.length === 0 && (
                  <p className={styles.empty}>{t.empty}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {toast && <div className={styles.toast}>{toast}</div>}
      </main>
    </>
  )
}
