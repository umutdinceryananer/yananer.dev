import type { Route, SessionContext } from './types'

/**
 * Session identity, and the decision about whether to collect at all.
 *
 * The identity is deliberately the weakest thing that still answers a useful
 * question. It is a random id in `sessionStorage`: it dies with the tab, it is
 * not a cookie, it is never sent to any origin but our own collector, and there
 * is no second identifier anywhere that could stitch two of them together. So
 * "how far do people scroll on the Work page" is answerable and "has this
 * person been here before" is not — which is the trade this site wants, and
 * which is also what keeps it out of consent-banner territory under
 * GDPR/KVKK rather than relying on a banner nobody reads.
 */

const KEY = 'ya_sid'

/** Reads the endpoint from the build env. Unset — local dev, a fork, a preview
    someone spun up — and the whole tracker no-ops rather than 404ing in a loop. */
export const ENDPOINT: string | undefined = import.meta.env.VITE_ANALYTICS_ENDPOINT

/**
 * Every reason not to collect, in one place.
 *
 * Do Not Track has been formally retired by the spec and most browsers, but the
 * people who still set it are exactly the people who mean it, and honouring a
 * header costs us nothing. Global Privacy Control is the live successor and is
 * legally binding in some jurisdictions. `webdriver` catches headless Chrome,
 * which is most of what would otherwise look like traffic.
 */
export function optedOut(): boolean {
  try {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
    if (nav.globalPrivacyControl === true) return true
    if (nav.doNotTrack === '1' || nav.msDoNotTrack === '1') return true
    if (nav.webdriver) return true
    // An explicit local kill switch, for me: localStorage.ya_optout = '1'.
    if (localStorage.getItem('ya_optout') === '1') return true
  } catch {
    // Storage throws outright in some privacy modes. A visitor locked down
    // enough to hit that is a visitor to leave alone.
    return true
  }
  return false
}

/**
 * The id for this tab.
 *
 * Reused within the tab so a reload does not read as a second visitor, thrown
 * away with it. `randomUUID` needs a secure context, which every real visit is;
 * the fallback exists for `http://` on a LAN address during development.
 */
export function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(KEY)
    if (existing) return existing
    const id =
      typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(KEY, id)
    return id
  } catch {
    return `eph-${Math.random().toString(36).slice(2, 12)}`
  }
}

/** Which of the two views the hash is currently pointing at. */
export const routeFromHash = (): Route =>
  window.location.hash.replace('#', '') === 'work' ? 'work' : 'about'

/** UTM tags off the landing URL. Read once, before any hash navigation. */
function utmTags(): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  try {
    const params = new URLSearchParams(window.location.search)
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const value = params.get(key)
      // Capped: a UTM tag is a label, and anything longer than this is either a
      // mistake or someone using the query string as a side channel.
      if (value) out[key.slice(4)] = value.slice(0, 64)
    }
  } catch {
    return undefined
  }
  return Object.keys(out).length ? out : undefined
}

/** The once-per-session snapshot. */
export function context(): SessionContext {
  const doc = document.documentElement
  return {
    sw: screen.width,
    sh: screen.height,
    vw: doc.clientWidth,
    vh: doc.clientHeight,
    dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    lang: navigator.language ?? '',
    ref: document.referrer,
    utm: utmTags(),
    theme: doc.dataset.theme === 'light' ? 'light' : 'dark',
    rm: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}
