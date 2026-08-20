import { GitHubCalendar } from 'react-github-calendar'
import type { Activity } from 'react-activity-calendar'
import { cloneElement, useState, useRef } from 'react'
import { profile } from '../../data/profile'

// GitHub's own contribution greens — the calendar keeps its native colour while
// the rest of the site runs on the neutral accent scale. Empty cells are pitched
// against this card's background rather than GitHub's.
const GH_SCALE = ['#151515', '#0e4429', '#006d32', '#26a641', '#39d353']

const GitHubContributions = () => {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="h-full flex flex-col relative overflow-visible" ref={containerRef}>
      <h3 className="text-xl font-semibold text-ink mb-3 text-center">GitHub Contributions</h3>
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-4" />
      <div className="flex-1 flex items-center justify-center min-w-0" style={{ overflow: 'clip' }}>
        <GitHubCalendar
          username={profile.githubHandle}
          colorScheme="dark"
          blockSize={12}
          blockMargin={3}
          fontSize={12}
          showMonthLabels={false}
          showColorLegend={false}
          labels={{ totalCount: ' ' }}
          errorMessage=""
          theme={{
            dark: GH_SCALE
          }}
          renderBlock={(block, activity: Activity) =>
            cloneElement(block, {
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
          transformData={(data) => {
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - 21 * 7)
            return data.filter((day) => new Date(day.date) >= cutoff)
          }}
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
