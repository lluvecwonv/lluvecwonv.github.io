import { createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_PASSWORD, getStoredAdminSession, setStoredAdminSession } from '../lib/admin'
import styles from './AdminAuthContext.module.css'

interface AdminAuthContextValue {
  isAdmin: boolean
  logout: () => void
  openLogin: (redirectTo?: string) => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(getStoredAdminSession)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const redirectToRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isModalOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false)
        redirectToRef.current = null
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isModalOpen])

  useEffect(() => {
    if (!isModalOpen) {
      setPassword('')
      setError('')
    }
  }, [isModalOpen])

  const openLogin = (redirectTo?: string) => {
    redirectToRef.current = redirectTo || null
    setIsModalOpen(true)
  }

  const closeLogin = () => {
    setIsModalOpen(false)
    redirectToRef.current = null
  }

  const logout = () => {
    setIsAdmin(false)
    setStoredAdminSession(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password !== ADMIN_PASSWORD) {
      setError('비밀번호가 맞지 않습니다.')
      return
    }

    setIsAdmin(true)
    setStoredAdminSession(true)
    setIsModalOpen(false)
    setError('')
    setPassword('')

    if (redirectToRef.current) {
      navigate(redirectToRef.current)
      redirectToRef.current = null
    }
  }

  const value = useMemo<AdminAuthContextValue>(() => ({
    isAdmin,
    logout,
    openLogin,
  }), [isAdmin])

  return (
    <AdminAuthContext.Provider value={value}>
      {children}

      {isModalOpen && (
        <div className={styles.overlay} role="presentation" onClick={closeLogin}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <div>
                <h2 id="admin-login-title" className={styles.title}>관리자 로그인</h2>
                <p className={styles.subtitle}>
                  로그인하면 프로젝트 작성, 카테고리 관리, 블로그 글쓰기 기능이 열립니다.
                </p>
              </div>
              <button type="button" className={styles.closeButton} onClick={closeLogin} aria-label="닫기">
                ✕
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.label}>
                관리자 비밀번호
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.input}
                  placeholder="비밀번호를 입력하세요"
                  autoFocus
                />
              </label>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <button type="submit" className={styles.submitButton}>
                  로그인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }

  return context
}
