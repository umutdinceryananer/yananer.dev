import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Projects from './pages/Projects'
import TopNav, { type Route } from './components/TopNav'
import Footer from './components/Footer'
import { useSwapTransition, swapClasses } from './lib/useSwapTransition'

// 'about' when there is no window, which is the case during the build-time
// prerender (src/entry-server.tsx). That is the same answer an empty hash
// gives, so the prerendered page is the one every visitor lands on first.
const routeFromHash = (): Route =>
  typeof window !== 'undefined' && window.location.hash.replace('#', '') === 'work'
    ? 'work'
    : 'about'

// Must match the exit duration on the page classes below.
const PAGE_EXIT_MS = 150

function App() {
  const [route, setRoute] = useState<Route>(routeFromHash())
  const { rendered, shown } = useSwapTransition(route, PAGE_EXIT_MS)

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const page = swapClasses(shown)

  return (
    <div className="app-scroll fixed inset-0 bg-surface-0 overflow-auto">
      {/* overflow-x-clip, not -hidden: `hidden` on one axis forces the other
          to `auto`, quietly making this a scroll container. Anything that then
          overflows it -- a transform, a stray pixel -- raises a scrollbar,
          narrows the content box and shunts every centred item sideways.
          `clip` clips the same way without ever scrolling. */}
      {/* Percentage height, not the viewport unit. The `screen` scale resolves
          to 100vh, which the spec pins to the viewport with the browser chrome
          *hidden*. On a phone that is taller than what is actually on screen,
          so the page hands back a few dozen pixels of scroll even when the
          content fits. The parent is `fixed inset-0`, so its height is already
          exactly the visible viewport -- 100% of it is the honest number.
          (Naming the other utility here would be enough for Tailwind's scanner
          to emit it, so it stays unspelled.) */}
      <div className="min-h-full w-full flex flex-col items-center overflow-x-clip">
        {/* The nav answers the click straight away -- its highlight starts
            sliding while the page underneath is still fading out. */}
        <TopNav route={route} />
        {/* The nav stays put and the content centres in the space left between
            it and the footer, so the control being clicked never moves.

            Auto margins rather than justify-center: on a route that outgrows the
            viewport they collapse to zero, where centring would push the top of
            the content above the scroll origin and put it out of reach. The
            footer carries no auto margin of its own -- a third one would split
            the free space three ways and pull the content off centre. */}
        <main className={`my-auto w-full max-w-[1400px] px-2 sm:px-4 lg:px-8 pb-6 sm:pb-8 ${page}`}>
          {rendered === 'work' ? <Projects /> : <Home />}
        </main>
        {/* The footer fades with the page: the two routes differ enough in
            height that it sits on screen for one and below the fold for the
            other, and hiding it through the swap keeps that from popping. */}
        <Footer className={page} />
      </div>
    </div>
  )
}

export default App
