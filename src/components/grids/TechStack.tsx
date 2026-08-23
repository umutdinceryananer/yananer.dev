import { useState, useEffect, useCallback, useRef } from 'react'
import { profile } from '../../data/profile'
import type { TechItem, GrowthItem } from '../../data/profile'
import { useSwapTransition, swapClasses } from '../../lib/useSwapTransition'
import { useMediaQuery, PHONE } from '../../lib/useMediaQuery'
import { CollapsedTail, ShowMore } from '../ShowMore'

const VIEWS = [
  { id: 'skills', label: 'Skills' },
  { id: 'growth', label: 'Not Yet' },
] as const

/**
 * How many entries stand open on a phone before the rest go behind the button.
 *
 * Skills is a two-column grid, so eight is four rows — enough to read as a list
 * rather than a teaser. Not Yet is a single column of taller cards, so four
 * takes about the same amount of screen.
 */
const OPEN_ON_PHONE = { skills: 8, growth: 4 } as const

const growthCard = (g: GrowthItem) => (
  <div
    key={g.area}
    className="bg-surface-1 p-3 rounded-lg border border-gray-800 hover:border-accent-500/50 transition-colors"
  >
    <span className="text-accent-300 text-sm">{g.area}</span>
    <p className="text-gray-500 text-xs mt-1 leading-relaxed">{g.note}</p>
  </div>
)

