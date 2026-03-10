import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Post } from '../data/posts'
import styles from './BlogCard.module.css'

interface Props {
  post: Post
  index: number
  viewMode?: 'grid' | 'list'
  onDelete?: () => void
}

const BlogCard = memo(function BlogCard({ post, viewMode = 'grid', onDelete }: Props) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.()
  }

  if (viewMode === 'list') {
    return (
      <div className={styles.listRow}>
        <Link to={`/blog/${post.slug}`} className={styles.listCard}>
          <span className={styles.listDate}>{post.date}</span>
          <span className={styles.listCategory}>{post.category}</span>
          <h3 className={styles.listTitle}>{post.title}</h3>
          <p className={styles.listSummary}>{post.summary}</p>
        </Link>
        {onDelete && (
          <button className={styles.deleteBtn} onClick={handleDelete} title="삭제">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.cardWrap}>
      <Link to={`/blog/${post.slug}`} className={styles.card}>
        <div className={styles.inner}>
          <span className={styles.category}>{post.category}</span>
          <h3 className={styles.title}>{post.title}</h3>
          <p className={styles.summary}>{post.summary}</p>
          <span className={styles.date}>{post.date}</span>
        </div>
      </Link>
      {onDelete && (
        <button className={styles.deleteBtnGrid} onClick={handleDelete} title="삭제">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
})

export default BlogCard
