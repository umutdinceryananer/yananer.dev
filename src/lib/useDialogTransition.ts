import { useEffect, useState } from 'react'

/**
 * Keeps a dialog in the DOM long enough to play its closing animation.
 *
 * `render` says whether the dialog should exist at all; `shown` says whether it
 * should be in its open state. Flip classes off `shown` and bail out on
 * `!render`, and a dialog gets a real enter *and* exit transition without any
 * animation library.
 *
 * `durationMs` must match the CSS transition duration, otherwise the dialog
 * either vanishes mid-animation or lingers invisibly.
 */
export function useDialogTransition(open: boolean, durationMs = 200) {
  const [render, setRender] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (open) {
      setRender(true)
      // Two frames: the first lets the browser paint the closed state, the
      // second flips to open. Without a painted starting point there is nothing
      // to transition from and the dialog still snaps into place.
      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }

    setShown(false)
    const timer = setTimeout(() => setRender(false), durationMs)
    return () => clearTimeout(timer)
  }, [open, durationMs])

  return { render, shown }
}

/**
 * The shared open/close chrome for a dialog, so the four of them cannot drift
 * apart. Each caller adds its own backdrop tint and panel box on top.
 *
 * The backdrop is a separate, click-through layer: it fades on its own while
 * the panel scales, and letting clicks pass keeps whatever close-on-outside
 * behaviour the container already had.
 *
 * Durations here must match the exitMs given to useDialogTransition.
 */
export function dialogChrome(shown: boolean) {
  return {
    backdrop: `absolute inset-0 backdrop-blur-sm pointer-events-none transition-opacity duration-200 motion-reduce:transition-none ${
      shown ? 'opacity-100' : 'opacity-0'
    }`,
    panel: `relative transition-all duration-200 ease-out motion-reduce:transition-none ${
      shown ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
    }`,
  }
}