const TechStack = () => {
  const technologies = profile.tech
  const growth = profile.growth
  const isPhone = useMediaQuery(PHONE)
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState<'skills' | 'growth'>('skills')
  // Which marker has been tapped open. Hover still works on its own; this is
  // the path for anyone without a pointer to hover with.
  const [openTip, setOpenTip] = useState<number | null>(null)

  // The pill answers the click straight away while the list underneath fades,
  // so `view` drives the toggle and `rendered` drives the content.
  const { rendered, shown } = useSwapTransition(view)

  // On anything wider the card is a fixed-height scroller and everything is
  // already reachable inside it, so there is nothing to hold back.
  const items: readonly (TechItem | GrowthItem)[] = rendered === 'skills' ? technologies : growth
  const cut = isPhone ? OPEN_ON_PHONE[rendered] : items.length
  const shownItems = items.slice(0, cut)
  const restItems = items.slice(cut)

  /** One skill card. Takes the index it has in the full list, not the slice —
      the tooltip state is keyed by it and must survive the split. */
  const techCard = (tech: TechItem, index: number) => (
    <div
      key={tech.name}
      className="bg-surface-1 p-3 rounded-lg flex items-center border border-gray-800 hover:border-accent-500/50 transition-colors relative group"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-accent-300 text-sm">{tech.name}</span>
          {tech.hasTooltip && (
            <>
              {/* The dot was an 8px mystery: what it meant lived in a hover
                  tooltip, so on a phone it meant nothing at all and to a screen
                  reader it was not there. As a button it carries its own name,
                  answers a tap, and takes focus -- with a 32px hit area pulled
                  back in by a negative margin so the row does not shift. */}
              <button
                type="button"
                aria-label="Used in this portfolio"
                aria-expanded={openTip === index}
                onClick={() => setOpenTip((cur) => (cur === index ? null : index))}
                className="-m-2.5 grid h-8 w-8 place-items-center rounded-full"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse motion-reduce:animate-none" />
              </button>
              <div
                aria-hidden
                className={`absolute -top-6 left-1/2 -translate-x-1/2 bg-surface-2 text-xs text-gray-300 px-3 py-2 rounded-lg border border-gray-800 transition-opacity whitespace-nowrap z-10 pointer-events-none ${
                  openTip === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                Used in this portfolio
              </div>
            </>
          )}
          {tech.hasHeart && (
            <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          )}
        </div>
        <span className="text-gray-500 text-xs">{tech.description}</span>
      </div>
    </div>
  )

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
  // frame does the same work at the only rate it can actually be seen at --
  // and inside rAF the reads land before the browser's own layout pass rather
  // than in the middle of the gesture.
  const handleScroll = useCallback(() => {
    if (fadeFrame.current === null) fadeFrame.current = requestAnimationFrame(syncFades)
  }, [syncFades])

  useEffect(() => () => {
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current)
  }, [])

  // The list remounts on a view swap and comes back scrolled to the top, so the
  // overlays have to be told. Measuring beats assuming: a short list that does
  // not scroll at all should show neither fade, and the old code hardcoded the
  // bottom one on.
  useEffect(() => {
    syncFades()
    // The indices belong to the list that just left; carrying one over would
    // open a tooltip on whatever happens to sit in that slot now.
    setOpenTip(null)
    // Likewise the open state: Not Yet should not arrive already unfolded
    // because Skills was.
    setExpanded(false)
  }, [rendered, syncFades])

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex justify-center mb-3">
          <div className="relative inline-grid grid-cols-2 bg-surface-2 border border-gray-800 rounded-full p-0.5">
            {/* Same sliding highlight as the top nav: equal grid columns mean a
                whole-width translate always lands on the other segment. */}
            <span
              aria-hidden
              className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full bg-accent-500 will-change-transform transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(${VIEWS.findIndex((v) => v.id === view) * 100}%)` }}
            />
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`relative z-10 inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium leading-none transition-colors duration-300 ${
                  view === v.id ? 'text-accent-fg' : 'text-gray-400 hover:text-ink'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-0.5 w-8 mx-auto rounded-full bg-accent-500" />
      </div>

      {/* Same as Work Experience: below 745px the card is the width of the
          screen, so the list stops being a scroller and grows to its content.
          What that content is depends on the button below it. */}
      <div className="flex-1 relative min-[745px]:min-h-[400px] md:min-h-[600px] lg:min-h-0">
        <div
          key={rendered}
          ref={scrollerRef}
          className={`min-[745px]:absolute min-[745px]:inset-0 min-[745px]:overflow-y-auto card-scroll scroll-smooth ${swapClasses(shown)}`}
          onScroll={handleScroll}
        >
          {rendered === 'skills' ? (
            <>
              <div className="grid grid-cols-2 gap-3 pr-2 min-[745px]:pb-3">
                {shownItems.map((t, i) => techCard(t as TechItem, i))}
              </div>
              {restItems.length > 0 && (
                <CollapsedTail open={expanded}>
                  {/* pt-3 stands in for the gap-3 that no longer reaches across
                      the seam between the two grids. */}
                  <div className="grid grid-cols-2 gap-3 pt-3 pr-2">
                    {restItems.map((t, i) => techCard(t as TechItem, i + OPEN_ON_PHONE.skills))}
                  </div>
                </CollapsedTail>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2 pr-2 min-[745px]:pb-3">
                {shownItems.map((g) => growthCard(g as GrowthItem))}
              </div>
              {restItems.length > 0 && (
                <CollapsedTail open={expanded}>
                  <div className="space-y-2 pt-2 pr-2">
                    {restItems.map((g) => growthCard(g as GrowthItem))}
                  </div>
                </CollapsedTail>
              )}
            </>
          )}
          {restItems.length > 0 && (
            <ShowMore
              open={expanded}
              hidden={restItems.length}
              onToggle={() => setExpanded((v) => !v)}
            />
          )}
        </div>
        <div ref={topFadeRef} className="hidden min-[745px]:block absolute top-0 left-0 right-2 h-12 bg-surface-1 edge-fade-top pointer-events-none transition-opacity duration-500 opacity-0" />
        <div ref={bottomFadeRef} className="hidden min-[745px]:block absolute bottom-0 left-0 right-2 h-12 bg-surface-1 edge-fade-bottom pointer-events-none transition-opacity duration-500" />
      </div>
    </div>
  )
}

export default TechStack
