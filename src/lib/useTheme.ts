import { useSyncExternalStore } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/** Must match the key the inline script in index.html reads. */
const KEY = 'theme'

/** Must match --color-surface-0 in each theme. Colours the mobile browser bar. */
const BAR = { light: '#f3f4f6', dark: '#050505' } as const

const listeners = new Set<() => void>()

const readChoice = (): ThemeChoice => {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    // Storage throws outright in some privacy modes rather than returning null.
    return 'system'
  }
}

const systemTheme = (): ResolvedTheme =>
  // There is no window during the build-time prerender (src/entry-server.tsx).
  // Dark is the same answer the server snapshot at the bottom of this file and
  // the inline script's own catch in index.html already give, so all three
  // agree on what a page with no preference to read should look like.
  typeof window === 'undefined'
    ? 'dark'
    : window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'

const resolve = (c: ThemeChoice): ResolvedTheme => (c === 'system' ? systemTheme() : c)

let choice: ThemeChoice = readChoice()

/**
 * Both halves in one string.
 *
 * useSyncExternalStore bails out when the snapshot is unchanged, so this cannot
 * be the choice alone: flipping the OS preference while the choice is "system"
 * leaves the choice identical and changes only what it resolves to. Nothing
 * would re-render.
 */
let snapshot = `${choice}|${resolve(choice)}`

/** Push the resolved theme onto the document. The inline script does this once
    before first paint; from here on it is this. */
const paint = () => {
  if (typeof document === 'undefined') return
  const r = resolve(choice)
  document.documentElement.dataset.theme = r
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[r])
}

/**
 * Stamp it once on load, even though the inline script in index.html has
 * normally done exactly this before the first paint.
 *
 * When that script runs, this writes the value already on the element and
 * costs an attribute assignment. It is here for when it does not run -- a CSP
 * that forgets to allow it, an extension that strips inline scripts -- where
 * otherwise nobody writes the attribute at all, every stored preference is
 * ignored, and the site looks like it simply cannot remember the theme.
 * Arriving late is a far better failure than never arriving.
 */
paint()

const refresh = () => {
  const next = `${choice}|${resolve(choice)}`
  if (next === snapshot) return
  snapshot = next
  paint()
  listeners.forEach((l) => l())
}

const subscribe = (onChange: () => void) => {
  listeners.add(onChange)
  // Only matters while the choice is "system", but the listener is cheap and
  // unconditional is simpler than wiring it up and down as the choice changes.
  const mq = window.matchMedia('(prefers-color-scheme: light)')
  mq.addEventListener('change', refresh)
  return () => {
    listeners.delete(onChange)
    mq.removeEventListener('change', refresh)
  }
}

let switchTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Arm the cross-fade for the length of one switch, then disarm it.
 *
 * Only around a deliberate press — never around the OS flipping underneath a
 * "system" choice, which can happen at sunset while nobody is looking and does
 * not want 180ms of every element on the page easing.
 */
const armCrossFade = () => {
  const el = document.documentElement
  el.classList.add('theme-switching')

  // Force a style flush before the palette moves.
  //
  // Without this the class and the new values land in one task, and a
  // transition has no committed "before" value to leave from — the page just
  // arrives in the new theme. Reading a layout property here makes the browser
  // settle the transition-enabled style first, so the change that follows has
  // something to animate away from. One forced reflow, on a deliberate press.
  void el.offsetHeight

  if (switchTimer) clearTimeout(switchTimer)
  // Past the 350ms in the stylesheet, so the class outlives the transition it
  // exists to enable rather than cutting it off at the end.
  switchTimer = setTimeout(() => {
    switchTimer = null
    el.classList.remove('theme-switching')
  }, 420)
}

export const setTheme = (next: ThemeChoice) => {
  if (resolve(next) !== resolve(choice)) armCrossFade()
  choice = next
  try {
    // Removing the key rather than storing "system" is what lets the inline
    // script treat "no entry" as "ask the OS" without knowing our vocabulary.
    if (next === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  } catch {
    // Storage blocked. The choice still holds for this page; it just will not
    // survive a reload, which beats refusing to switch at all.
  }
  refresh()
}

/**
 * The theme the visitor asked for, and the one that is actually on screen.
 *
 * They differ whenever the choice is "system" — which is the default, so most
 * visitors are in exactly that case.
 */
export function useTheme(): { choice: ThemeChoice; resolved: ResolvedTheme } {
  const snap = useSyncExternalStore(subscribe, () => snapshot, () => 'system|dark')
  const [c, r] = snap.split('|') as [ThemeChoice, ResolvedTheme]
  return { choice: c, resolved: r }
}
