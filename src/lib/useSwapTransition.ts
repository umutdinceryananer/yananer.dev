import { useEffect, useState } from 'react'

/**
 * Delays swapping a value so the outgoing content can animate away first.
 *
 * `rendered` is the value to actually draw; `shown` is whether it should be in
 * its visible state. On a change it flips `shown` off, holds the old value for
 * `exitMs` while it animates out, swaps, then flips `shown` back on once the
 * incoming content has been painted in its hidden state.
 *
 * `exitMs` must match the CSS exit duration, or the swap lands mid-animation
 * and the change becomes visible.
 */
export function useSwapTransition<T>(value: T, exitMs = 150) {
  const [rendered, setRendered] = useState(value)
  const [shown, setShown] = useState(true)

  useEffect(() => {
    if (value === rendered) return
    setShown(false)
    const timer = setTimeout(() => setRendered(value), exitMs)
    return () => clearTimeout(timer)
  }, [value, rendered, exitMs])

  useEffect(() => {
    if (shown || value !== rendered) return
    // The incoming content is mounted but still hidden. Give the browser a
    // frame to paint that state first, otherwise there is nothing to
    // transition from and it snaps in.
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [shown, value, rendered])

  return { rendered, shown }
}
