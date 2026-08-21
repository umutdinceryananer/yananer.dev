import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

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
  const reduced = usePrefersReducedMotion()
  const [rendered, setRendered] = useState(value)
  const [shown, setShown] = useState(true)

  useEffect(() => {
    if (value === rendered) return
    // With motion off there is no fade to wait for, and holding the old value
    // at opacity 0 would just blank the page for the duration.
    if (reduced) {
      setRendered(value)
      return
    }
    setShown(false)
    const timer = setTimeout(() => setRendered(value), exitMs)
    return () => clearTimeout(timer)
  }, [value, rendered, exitMs, reduced])

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

/**
 * The fade a swapped-out view plays. Shared so the route change and the smaller
 * in-card toggles read as the same gesture.
 *
 * Opacity only, deliberately: a translate or transform here -- even a zero one --
 * makes the element a containing block for fixed-position descendants and gives
 * it a stacking context, which traps any dialog rendered inside it.
 *
 * The exit duration must match the exitMs given to useSwapTransition.
 */
export function swapClasses(shown: boolean) {
  return `transition-opacity ease-out motion-reduce:transition-none ${
    shown ? 'opacity-100 duration-200' : 'opacity-0 duration-150'
  }`
}
