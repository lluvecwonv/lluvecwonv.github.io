import type { ReactNode } from 'react'
import { useAdminAuth } from '../context/AdminAuthContext'
import styles from './AdminAccessGate.module.css'

interface Props {
  children: ReactNode
  title: string
  description: string
  redirectTo: string
}

export default function AdminAccessGate({ children, title, description, redirectTo }: Props) {
  const { isAdmin, openLogin } = useAdminAuth()

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          <span className={styles.eyebrow}>Admin Only</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
          <button type="button" className={styles.button} onClick={() => openLogin(redirectTo)}>
            관리자 로그인
          </button>
        </div>
      </div>
    </main>
  )
}
