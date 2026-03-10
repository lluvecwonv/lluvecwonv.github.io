import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import InteractiveBackground from '../components/InteractiveBackground'
import LocaleToggle from '../components/LocaleToggle'
import { useBlogTheme } from '../context/BlogThemeContext'
import { getPost, getAlternateSlug } from '../data/posts'
import type { Post } from '../data/posts'
import { useBlogLocale, getBlogPageText } from '../lib/blogI18n'
import type { ProjectLocale } from '../data/projectTranslations'
import styles from './BlogPost.module.css'

export default function BlogPost() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isBlogLight } = useBlogTheme()
  const [blogLocale, setBlogLocale] = useBlogLocale()
  const t = getBlogPageText(blogLocale)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAlternate, setHasAlternate] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (slug) {
      // Fetch post and alternate-language version in parallel
      const altSlugEn = `${slug}-en`
      const altSlugKo = slug.replace(/-en$/, '')
      const altSlug = slug.endsWith('-en') ? altSlugKo : altSlugEn

      Promise.all([getPost(slug), getPost(altSlug)]).then(([p, alt]) => {
        setPost(p)
        setLoading(false)
        setHasAlternate(!!alt)
        if (p) setBlogLocale(p.language)
      })
    }
  }, [slug])

  if (loading) {
    return (
      <>
        {!isBlogLight && <InteractiveBackground />}
        <main className={`${styles.main} ${isBlogLight ? styles.light : ''}`}>
          <div className={styles.container}>
            <p>{t.loading}</p>
          </div>
        </main>
      </>
    )
  }

  if (!post) {
    return (
      <>
        {!isBlogLight && <InteractiveBackground />}
        <main className={`${styles.main} ${isBlogLight ? styles.light : ''}`}>
          <div className={styles.container}>
            <h1 className={styles.notFound}>{t.notFound}</h1>
            <Link to="/blog" className={styles.backLink}>{t.backToList}</Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      {!isBlogLight && <InteractiveBackground />}
      <main className={`${styles.main} ${isBlogLight ? styles.light : ''}`}>
        <motion.article
          className={styles.container}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.topBar}>
            <Link to="/blog" className={styles.backLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              {t.backToList}
            </Link>
            {hasAlternate && post.category === '연구노트' && (
              <LocaleToggle
                value={blogLocale as ProjectLocale}
                onChange={(v) => {
                  if (post && v !== post.language) {
                    const altSlug = getAlternateSlug(post.slug, post.language)
                    navigate(`/blog/${altSlug}`)
                  }
                }}
              />
            )}
          </div>

          <header className={styles.header}>
            <div className={styles.tags}>
              {post.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
            <h1 className={styles.title}>{post.title}</h1>
            <span className={styles.date}>{post.date}</span>
          </header>

          <div className={styles.content}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ node, ...props }) => (
                  <img {...props} loading="lazy" decoding="async" />
                ),
              }}
            >{post.content}</ReactMarkdown>
          </div>
        </motion.article>
      </main>
    </>
  )
}
