import { GitHubCalendar } from 'react-github-calendar'
import type { Activity } from 'react-activity-calendar'
import { cloneElement, useState, useRef } from 'react'

const GitHubContributions = () => {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="h-full flex flex-col relative overflow-visible" ref={containerRef}>
      {/* Page peel link to GitHub */}
      <a
        href="https://github.com/Automaticare"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 lg:-top-7 lg:-right-7 w-12 h-12 z-10 group"
      >
        <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="peelGrad" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="peelBack" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
          </defs>
          {/* Page underneath */}
          <path d="M20 0 L40 0 L40 20 Z" fill="url(#peelBack)" />
          {/* Curled part */}
          <path d="M20 0 Q24 10 40 20 L40 0 Z" fill="url(#peelGrad)" className="group-hover:brightness-125 transition-all" />
          {/* Fold line */}
          <path d="M20 0 Q24 10 40 20" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeOpacity="0.6" />
        </svg>
      </a>
      <h3 className="text-xl font-semibold text-white mb-3 text-center font-manrope">GitHub Contributions</h3>
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-4" />
      <div className="flex-1 flex items-center justify-center overflow-hidden min-w-0">
        <GitHubCalendar
          username="Automaticare"
          colorScheme="dark"
          blockSize={12}
          blockMargin={3}
          fontSize={12}
          showMonthLabels={false}
          showColorLegend={false}
          labels={{ totalCount: ' ' }}
          theme={{
            dark: ['#1a1a2e', '#312e81', '#4338ca', '#6366f1', '#818cf8']
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
          className="absolute pointer-events-none z-50 bg-[#1a1a1a] text-xs text-gray-300 px-3 py-1.5 rounded-lg border border-gray-800 whitespace-nowrap font-manrope -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

export default GitHubContributions
