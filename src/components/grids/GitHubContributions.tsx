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
        className="absolute -top-[18px] -right-[18px] sm:-top-[26px] sm:-right-[26px] lg:-top-[30px] lg:-right-[30px] w-12 h-12 hover:w-16 hover:h-16 z-10 group overflow-hidden rounded-tr-lg sm:rounded-tr-xl transition-all duration-300 ease-out"
      >
        <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="peelGrad" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id="peelGradHover" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="peelBack" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="100%" stopColor="#252352" />
            </linearGradient>
          </defs>
          {/* Page underneath with GitHub icon */}
          <path d="M14 0 Q14 0 40 0 L40 26 Q40 26 14 0 Z" fill="url(#peelBack)" />
          {/* GitHub icon - visible on hover */}
          <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <path
              d="M33 7.5a3.5 3.5 0 00-1.1 6.82c.18.03.25-.08.25-.17v-.6c-1.02.22-1.23-.49-1.23-.49a.97.97 0 00-.41-.53c-.33-.23.03-.22.03-.22a.77.77 0 01.56.37.78.78 0 001.07.3.78.78 0 01.23-.49c-.81-.09-1.66-.4-1.66-1.8a1.4 1.4 0 01.38-.98.13.13 0 01.02-.01 1.3 1.3 0 01.36-.93s.3-.1 1-.37a3.5 3.5 0 011.96.91 3.3 3.3 0 011.78 0 3.5 3.5 0 011.96-.91c.7.28 1 .37 1 .37a1.3 1.3 0 01.36.94.98.98 0 01.02.01 1.4 1.4 0 01.37.97c0 1.4-.85 1.71-1.67 1.8a.87.87 0 01.25.68v1c0 .1.07.2.25.17A3.5 3.5 0 0033 7.5z"
              fill="#a5b4fc"
            />
          </g>
          {/* Curled part */}
          <path d="M14 0 C20 4 28 12 40 26 L40 0 Z" fill="url(#peelGrad)" className="group-hover:[fill:url(#peelGradHover)] transition-all duration-300" />
          {/* Fold line */}
          <path d="M14 0 C20 4 28 12 40 26" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeOpacity="0.3" className="group-hover:stroke-opacity-60 transition-all duration-300" />
        </svg>
      </a>
      <h3 className="text-xl font-semibold text-white mb-3 text-center font-manrope">GitHub Contributions</h3>
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-4" />
      <div className="flex-1 flex items-center justify-center min-w-0" style={{ overflow: 'clip' }}>
        <GitHubCalendar
          username="Automaticare"
          colorScheme="dark"
          blockSize={12}
          blockMargin={3}
          fontSize={12}
          showMonthLabels={false}
          showColorLegend={false}
          labels={{ totalCount: ' ' }}
          errorMessage=""
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
