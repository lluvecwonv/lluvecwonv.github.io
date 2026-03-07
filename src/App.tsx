import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import AdminAccessGate from './components/AdminAccessGate'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { BlogThemeProvider, useBlogTheme } from './context/BlogThemeContext'
import Home from './pages/Home'
import ProjectsPage from './pages/Projects'
import CVPage from './pages/CV'
import Blog from './pages/Blog'
import BlogWrite from './pages/BlogWrite'
import BlogPost from './pages/BlogPost'
import ProjectDetail from './pages/ProjectDetail'
import PageTransition from './components/PageTransition'

function AppShell() {
  const location = useLocation()
  const { isBlogLight } = useBlogTheme()
  const isBlog = location.pathname.startsWith('/blog')
  const useDarkBlogTheme = isBlog && !isBlogLight

  return (
    <div className={useDarkBlogTheme ? 'app dark-theme' : 'app'}>
      <Navbar dark={useDarkBlogTheme} />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/projects" element={<PageTransition><ProjectsPage /></PageTransition>} />
          <Route path="/projects/:slug" element={<PageTransition><ProjectDetail /></PageTransition>} />
          <Route path="/cv" element={<PageTransition><CVPage /></PageTransition>} />
          <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
          <Route
            path="/blog/write"
            element={(
              <PageTransition>
                <AdminAccessGate
                  title="블로그 글쓰기는 관리자만 사용할 수 있어요."
                  description="사이트에서 직접 글을 작성하려면 먼저 관리자 로그인이 필요합니다."
                  redirectTo="/blog/write"
                >
                  <BlogWrite />
                </AdminAccessGate>
              </PageTransition>
            )}
          />
          <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <AdminAuthProvider>
      <BlogThemeProvider>
        <AppShell />
      </BlogThemeProvider>
    </AdminAuthProvider>
  )
}
