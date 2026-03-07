export const ADMIN_SESSION_KEY = 'my-site-admin-session'
export const DEFAULT_ADMIN_PASSWORD = '0510'
export const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD).trim()

export function getStoredAdminSession() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
}

export function setStoredAdminSession(isAdmin: boolean) {
  if (typeof window === 'undefined') return
  if (isAdmin) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, 'true')
    return
  }
  window.localStorage.removeItem(ADMIN_SESSION_KEY)
}
