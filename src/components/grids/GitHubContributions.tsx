import { ActivityCalendar, type Activity } from 'react-activity-calendar'
import { cloneElement, useEffect, useMemo, useState, useRef } from 'react'
import type { CSSProperties } from 'react'
import { profile } from '../../data/profile'
import { useContributions, WEEKS } from '../../lib/useContributions'
import { useTheme } from '../../lib/useTheme'

// GitHub's own contribution greens — the calendar keeps its native colour while
// the rest of the site runs on the neutral accent scale. Both are GitHub's real
// published scales rather than one recoloured for the other: a heatmap everyone
// already knows how to read should look like the one they know.
//
// Only the empty cell is ours. GitHub pitches theirs against GitHub's own
// background; these are pitched against this card, which is a shade darker on
// dark and plain white on light.
const GH_SCALES = {
  dark: ['#151515', '#0e4429', '#006d32', '#26a641', '#39d353'],
  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
} as const

/**
 * Per-cell timing for the flap reveal.
 *
 * The grid starts on a week boundary and runs one entry per day, so an entry's
 * index gives its column and row outright: column = i / 7, row = i % 7. The
 * duration varies in three steps so neighbouring cells settle out of sync —
 * a board where every flap stopped on the same beat would look driven rather
 * than mechanical.
 */
function flapTimings(activities: Activity[]) {
  const byDate = new Map<string, { delay: number; duration: number }>()
  activities.forEach((a, i) => {
    byDate.set(a.date, {
      delay: Math.floor(i / 7) * 16 + (i % 7) * 4,
      duration: 260 + (i % 3) * 80,
    })
  })
  return byDate
}

/** "Aug 12", or "Aug 12, 2025" when the grid has reached back into last year. */
function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-US', opts)
}

type Tip = { count: number; date: string; x: number; y: number; sticky: boolean }

const GitHubContributions = () => {
  const [tooltip, setTooltip] = useState<Tip | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { activities, loaded } = useContributions(profile.githubHandle)

  // A touch has no hover to hold a tooltip open, so on a phone this grid used
  // to be 147 silent squares -- the count and the date were unreachable. A tap
  // now opens the tooltip and it stays until a tap lands outside the card.
  //
  // Taps *inside* are ignored on purpose: moving from one cell to the next
  // fires pointerenter before pointerdown, so a blanket dismiss would wipe the
  // tooltip the neighbouring cell had just set.
  useEffect(() => {
    if (!tooltip?.sticky) return
    const dismiss = (e: PointerEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      setTooltip(null)
    }
    // A beat late, or the very tap that opened it would close it again.
    const t = setTimeout(() => document.addEventListener('pointerdown', dismiss), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('pointerdown', dismiss)
    }
  }, [tooltip?.sticky, tooltip?.date])

  // The calendar library keys its palette off this, and the flap keyframes
  // read the same array, so one lookup drives both.
  const { resolved } = useTheme()
  const scale = GH_SCALES[resolved]

  // The reveal is a first-arrival animation, not a repaint. Without this it
  // replayed on every theme swap: the grid whirred through greens again while
  // the rest of the page was quietly cross-fading, which reads as a glitch
  // rather than a flourish. A ref rather than state — flipping it must not
  // itself cause the render that cuts the animation short.
  const flapped = useRef(false)
  const flapping = loaded && !flapped.current
  useEffect(() => {
    if (loaded) flapped.current = true
  }, [loaded])

  const timing = useMemo(() => flapTimings(activities), [activities])
  const total = useMemo(() => activities.reduce((n, a) => n + a.count, 0), [activities])

  // The flap keyframes step through fixed greens and land on the cell's real
  // colour, which has to be handed in per cell.
  const scaleVars = {
    '--gh-1': scale[1],
    '--gh-2': scale[2],
    '--gh-3': scale[3],
    '--gh-4': scale[4],
  } as CSSProperties

  return (
    <div className="h-full flex flex-col relative overflow-visible" ref={containerRef}>
      <h3 className="text-xl font-semibold text-ink mb-3 text-center">GitHub Contributions</h3>
      <div className="h-0.5 w-8 mx-auto rounded-full bg-accent-500 mb-4" />
      {/* One labelled image rather than 147 unlabelled rects. A heatmap is a
          picture of data: naming the whole thing gives a screen reader the
          headline figure, where per-cell labels would only offer 147 tab stops
          and no shape. The hover tooltip stays a sighted-pointer nicety. */}
      <div
        role="img"
        aria-busy={!loaded}
        aria-label={
          loaded
            ? `${total} GitHub contributions over the last ${WEEKS} weeks`
            : 'Loading GitHub contributions'
        }
        className="flex-1 flex items-center justify-center min-w-0"
        style={{ overflow: 'clip' }}
      >
        <ActivityCalendar
          // Remount on a theme change rather than trusting the swap to
          // propagate. The library takes colorScheme as a prop and ought to be
          // reactive, but in dark mode the grid was coming back in the light
          // palette and staying there until a reload — bright enough to be the
          // one thing on the page that had not changed. Rebuilding from
          // scratch cannot leave anything stale behind, and costs a remount on
          // a press nobody makes twice a minute.
          key={resolved}
          data={activities}
          colorScheme={resolved}
          blockSize={12}
          blockMargin={3}
          fontSize={12}
          maxLevel={4}
          showMonthLabels={false}
          showColorLegend={false}
          labels={{ totalCount: ' ' }}
          theme={{ dark: [...GH_SCALES.dark], light: [...GH_SCALES.light] }}
          // Never pass `loading`: the library discards the data it is given and
          // substitutes a full calendar year, which is the oversized skeleton
          // useContributions exists to avoid. Until the numbers land the grid
          // stands in as a faint scaffold; then the cells flap into place over it.
          className={flapping ? 'gh-flap' : undefined}
          style={{ ...scaleVars, opacity: loaded ? 1 : 0.35 }}
          renderBlock={(block, activity: Activity) => {
            const t = timing.get(activity.date)
            const style = {
              ...(block.props as { style?: CSSProperties }).style,
              animationDelay: `${t?.delay ?? 0}ms`,
              animationDuration: `${t?.duration ?? 300}ms`,
              '--gh-final': scale[activity.level] ?? scale[0],
            } as CSSProperties

            return cloneElement(block, {
              style,
              // Pointer events rather than mouse events: one pair of handlers
              // covers hover and tap, and pointerType says which one happened.
              onPointerEnter: (e: React.PointerEvent<SVGRectElement>) => {
                if (!containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                const target = e.currentTarget.getBoundingClientRect()
                setTooltip({
                  count: activity.count,
                  date: activity.date,
                  x: target.left - rect.left + target.width / 2,
                  y: target.top - rect.top - 6,
                  // The tooltip sits above the cell, so a finger on the cell
                  // never covers it -- it just needs to survive the touchend
                  // that pointerleave would otherwise treat as leaving.
                  sticky: e.pointerType !== 'mouse',
                })
              },
              onPointerLeave: (e: React.PointerEvent<SVGRectElement>) => {
                if (e.pointerType === 'mouse') setTooltip(null)
              },
            })
          }}
        />
      </div>
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 whitespace-nowrap -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {/* Two lines, and the hierarchy is carried by weight and brightness
              rather than by shrinking the date out of legibility. */}
          <div className="bg-surface-3 border border-gray-700 rounded-md px-2.5 py-1.5 leading-tight shadow-lg">
            <div className="text-[11px] font-medium text-ink">
              {tooltip.count} contribution{tooltip.count === 1 ? '' : 's'}
            </div>
            <div className="text-[10px] text-gray-300">{formatDay(tooltip.date)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GitHubContributions
