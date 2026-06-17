import { useState, useEffect } from 'react'
import { profile } from '../../data/profile'

const TechStack = () => {
  const technologies = profile.tech
  const growth = profile.growth
  const [view, setView] = useState<'skills' | 'growth'>('skills')

  // Reset the scroll-fade overlays whenever the view switches (each view starts
  // scrolled to the top): top hidden, bottom shown.
  useEffect(() => {
    const top = document.getElementById('tech-stack-blur-top')
    const bottom = document.getElementById('tech-stack-blur-bottom')
    if (top) top.style.opacity = '0'
    if (bottom) bottom.style.opacity = '1'
  }, [view])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight;
    const bottomBlur = document.getElementById('tech-stack-blur-bottom');
    const topBlur = document.getElementById('tech-stack-blur-top');
    if (bottomBlur) bottomBlur.style.opacity = scrollPercentage >= 0.95 ? '0' : '1';
    if (topBlur) topBlur.style.opacity = element.scrollTop <= 5 ? '0' : '1';
  };

  const seg = (active: boolean) =>
    `px-4 py-1 rounded-full text-sm font-manrope transition-colors ${
      active ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
    }`

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1 bg-[#1a1a1a] border border-gray-800 rounded-full p-0.5">
            <button onClick={() => setView('skills')} className={seg(view === 'skills')}>Skills</button>
            <button onClick={() => setView('growth')} className={seg(view === 'growth')}>Not Yet</button>
          </div>
        </div>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>

      <div className="flex-1 relative min-h-[400px] md:min-h-[600px] lg:min-h-0">
        {view === 'skills' ? (
          <div className="absolute inset-0 overflow-y-auto no-scrollbar scroll-smooth" onScroll={handleScroll}>
            <div className="grid grid-cols-2 gap-3 pb-3 pr-2">
              {technologies.map((tech, index) => (
                <div
                  key={index}
                  className="bg-[#141414] p-3 rounded-lg flex items-center border border-gray-800 hover:border-indigo-500/50 transition-colors relative group"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-300 text-sm">{tech.name}</span>
                      {tech.hasTooltip && (
                        <>
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-xs text-gray-300 px-3 py-2 rounded-lg border border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
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
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto no-scrollbar scroll-smooth" onScroll={handleScroll}>
            <div className="space-y-2 pb-3 pr-2">
              {growth.map((g, index) => (
                <div
                  key={index}
                  className="bg-[#141414] p-3 rounded-lg border border-gray-800 hover:border-indigo-500/50 transition-colors"
                >
                  <span className="text-indigo-300 text-sm">{g.area}</span>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{g.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div id="tech-stack-blur-top" className="absolute top-0 left-0 right-2 h-12 bg-gradient-to-b from-[#141414] to-transparent pointer-events-none transition-opacity duration-500 opacity-0" />
        <div id="tech-stack-blur-bottom" className="absolute bottom-0 left-0 right-2 h-12 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none transition-opacity duration-500" />
      </div>
    </div>
  )
}

export default TechStack
