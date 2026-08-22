import { useEffect, useRef } from 'react'

/**
 * The tail of a list, which slides open and shut.
 *
 * The height animates by swapping `grid-template-rows` between `0fr` and `1fr`,
 * not by transitioning max-height. A max-height transition has to be given a
 * ceiling, and that guess then owns the timing: pitch it too high and the list
 * snaps open in the first third of the duration and sits still for the rest.
 * The fr swap animates to whatever height the content actually turns out to
 * have, so eight roles and thirteen skills both take the same 300ms.
 *
 * `overflow-hidden` on the inner box is what makes the outer row height bite;
 * without it the content just overflows its own zero-height track. `min-h-0`
 * goes with it: a grid item's automatic minimum size is content-based, so
 * without this the item refuses to shrink under its own content and the 0fr
 * track never wins.
 *
 * It clips on both axes, which is a problem for anything that hangs outside its
 * box — Work Experience puts its numbered dots 22px to the left so they
 * straddle the timeline, and they came back sheared in half. `bleed` is for
 * that: a negative margin plus matching padding on this box, which moves the
 * clip edge outwards without moving the content. Clipping only the vertical
 * axis would read better, but `overflow-y: clip` is unsupported before iOS 16
 * and the declaration would simply drop — turning a shaved dot into a list that
 * does not collapse at all.
 *
 * While shut the tail is `inert`, so Tab cannot land inside something clipped
 * to nothing — three of the Skills markers are focusable and live down here.
 * Set as a DOM property rather than a JSX attribute: React 18 does not accept a
 * boolean `inert` prop.
 */
export const CollapsedTail = ({
  open,
  bleed = '',
  children,
}: {
  open: boolean
  /** Paired negative-margin and padding classes, for content that sits outside
      its own box and would otherwise be clipped. See the note above. */
  bleed?: string
  children: React.ReactNode
}) => {
  const inner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inner.current) inner.current.inert = !open
  }, [open])

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div ref={inner} className={`min-h-0 overflow-hidden ${bleed}`}>
        {children}
      </div>
    </div>
  )
}

/**
 * The control that opens it. Full width on purpose: this only exists on a
 * phone, where a thumb should not have to find a target.
 *
 * The label counts what is still hidden rather than saying "Show more", so the
 * length of the list is known before committing to opening it.
 */
export const ShowMore = ({
  open,
  hidden,
  onToggle,
}: {
  open: boolean
  hidden: number
  onToggle: () => void
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-2 border border-gray-800 text-gray-300 text-sm font-medium hover:bg-surface-3 hover:border-accent-500 hover:text-ink transition-colors"
  >
    {open ? 'Show less' : `Show ${hidden} more`}
    <svg
      aria-hidden="true"
      className={`w-3.5 h-3.5 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        open ? 'rotate-180' : ''
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  </button>
)
