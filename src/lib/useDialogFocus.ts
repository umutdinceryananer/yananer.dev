import { useEffect, type RefObject } from 'react'

/**
 * Keyboard and screen-reader plumbing for a modal dialog.
 *
 * Moves focus into the panel when it opens, keeps Tab inside it, and hands
 * focus back to whatever opened it on close. The page behind is marked `inert`,
 * which both blocks tabbing out and takes the background out of a screen
 * reader's browse mode — `aria-modal` alone only promises that, it does not
 * enforce it. The Tab trap stays as a fallback for engines without `inert`.
 *
 * Pass the *rendered* flag from useDialogTransition, not the open prop: render
 * flips a commit later, and the panel ref is still null on the earlier one.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// Refcounted: whoever closes last is the one that gives the page back.
let inertDepth = 0

function markBackgroundInert(on: boolean) {
  const root = document.getElementById('root')
  if (!root) return
  if (on) {
    inertDepth += 1
    root.inert = true
  } else {
    inertDepth = Math.max(0, inertDepth - 1)
    if (inertDepth === 0) root.inert = false
  }
}

export function useDialogFocus(active: boolean, panelRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const panel = panelRef.current
    if (!active || !panel) return

    const opener = document.activeElement as HTMLElement | null

    // getClientRects rather than offsetParent: offsetParent is null for
    // anything positioned fixed, which would hide the whole dialog from this.
    const focusable = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      )

    // The panel itself, not its first control. It carries the role and the
    // label, so assistive tech announces what just opened before the visitor
    // moves; landing straight on a close button announces "Close" and nothing
    // about the dialog it belongs to. Tab goes on from here.
    panel.focus()

    markBackgroundInert(true)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const edge = e.shiftKey ? items[0] : items[items.length - 1]
      const wrapTo = e.shiftKey ? items[items.length - 1] : items[0]
      if (document.activeElement === edge || !panel.contains(document.activeElement)) {
        e.preventDefault()
        wrapTo.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      markBackgroundInert(false)
      // Only if it is still on the page — the view behind may have changed.
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [active, panelRef])
}
