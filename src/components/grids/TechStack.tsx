import { useState, useEffect } from 'react'
import { profile } from '../../data/profile'
import { useSwapTransition, swapClasses } from '../../lib/useSwapTransition'

const VIEWS = [
  { id: 'skills', label: 'Skills' },
  { id: 'growth', label: 'Not Yet' },
] as const

const TechStack = () => {
  const technologies = profile.tech
  const growth = profile.growth
  const [view, setView] = useState<'skills' | 'growth'>('skills')
  // Which marker has been tapped open. Hover still works on its own; this is
  // the path for anyone without a pointer to hover with.
  const [openTip, setOpenTip] = useState<number | null>(null)

  // The pill answers the click straight away while the list underneath fades,
  // so `view` drives the toggle and `rendered` drives the content.
  const { rendered, shown } = useSwapTransition(view)

  // Reset the scroll-fade overlays when the new list actually mounts (each view
  // starts scrolled to the top): top hidden, bottom shown.
  useEffect(() => {
    const top = document.getElementById('tech-stack-blur-top')
    const bottom = document.getElementById('tech-stack-blur-bottom')
    if (top) top.style.opacity = '0'
    if (bottom) bottom.style.opacity = '1'
    // The indices belong to the list that just left; carrying one over would
    // open a tooltip on whatever happens to sit in that slot now.
    setOpenTip(null)
  }, [rendered])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight;
    const bottomBlur = document.getElementById('tech-stack-blur-bottom');
    const topBlur = document.getElementById('tech-stack-blur-top');
    if (bottomBlur) bottomBlur.style.opacity = scrollPercentage >= 0.95 ? '0' : '1';
    if (topBlur) topBlur.style.opacity = element.scrollTop <= 5 ? '0' : '1';
  };

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
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>

      <div className="flex-1 relative min-h-[400px] md:min-h-[600px] lg:min-h-0">
        <div
          key={rendered}
          className={`absolute inset-0 overflow-y-auto card-scroll scroll-smooth ${swapClasses(shown)}`}
          onScroll={handleScroll}
        >
          {rendered === 'skills' ? (
            <div className="grid grid-cols-2 gap-3 pb-3 pr-2">
              {technologies.map((tech, index) => (
                <div
                  key={index}
                  className="bg-surface-1 p-3 rounded-lg flex items-center border border-gray-800 hover:border-accent-500/50 transition-colors relative group"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-accent-300 text-sm">{tech.name}</span>
                      {tech.hasTooltip && (
                        <>
                          {/* The dot was an 8px mystery: what it meant lived in
                              a hover tooltip, so on a phone it meant nothing at
                              all and to a screen reader it was not there. As a
                              button it carries its own name, answers a tap, and
                              takes focus -- with a 32px hit area pulled back in
                              by a negative margin so the row does not shift. */}
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
              ))}
            </div>
          ) : (
            <div className="space-y-2 pb-3 pr-2">
              {growth.map((g, index) => (
                <div
                  key={index}
                  className="bg-surface-1 p-3 rounded-lg border border-gray-800 hover:border-accent-500/50 transition-colors"
                >
                  <span className="text-accent-300 text-sm">{g.area}</span>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{g.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div id="tech-stack-blur-top" className="absolute top-0 left-0 right-2 h-12 bg-gradient-to-b from-surface-1 to-transparent pointer-events-none transition-opacity duration-500 opacity-0" />
        <div id="tech-stack-blur-bottom" className="absolute bottom-0 left-0 right-2 h-12 bg-gradient-to-t from-surface-1 to-transparent pointer-events-none transition-opacity duration-500" />
      </div>
    </div>
  )
}

export default TechStack
