import { supabase } from '../lib/supabase'

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

interface PostRow {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  category: string
  content: string
  published: boolean
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
  }
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false })

  if (error) {
    console.error('Failed to fetch posts:', error)
    return []
  }

  return (data as PostRow[]).map(rowToPost)
}

export async function getPost(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    console.error('Failed to fetch post:', error)
    return null
  }

  return rowToPost(data as PostRow)
}

export async function createPost(post: Post): Promise<boolean> {
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
    })

  if (error) {
    console.error('Failed to create post:', error)
    return false
  }
  return true
}

export async function deletePost(slug: string): Promise<boolean> {
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
