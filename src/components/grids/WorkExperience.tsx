import { useCallback, useEffect, useRef, useState } from 'react'
import { profile } from '../../data/profile'
import { useMediaQuery, PHONE } from '../../lib/useMediaQuery'
import { CollapsedTail, ShowMore } from '../ShowMore'
import type { WorkEntry } from '../../data/profile'

/** How many roles stand open on a phone before the rest are behind the button. */
const OPEN_ON_PHONE = 3

const entry = (e: WorkEntry) => (
  <div key={e.order} className="relative p-4 rounded-lg transition-colors group">
    {/* Progress Dot */}
    <div className="absolute -left-[18px] top-5 w-5 h-5 rounded-full bg-surface-1 ring-2 ring-accent-500 ring-offset-2 ring-offset-surface-0 group-hover:ring-offset-surface-1 transition-all flex items-center justify-center">
      <span className="text-xs text-gray-400 font-medium">{e.order}</span>
    </div>

    <div className="flex items-center gap-2 mb-2">
      <h4 className="text-accent-400 font-medium">{e.title}</h4>
    </div>

    <div className="flex flex-wrap gap-2 mb-3">
      <span className="px-2 py-1 bg-surface-2 rounded-md text-gray-400 text-xs border border-gray-800">
        {e.company}
      </span>
      <span className="px-2 py-1 bg-surface-2 rounded-md text-gray-400 text-xs border border-gray-800">
        {e.period}
      </span>
      {e.status && (
        <span className="px-2 py-1 bg-surface-2 rounded-md text-gray-400 text-xs border border-gray-800">
          {e.status}
        </span>
      )}
    </div>

    <p className="text-gray-400 text-sm">{e.description}</p>
  </div>
)

const WorkExperience = () => {
  const isPhone = useMediaQuery(PHONE)
  const [expanded, setExpanded] = useState(false)

  // On anything wider the card is a fixed-height scroller and every role is
  // already reachable, so there is nothing to hold back.
  const shown = isPhone ? profile.work.slice(0, OPEN_ON_PHONE) : profile.work
  const rest = isPhone ? profile.work.slice(OPEN_ON_PHONE) : []

  const scrollerRef = useRef<HTMLDivElement>(null)
  const topFadeRef = useRef<HTMLDivElement>(null)
  const bottomFadeRef = useRef<HTMLDivElement>(null)
  const fadeFrame = useRef<number | null>(null)

  /** Paint the scroll-fade overlays from where the list is sitting right now. */
  const syncFades = useCallback(() => {
    fadeFrame.current = null
    const el = scrollerRef.current
    if (!el) return
    const atTop = el.scrollTop <= 5
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5
    if (topFadeRef.current) topFadeRef.current.style.opacity = atTop ? '0' : '1'
    if (bottomFadeRef.current) bottomFadeRef.current.style.opacity = atBottom ? '0' : '1'
  }, [])

  // A finger drag fires scroll far more often than the screen refreshes, and
  // the old handler answered every single one with two document-wide id
  // lookups and a fresh read of scrollHeight. Coalescing to one update per
  // frame does the same work at the only rate it can actually be seen at.
  const handleScroll = useCallback(() => {
    if (fadeFrame.current === null) fadeFrame.current = requestAnimationFrame(syncFades)
  }, [syncFades])

  useEffect(() => () => {
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current)
  }, [])

  // Eight entries always overflow, but measure rather than assume: the bottom
  // fade should not be showing if the list happens to fit.
  useEffect(() => { syncFades() }, [syncFades])

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-ink mb-3 text-center">Work Experience</h3>
        <div className="h-0.5 w-8 mx-auto rounded-full bg-accent-500" />
      </div>
      {/* Every size class here starts at 745px, the grid's own first
          breakpoint. Below it the page is one column and this card is the full
          width of the screen -- so it gets no height of its own and the list
          stops being a scroller. A 500px window scrolling inside a page that
          also scrolls is a fight the finger keeps losing: the gesture belongs
          to whichever scroller it began in. Length is handled by the button
          instead, which costs a tap and no wrestling. */}
      <div className="flex-1 relative min-[745px]:min-h-[400px] md:min-h-[600px] lg:min-h-0">
        <div
          ref={scrollerRef}
          className="min-[745px]:absolute min-[745px]:inset-0 min-[745px]:overflow-y-auto card-scroll scroll-smooth"
          onScroll={handleScroll}
        >
          {/* The progress line measures this box, and the box holds both the
              open entries and the tail. So the line grows with the tail as it
              slides, instead of stopping short at whatever was on screen when
              the card first painted. The button sits outside it, or the line
              would run down past the last role and through the button. */}
          <div className="relative pl-6 pr-2 pb-3">
            {/* Vertical Progress Line */}
            <div className="absolute left-[15px] top-[28px] h-[calc(100%-56px)] w-[2px] bg-gradient-to-b from-transparent via-gray-800 to-transparent">
              <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-b from-accent-500/80 via-accent-500/50 to-accent-500/80" />
            </div>

            {/* Experience Items */}
            <div className="space-y-8">{shown.map(entry)}</div>
            {/* The dots hang 22px left of each entry to straddle the line,
                which put them outside the tail's clip box -- they came back
                sheared in half. -ml-6/pl-6 is the container's own pl-6 read
                back: it pushes the clip edge out to where the padding already
                reserved room for them, and pads the content back to where it
                was. */}
            {isPhone && (
              <CollapsedTail open={expanded} bleed="-ml-6 pl-6">
                {/* pt-8 stands in for the space-y-8 that no longer reaches
                    across the seam between the two lists. */}
                <div className="space-y-8 pt-8">{rest.map(entry)}</div>
              </CollapsedTail>
            )}
          </div>
          {isPhone && rest.length > 0 && (
            <ShowMore
              open={expanded}
              hidden={rest.length}
              onToggle={() => setExpanded((v) => !v)}
            />
          )}
        </div>
        {/* Nothing scrolls below 745px, so there is no edge to fade -- and
            left in, these would lay two gradient strips over open content. */}
        <div ref={topFadeRef} className="hidden min-[745px]:block absolute top-0 left-0 right-2 h-12 bg-gradient-to-b from-surface-1 to-transparent pointer-events-none transition-opacity duration-500 opacity-0" />
        <div ref={bottomFadeRef} className="hidden min-[745px]:block absolute bottom-0 left-0 right-2 h-12 bg-gradient-to-t from-surface-1 to-transparent pointer-events-none transition-opacity duration-500" />
      </div>
    </div>
  )
}

export default WorkExperience
