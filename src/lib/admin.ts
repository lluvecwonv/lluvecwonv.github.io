import { supabase } from './supabase'

const ADMIN_EMAIL = ((import.meta.env.VITE_ADMIN_EMAIL as string) || '').trim()

export async function signInAdmin(password: string) {
  if (!supabase || !ADMIN_EMAIL) {
    return 'Admin auth is not configured.'
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  })
  return error ? error.message : null
}

export async function signOutAdmin() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}
