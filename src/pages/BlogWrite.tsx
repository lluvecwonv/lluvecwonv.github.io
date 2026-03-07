import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import InteractiveBackground from '../components/InteractiveBackground'
import { useBlogTheme } from '../context/BlogThemeContext'
import { createPost, categories } from '../data/posts'
import type { Category } from '../data/posts'
import styles from './BlogWrite.module.css'

/* ── HTML → Markdown 변환기 ── */
function nodeToMd(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const kids = Array.from(el.childNodes).map(nodeToMd).join('')

  switch (tag) {
    case 'h1': return `# ${kids.trim()}\n\n`
    case 'h2': return `## ${kids.trim()}\n\n`
    case 'h3': return `### ${kids.trim()}\n\n`
    case 'p': return `${kids.trim()}\n\n`
    case 'br': return '\n'
    case 'strong': case 'b': return `**${kids}**`
    case 'em': case 'i': return `*${kids}*`
    case 'u': return kids
    case 'ul': return kids + '\n'
    case 'ol': return kids + '\n'
    case 'li': {
      const parent = el.parentElement
      if (parent?.tagName === 'OL') {
        const idx = Array.from(parent.children).indexOf(el) + 1
        return `${idx}. ${kids.trim()}\n`
      }
      return `- ${kids.trim()}\n`
    }
    case 'a': return `[${kids}](${el.getAttribute('href') || ''})`
    case 'img': return `![${el.getAttribute('alt') || '이미지'}](${el.getAttribute('src') || ''})\n\n`
    case 'blockquote': return kids.trim().split('\n').map((l: string) => `> ${l}`).join('\n') + '\n\n'
    case 'code': return el.parentElement?.tagName === 'PRE' ? kids : `\`${kids}\``
    case 'pre': return `\`\`\`\n${kids.trim()}\n\`\`\`\n\n`
    case 'hr': return '---\n\n'
    case 'div': return kids.trim() ? `${kids.trim()}\n\n` : ''
    default: return kids
  }
}

function htmlToMarkdown(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return nodeToMd(div).replace(/\n{3,}/g, '\n\n').trim()
}

/* ── 에디터 컴포넌트 ── */
export default function BlogWrite() {
  const navigate = useNavigate()
  const { isBlogLight, toggleBlogTheme } = useBlogTheme()
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('AI/개발')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    editorRef.current?.focus()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      exec('insertImage', reader.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) continue
        const reader = new FileReader()
        reader.onload = () => {
          exec('insertImage', reader.result as string)
        }
        reader.readAsDataURL(file)
        return
      }
    }
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || 'untitled'

  const handlePublish = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    const html = editorRef.current?.innerHTML || ''
    const content = htmlToMarkdown(html)
    if (!content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const summary = editorRef.current?.textContent?.trim().slice(0, 100) || ''
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)

    setSaving(true)
    const ok = await createPost({
      slug,
      title,
      date: today,
      summary,
      tags: tagList,
      category,
      content,
    })
    setSaving(false)

    if (ok) {
      navigate('/blog')
    } else {
      alert('글 저장에 실패했어요. 다시 시도해주세요.')
    }
  }

  const writableCategories = categories.filter((c) => c !== '전체')

  return (
    <>
      {!isBlogLight && <InteractiveBackground />}
      <main className={`${styles.main} ${isBlogLight ? styles.light : ''}`}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={() => navigate('/blog')}>
              ← Blog
            </button>
          </div>

          <div className={styles.form}>
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.titleInput}
            />

            <div className={styles.meta}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={styles.select}
              >
                {writableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="태그 (쉼표 구분)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={styles.tagInput}
              />
            </div>

            {/* 툴바 */}
            <div className={styles.toolbar}>
              <div className={styles.toolGroup}>
                <button className={styles.toolBtn} onClick={() => exec('bold')} title="굵게">
                  <strong>B</strong>
                </button>
                <button className={styles.toolBtn} onClick={() => exec('italic')} title="기울임">
                  <em>I</em>
                </button>
                <button className={styles.toolBtn} onClick={() => exec('underline')} title="밑줄">
                  <u>U</u>
                </button>
                <button className={styles.toolBtn} onClick={() => exec('strikeThrough')} title="취소선">
                  <s>S</s>
                </button>
              </div>

              <span className={styles.toolDivider} />

              <div className={styles.toolGroup}>
                <button className={styles.toolBtn} onClick={() => exec('formatBlock', 'h1')} title="제목 1">
                  H1
                </button>
                <button className={styles.toolBtn} onClick={() => exec('formatBlock', 'h2')} title="제목 2">
                  H2
                </button>
                <button className={styles.toolBtn} onClick={() => exec('formatBlock', 'h3')} title="제목 3">
                  H3
                </button>
                <button className={styles.toolBtn} onClick={() => exec('formatBlock', 'p')} title="본문">
                  P
                </button>
              </div>

              <span className={styles.toolDivider} />

              <div className={styles.toolGroup}>
                <button className={styles.toolBtn} onClick={() => exec('insertUnorderedList')} title="목록">
                  •
                </button>
                <button className={styles.toolBtn} onClick={() => exec('insertOrderedList')} title="번호 목록">
                  1.
                </button>
                <button className={styles.toolBtn} onClick={() => exec('formatBlock', 'blockquote')} title="인용">
                  "
                </button>
                <button className={styles.toolBtn} onClick={() => exec('insertHorizontalRule')} title="구분선">
                  ─
                </button>
              </div>

              <span className={styles.toolDivider} />

              <div className={styles.toolGroup}>
                <button className={styles.toolBtn} onClick={() => {
                  const url = prompt('링크 URL')
                  if (url) exec('createLink', url)
                }} title="링크">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </button>
                <button className={styles.toolBtn} onClick={() => fileInputRef.current?.click()} title="이미지 업로드">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </button>
                <button className={styles.toolBtn} onClick={() => {
                  const url = prompt('이미지 URL')
                  if (url) exec('insertImage', url)
                }} title="이미지 URL">
                  URL
                </button>
              </div>

              <span className={styles.toolDivider} />

              <button
                className={`${styles.toolBtn} ${styles.themeToggle}`}
                onClick={toggleBlogTheme}
                title={isBlogLight ? '다크 모드' : '라이트 모드'}
              >
                {isBlogLight ? 'DARK' : 'LIGHT'}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {/* 에디터 */}
            <div
              ref={editorRef}
              className={`${styles.editor} ${isBlogLight ? styles.editorLight : ''}`}
              contentEditable
              onPaste={handlePaste}
              data-placeholder="내용을 입력하세요..."
            />

            <div className={styles.footer}>
              <div className={styles.actions}>
                <button
                  onClick={handlePublish}
                  className={styles.downloadBtn}
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '발행하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
