import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { BlogThemeProvider, useBlogTheme } from './context/BlogThemeContext'
import PageTransition from './components/PageTransition'

// Route-based code splitting — each page loaded on demand
const Home = lazy(() => import('./pages/Home'))
const ProjectsPage = lazy(() => import('./pages/Projects'))
const CVPage = lazy(() => import('./pages/CV'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogWrite = lazy(() => import('./pages/BlogWrite'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const AdminAccessGate = lazy(() => import('./components/AdminAccessGate'))

function AppShell() {
  const location = useLocation()
  const { isBlogLight } = useBlogTheme()
  const isBlog = location.pathname.startsWith('/blog')
  const useDarkBlogTheme = isBlog && !isBlogLight

  return (
    <div className={useDarkBlogTheme ? 'app dark-theme' : 'app'}>
      <Navbar dark={useDarkBlogTheme} />
      <Suspense fallback={null}>
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
      </Suspense>
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
