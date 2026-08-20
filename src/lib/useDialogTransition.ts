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
