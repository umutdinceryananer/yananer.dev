import { useEffect } from 'react'

/**
 * Freezes the page behind a dialog.
 *
 * The obvious `document.body.style.overflow = 'hidden'` does nothing here:
 * index.css already sets that on body, and the element that actually scrolls is
 * the fixed `.app-scroll` shell. So the page kept scrolling behind an open
 * dialog. This locks the real scroller instead.
 *
 * `.app-scroll` keeps its `scrollbar-gutter: stable`, which applies to scroll
 * containers whatever their overflow value — so the gutter stays reserved and
 * locking cannot shift the centred layout sideways.
 */
let lockDepth = 0

function setLocked(on: boolean) {
  const scroller = document.querySelector('.app-scroll')
  if (!scroller) return
  if (on) {
    lockDepth += 1
    scroller.classList.add('is-locked')
  } else {
    lockDepth = Math.max(0, lockDepth - 1)
    if (lockDepth === 0) scroller.classList.remove('is-locked')
  }
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    setLocked(true)
    return () => setLocked(false)
  }, [active])
}
