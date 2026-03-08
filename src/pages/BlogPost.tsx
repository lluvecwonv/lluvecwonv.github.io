import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import InteractiveBackground from '../components/InteractiveBackground'
import { useBlogTheme } from '../context/BlogThemeContext'
import { getPost } from '../data/posts'
import type { Post } from '../data/posts'
import styles from './BlogPost.module.css'

export default function BlogPost() {
  const { slug } = useParams()
  const { isBlogLight } = useBlogTheme()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (slug) {
      getPost(slug).then((p) => {
        setPost(p)
        setLoading(false)
      })
    }
  }, [slug])

  if (loading) {
    return (
      <>
        {!isBlogLight && <InteractiveBackground />}
        <main className={`${styles.main} ${isBlogLight ? styles.light : ''}`}>
          <div className={styles.container}>
            <p>로딩중...</p>
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
            <h1 className={styles.notFound}>글을 찾을 수 없습니다</h1>
            <Link to="/blog" className={styles.backLink}>블로그로 돌아가기</Link>
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
          <Link to="/blog" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            블로그로 돌아가기
          </Link>

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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </motion.article>
      </main>
    </>
  )
}
