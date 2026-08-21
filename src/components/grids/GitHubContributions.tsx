import { ActivityCalendar, type Activity } from 'react-activity-calendar'
import { cloneElement, useMemo, useState, useRef } from 'react'
import { profile } from '../../data/profile'
import { useContributions } from '../../lib/useContributions'

// GitHub's own contribution greens — the calendar keeps its native colour while
// the rest of the site runs on the neutral accent scale. Empty cells are pitched
// against this card's background rather than GitHub's.
const GH_SCALE = ['#151515', '#0e4429', '#006d32', '#26a641', '#39d353']

const GitHubContributions = () => {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { activities, loaded } = useContributions(profile.githubHandle)

  // Per-cell stagger. The grid starts on a week boundary and runs one day per
  // entry, so an entry's index gives its column and row directly. renderBlock is
  // only handed the activity, never its position, hence the lookup by date.
  const delays = useMemo(() => {
    const byDate = new Map<string, number>()
    activities.forEach((a, i) => byDate.set(a.date, Math.floor(i / 7) * 14 + (i % 7) * 5))
    return byDate
  }, [activities])

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
          theme={{
            dark: GH_SCALE
          }}
          // Never pass `loading`: the library discards the data it is given and
          // substitutes a full calendar year, which is the oversized skeleton
          // useContributions exists to avoid. Until the numbers land the grid
          // stands in as a faint scaffold; then the cells wave in over it.
          className={loaded ? 'gh-reveal' : undefined}
          style={{ opacity: loaded ? 1 : 0.35 }}
          renderBlock={(block, activity: Activity) =>
            cloneElement(block, {
              style: {
                ...(block.props as { style?: React.CSSProperties }).style,
                animationDelay: `${delays.get(activity.date) ?? 0}ms`,
              },
              onMouseEnter: (e: React.MouseEvent<SVGRectElement>) => {
                if (!containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                const target = e.currentTarget.getBoundingClientRect()
                setTooltip({
                  text: `${activity.count} contribution${activity.count !== 1 ? 's' : ''}`,
                  x: target.left - rect.left + target.width / 2,
                  y: target.top - rect.top - 8,
                })
              },
              onMouseLeave: () => setTooltip(null),
            })
          }
        />
      </div>
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 bg-surface-2 text-xs text-gray-300 px-3 py-1.5 rounded-lg border border-gray-800 whitespace-nowrap -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

export default GitHubContributions
