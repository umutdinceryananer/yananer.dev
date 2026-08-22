import { useMediaQuery } from './useMediaQuery'

/**
 * Whether the viewer has asked for reduced motion, tracked live so flipping the
 * OS setting takes effect without a reload.
 *
 * CSS `motion-reduce:` variants only silence the transition; any JavaScript that
 * holds an element hidden for the duration of that transition has to be told
 * separately, or the viewer gets the hidden state with none of the animation
 * that justified it.
 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
