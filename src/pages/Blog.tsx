import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import InteractiveBackground from '../components/InteractiveBackground'
import BlogCard from '../components/BlogCard'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useBlogTheme } from '../context/BlogThemeContext'
import { getPosts, deletePost, categories } from '../data/posts'
import type { Post, Category } from '../data/posts'
import styles from './Blog.module.css'

const TravelGlobe = lazy(() => import('../components/TravelGlobe'))

type ViewMode = 'grid' | 'list'

export default function Blog() {
  const navigate = useNavigate()
  const { isAdmin } = useAdminAuth()
  const { isBlogLight, toggleBlogTheme } = useBlogTheme()
  const [activeCategory, setActiveCategory] = useState<Category>('전체')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [posts, setPosts] = useState<Post[]>([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    getPosts().then(setPosts)
  }, [])

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`"${title}" 글을 삭제하시겠습니까?`)) return
    const ok = await deletePost(slug)
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.slug !== slug))
      setToast(`"${title}" 삭제됨`)
      setTimeout(() => setToast(''), 3000)
    } else {
      alert('삭제에 실패했어요.')
    }
  }

  const filteredPosts = activeCategory === '전체'
    ? posts
    : posts.filter((p) => p.category === activeCategory)

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
                  AI, 개발, 연구에 대한 기록과 인사이트를 공유합니다
                </p>
              </div>
              {isAdmin && (
                <button onClick={() => navigate('/blog/write')} className={styles.writeBtn}>
                  글쓰기
                </button>
              )}
            </div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.categories}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.catBtn} ${activeCategory === cat ? styles.catActive : ''}`}
                  onClick={() => setActiveCategory(cat)}
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
              <button
                type="button"
                className={styles.themeBtn}
                onClick={toggleBlogTheme}
                aria-label={isBlogLight ? '다크 모드로 전환' : '라이트 모드로 전환'}
                title={isBlogLight ? '다크 모드' : '라이트 모드'}
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
            </div>
          </div>

          {activeCategory === '여행' ? (
            <Suspense fallback={<p className={styles.empty}>지구본 로딩중...</p>}>
              <TravelGlobe />
            </Suspense>
          ) : activeCategory === '전체' ? (
            <div className={styles.splitLayout}>
              <div className={styles.splitPosts}>
                <div className={viewMode === 'grid' ? styles.grid : styles.list}>
                  {filteredPosts.map((post, i) => (
                    <BlogCard
                      key={post.slug}
                      post={post}
                      index={i}
                      viewMode={viewMode}
                      onDelete={isAdmin ? () => handleDelete(post.slug, post.title) : undefined}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.splitGlobe}>
                <Suspense fallback={<p className={styles.empty}>지구본 로딩중...</p>}>
                  <TravelGlobe compact />
                </Suspense>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? styles.grid : styles.list}>
              {filteredPosts.map((post, i) => (
                <BlogCard
                  key={post.slug}
                  post={post}
                  index={i}
                  viewMode={viewMode}
                  onDelete={isAdmin ? () => handleDelete(post.slug, post.title) : undefined}
                />
              ))}
              {filteredPosts.length === 0 && (
                <p className={styles.empty}>아직 이 카테고리에 글이 없습니다.</p>
              )}
            </div>
          )}
        </div>

        {toast && <div className={styles.toast}>{toast}</div>}
      </main>
    </>
  )
}
