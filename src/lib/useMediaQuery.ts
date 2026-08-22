import { useCallback, useSyncExternalStore } from 'react'

/**
 * Below the grid's first breakpoint: one column, and a card is the full width
 * of the screen. Spelled as a query rather than a number so the components that
 * branch on it cannot drift from the `min-[745px]:` classes beside them.
 */
export const PHONE = '(max-width: 744.98px)'

/**
 * Whether a media query matches, tracked live so a rotation or a resize is
 * answered without a reload.
 *
 * `getSnapshot` reads matchMedia directly, so the very first render is already
 * correct — no frame of desktop layout on a phone before an effect corrects it.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
