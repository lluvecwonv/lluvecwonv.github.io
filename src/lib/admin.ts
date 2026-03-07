import { supabase } from './supabase'

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string) || ''

export async function signInAdmin(password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  })
  return error ? error.message : null
}

export async function signOutAdmin() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
