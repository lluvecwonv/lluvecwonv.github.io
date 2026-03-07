export type Category = '전체' | 'AI/개발' | '연구노트' | '인사이트' | '여행' | '일상'

export const categories: Category[] = ['전체', 'AI/개발', '연구노트', '인사이트', '여행', '일상']

export interface Post {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  category: Category
  content: string
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw }

  const meta: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    meta[key] = val
  }
  return { meta, content: match[2].trim() }
}

function parseTags(val: string): string[] {
  const inner = val.replace(/^\[/, '').replace(/\]$/, '')
  return inner.split(',').map((s) => s.trim()).filter(Boolean)
}

const mdFiles = import.meta.glob('../posts/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

export const posts: Post[] = Object.entries(mdFiles)
  .map(([path, raw]) => {
    const slug = path.split('/').pop()!.replace('.md', '')
    const { meta, content } = parseFrontmatter(raw)
    return {
      slug,
      title: meta.title || slug,
      date: meta.date || '',
      summary: meta.summary || '',
      tags: parseTags(meta.tags || ''),
      category: (meta.category || '일상') as Category,
      content,
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))
