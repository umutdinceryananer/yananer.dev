import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import Analytics from './components/Analytics'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {/* Outside the boundary, and last: it renders nothing, and a tracker that
        threw must not be able to take the page down with it. Mounted here
        rather than inside App so it stays out of the SSR graph the prerender
        builds — see components/Analytics.tsx. */}
    <Analytics />
  </StrictMode>,
)
