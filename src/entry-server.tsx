import { renderToString } from 'react-dom/server'
import App from './App'

/**
 * Build-time render of the app to a string, for scripts/prerender.ts.
 *
 * This exists because the served HTML previously contained an empty <div
 * id="root"> and nothing else. The JSON-LD describing the person was in it, but
 * the page that JSON-LD describes -- the name in the h1, the role, the
 * education, the rel="me" links -- only appeared once the bundle ran. Google
 * executes JavaScript and saw all of it; the crawlers this site is otherwise
 * built for, the ones reading SKILL.md and llms.txt, do not.
 *
 * The client still calls createRoot().render() rather than hydrateRoot(), so
 * this markup is replaced wholesale on mount rather than adopted. That is
 * deliberate: it means no hydration mismatch is possible, at the cost of one
 * render the visitor never sees. The two hooks that would otherwise differ
 * between here and the browser -- theme and media queries -- both already
 * declare a server snapshot, and the theme and layout are driven by CSS keyed
 * off an attribute the inline script in index.html sets before first paint, so
 * what gets painted is correct either way.
 */
export function render(): string {
  return renderToString(<App />)
}
