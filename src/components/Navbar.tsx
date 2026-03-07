import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import styles from './Navbar.module.css'

interface Props {
  dark: boolean
}

export default function Navbar({ dark }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { isAdmin, logout, openLogin } = useAdminAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  const navClass = [
    styles.nav,
    scrolled ? styles.scrolled : '',
    dark ? styles.dark : '',
  ].join(' ')

  return (
    <nav className={navClass}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          Chaewon Yoon
        </Link>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴 토글"
        >
          <span /><span /><span />
        </button>

        <div className={`${styles.links} ${menuOpen ? styles.mobileOpen : ''}`}>
          <Link to="/cv" className={location.pathname === '/cv' ? styles.active : ''}>CV</Link>
          <Link to="/projects" className={location.pathname === '/projects' ? styles.active : ''}>Projects</Link>
          <Link to="/blog" className={location.pathname.startsWith('/blog') ? styles.active : ''}>Blog</Link>
          <button
            type="button"
            className={`${styles.adminButton} ${isAdmin ? styles.adminButtonActive : ''}`}
            onClick={isAdmin ? logout : () => openLogin(location.pathname)}
          >
            {isAdmin ? '관리자 로그아웃' : '관리자 로그인'}
          </button>
        </div>
      </div>
    </nav>
  )
}
