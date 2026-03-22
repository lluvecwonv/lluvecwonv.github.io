import { supabase } from '../lib/supabase'

export type Category = '전체' | 'AI/개발' | '연구노트' | '알고리즘' | '인사이트' | '여행' | '일상'

export const categories: Category[] = ['전체', 'AI/개발', '연구노트', '알고리즘', '인사이트', '여행', '일상']

export type PostLanguage = 'ko' | 'en'

export interface Post {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  category: Category
  content: string
  language: PostLanguage
  source?: 'remote' | 'local'
}

interface PostRow {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  category: string
  content: string
  published: boolean
  language: string
}

function isPostLanguage(value: string): value is PostLanguage {
  return value === 'ko' || value === 'en'
}

function rowToPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    summary: row.summary,
    tags: row.tags ?? [],
    category: (row.category || '일상') as Category,
    content: row.content,
    language: isPostLanguage(row.language) ? row.language : 'ko',
    source: 'remote',
  }
}

const localPostModules = import.meta.glob('../posts/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

function isCategory(value: string): value is Category {
  return categories.includes(value as Category)
}

function stripWrappingQuotes(value: string) {
  return value.replace(/^['"]/, '').replace(/['"]$/, '').trim()
}

function parseTags(rawValue: string | undefined) {
  if (!rawValue) return []

  const value = rawValue.trim()
  if (!value.startsWith('[') || !value.endsWith(']')) {
    const singleTag = stripWrappingQuotes(value)
    return singleTag ? [singleTag] : []
  }

  return value
    .slice(1, -1)
    .split(',')
    .map((tag) => stripWrappingQuotes(tag.trim()))
    .filter(Boolean)
}

function parseFrontmatter(raw: string) {
  const normalized = raw.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)

  if (!match) {
    return {
      frontmatter: {} as Record<string, string>,
      content: normalized.trim(),
    }
  }

  const frontmatter = match[1]
    .split('\n')
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex === -1) return acc

      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()
      if (key) {
        acc[key] = value
      }
      return acc
    }, {})

  return {
    frontmatter,
    content: match[2].trim(),
  }
}

function buildSummary(content: string) {
  return content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`#>*_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

function parseLocalPost(filepath: string, raw: string): Post | null {
  const slugMatch = filepath.match(/\/([^/]+)\.md$/)
  if (!slugMatch) return null

  const { frontmatter, content } = parseFrontmatter(raw)
  const categoryValue = stripWrappingQuotes(frontmatter.category || '일상')

  const langValue = stripWrappingQuotes(frontmatter.language || 'ko')

  return {
    slug: slugMatch[1],
    title: stripWrappingQuotes(frontmatter.title || slugMatch[1]),
    date: stripWrappingQuotes(frontmatter.date || '1970-01-01'),
    summary: stripWrappingQuotes(frontmatter.summary || '') || buildSummary(content),
    tags: parseTags(frontmatter.tags),
    category: isCategory(categoryValue) ? categoryValue : '일상',
    content,
    language: isPostLanguage(langValue) ? langValue : 'ko',
    source: 'local',
  }
}

const localPosts = Object.entries(localPostModules)
  .map(([filepath, raw]) => parseLocalPost(filepath, raw))
  .filter((post): post is Post => post !== null)

function sortPosts(posts: Post[]) {
  return [...posts].sort((left, right) => right.date.localeCompare(left.date))
}

function mergePosts(remotePosts: Post[], language?: PostLanguage) {
  const filteredLocal = language ? localPosts.filter((p) => p.language === language) : localPosts
  const mergedPosts = new Map(filteredLocal.map((post) => [post.slug, post]))
  remotePosts.forEach((post) => {
    mergedPosts.set(post.slug, post)
  })
  return sortPosts([...mergedPosts.values()])
}

function getLocalPost(slug: string) {
  return localPosts.find((post) => post.slug === slug) ?? null
}

// Simple cache to avoid redundant fetches within the same session
let postsCache: { key: string; data: Post[]; ts: number } | null = null
const CACHE_TTL = 60_000 // 1 minute

export async function getPosts(language?: PostLanguage): Promise<Post[]> {
  const cacheKey = language ?? '__all__'
  if (postsCache && postsCache.key === cacheKey && Date.now() - postsCache.ts < CACHE_TTL) {
    return postsCache.data
  }

  const filterByLang = (posts: Post[]) =>
    language ? posts.filter((p) => p.language === language) : posts

  if (!supabase) {
    const result = sortPosts(filterByLang(localPosts))
    postsCache = { key: cacheKey, data: result, ts: Date.now() }
    return result
  }

  let query = supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false })

  if (language) {
    query = query.eq('language', language)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch posts:', error)
    const result = sortPosts(filterByLang(localPosts))
    postsCache = { key: cacheKey, data: result, ts: Date.now() }
    return result
  }

  const result = mergePosts((data as PostRow[]).map(rowToPost), language)
  postsCache = { key: cacheKey, data: result, ts: Date.now() }
  return result
}

export async function getPost(slug: string): Promise<Post | null> {
  const localPost = getLocalPost(slug)

  if (!supabase) {
    return localPost
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    if (localPost) return localPost
    console.error('Failed to fetch post:', error)
    return null
  }

  return rowToPost(data as PostRow)
}

export async function createPost(post: Post): Promise<boolean> {
  if (!supabase) {
    console.error('Failed to create post: Supabase is not configured')
    return false
  }

  const { error } = await supabase
    .from('posts')
    .insert({
      slug: post.slug,
      title: post.title,
      date: post.date,
      summary: post.summary,
      tags: post.tags,
      category: post.category,
      content: post.content,
      published: true,
      language: post.language || 'ko',
    })

  if (error) {
    console.error('Failed to create post:', error)
    return false
  }
  return true
}

/** Get the alternate-language slug for a post (convention: EN posts have `-en` suffix) */
export function getAlternateSlug(slug: string, currentLang: PostLanguage): string {
  if (currentLang === 'en') {
    return slug.replace(/-en$/, '')
  }
  return `${slug}-en`
}

export async function deletePost(slug: string): Promise<boolean> {
  if (!supabase) {
    console.error('Failed to delete post: Supabase is not configured')
    return false
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('slug', slug)

  if (error) {
    console.error('Failed to delete post:', error)
    return false
  }
  return true
}
