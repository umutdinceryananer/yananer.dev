import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Projects from './pages/Projects'
import TopNav, { type Route } from './components/TopNav'
import Footer from './components/Footer'

const routeFromHash = (): Route =>
  window.location.hash.replace('#', '') === 'projects' ? 'projects' : 'about'

function App() {
  const [route, setRoute] = useState<Route>(routeFromHash())

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <div className="fixed inset-0 bg-[#0F0F0F] overflow-auto">
      <div className="min-h-screen w-full flex flex-col items-center overflow-x-hidden">
        <TopNav route={route} />
        <main className="w-full max-w-[1400px] px-2 sm:px-4 lg:px-8 pb-6 sm:pb-8 flex-1">
          {route === 'projects' ? <Projects /> : <Home />}
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default App
