import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/Home'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const isHome = location.pathname === "/"

  return (
    <motion.div
      initial={{ opacity: 0, x: isHome ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isHome ? 20 : -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 bg-[#0F0F0F] overflow-auto"
    >
      {children}
    </motion.div>
  )
}

const AnimatedRoutes = () => {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageLayout>
            <Home />
          </PageLayout>
        } />
        <Route path="/blog" element={
          <PageLayout>
            <Blog />
          </PageLayout>
        } />
        <Route path="/blog/:slug" element={
          <PageLayout>
            <BlogPost />
          </PageLayout>
        } />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <Router>
      <div className="fixed inset-0 bg-[#0F0F0F] overflow-hidden">
        <AnimatedRoutes />
      </div>
    </Router>
  )
}

export default App
