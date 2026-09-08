import { useEffect } from 'react'

/**
 * Boots the tracker, and is the only thing that ever does.
 *
 * Rendered from main.tsx, and deliberately NOT imported by App.tsx. App is the
 * root of the `vite build --ssr` graph that scripts/prerender.ts runs under
 * Node; anything reachable from it gets built into dist-ssr/entry-server.js and
 * executed at build time. A tracker in that graph would reach for `navigator`
 * during the build and, if it survived that, would emit a view for every
 * deploy.
 *
 * The import is dynamic so the tracker lands in its own chunk instead of the
 * 258KB main bundle — a visitor who opts out, or a fork with no endpoint
 * configured, never downloads it. scripts/audit-analytics.ts asserts both
 * halves of that: a separate chunk, and a gzipped size under budget.
 *
 * It runs from an effect because that is the only reliable "the client has
 * mounted" signal here. main.tsx uses createRoot, not hydrateRoot, so the
 * prerendered markup is thrown away and re-rendered — and since the prerender
 * ran the same <App/>, the tree it leaves behind is structurally identical to
 * the live one. There is nothing to probe for. Measuring before this point
 * describes a DOM that is about to be deleted, rendered at the prerenderer's
 * fixed desktop-dark defaults rather than at anything a visitor ever saw.
 */
export default function Analytics() {
  useEffect(() => {
    let stop: (() => void) | undefined
    let cancelled = false

    import('../lib/analytics/tracker')
      .then((m) => {
        // StrictMode runs effects twice in development; the first pass may
        // resolve after its own cleanup has already run.
        if (cancelled) return
        stop = m.start()
      })
      .catch(() => {
        // A chunk that fails to load is a visitor on a flaky connection, not
        // an error worth surfacing to them.
      })

    return () => {
      cancelled = true
      stop?.()
    }
  }, [])

  return null
}
