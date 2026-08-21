import { ActivityCalendar, type Activity } from 'react-activity-calendar'
import { cloneElement, useMemo, useState, useRef } from 'react'
import type { CSSProperties } from 'react'
import { profile } from '../../data/profile'
import { useContributions } from '../../lib/useContributions'

// GitHub's own contribution greens — the calendar keeps its native colour while
// the rest of the site runs on the neutral accent scale. Empty cells are pitched
// against this card's background rather than GitHub's.
const GH_SCALE = ['#151515', '#0e4429', '#006d32', '#26a641', '#39d353']

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

type Tip = { count: number; date: string; x: number; y: number }

const GitHubContributions = () => {
  const [tooltip, setTooltip] = useState<Tip | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { activities, loaded } = useContributions(profile.githubHandle)

  const timing = useMemo(() => flapTimings(activities), [activities])

  // The flap keyframes step through fixed greens and land on the cell's real
  // colour, which has to be handed in per cell.
  const scaleVars = {
    '--gh-1': GH_SCALE[1],
    '--gh-2': GH_SCALE[2],
    '--gh-3': GH_SCALE[3],
    '--gh-4': GH_SCALE[4],
  } as CSSProperties

  return (
    <div className="h-full flex flex-col relative overflow-visible" ref={containerRef}>
      <h3 className="text-xl font-semibold text-ink mb-3 text-center">GitHub Contributions</h3>
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-4" />
      <div className="flex-1 flex items-center justify-center min-w-0" style={{ overflow: 'clip' }}>
        <ActivityCalendar
          data={activities}
          colorScheme="dark"
          blockSize={12}
          blockMargin={3}
          fontSize={12}
          maxLevel={4}
          showMonthLabels={false}
          showColorLegend={false}
          labels={{ totalCount: ' ' }}
          theme={{ dark: GH_SCALE }}
          // Never pass `loading`: the library discards the data it is given and
          // substitutes a full calendar year, which is the oversized skeleton
          // useContributions exists to avoid. Until the numbers land the grid
          // stands in as a faint scaffold; then the cells flap into place over it.
          className={loaded ? 'gh-flap' : undefined}
          style={{ ...scaleVars, opacity: loaded ? 1 : 0.35 }}
          renderBlock={(block, activity: Activity) => {
            const t = timing.get(activity.date)
            const style = {
              ...(block.props as { style?: CSSProperties }).style,
              animationDelay: `${t?.delay ?? 0}ms`,
              animationDuration: `${t?.duration ?? 300}ms`,
              '--gh-final': GH_SCALE[activity.level] ?? GH_SCALE[0],
            } as CSSProperties

            return cloneElement(block, {
              style,
              onMouseEnter: (e: React.MouseEvent<SVGRectElement>) => {
                if (!containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                const target = e.currentTarget.getBoundingClientRect()
                setTooltip({
                  count: activity.count,
                  date: activity.date,
                  x: target.left - rect.left + target.width / 2,
                  y: target.top - rect.top - 6,
                })
              },
              onMouseLeave: () => setTooltip(null),
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
