const WorkExperience = () => {

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight;
    const bottomBlur = document.getElementById('work-exp-blur-bottom');
    const topBlur = document.getElementById('work-exp-blur-top');
    
    if (bottomBlur) {
      if (scrollPercentage >= 0.95) {
        bottomBlur.style.opacity = '0';
      } else {
        bottomBlur.style.opacity = '1';
      }
    }

    if (topBlur) {
      if (element.scrollTop <= 5) {
        topBlur.style.opacity = '0';
      } else {
        topBlur.style.opacity = '1';
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-3 text-center font-manrope">Work Experience</h3>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>
      <div className="flex-1 relative min-h-[400px] md:min-h-[600px] lg:min-h-0">
        <div className="absolute inset-0 overflow-y-auto no-scrollbar scroll-smooth" onScroll={handleScroll}>
          <div className="space-y-8 relative pl-6 pr-2 pb-3">
            {/* Vertical Progress Line */}
            <div className="absolute left-[15px] top-6 bottom-30 w-[2px] bg-gradient-to-b from-transparent via-gray-800 to-transparent">
              <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-b from-indigo-500/80 via-indigo-500/50 to-indigo-500/80" />
            </div>

            {/* Experience Items */}
            <div className="relative p-4 rounded-lg transition-colors group">
              {/* Progress Dot */}
              <div className="absolute -left-[18px] top-5 w-5 h-5 rounded-full bg-[#141414] ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0F0F0F] group-hover:ring-offset-[#141414] transition-all flex items-center justify-center">
                <span className="text-xs text-gray-400 font-medium">5</span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-indigo-400 font-medium">Business Analyst Intern</h4>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  Meteksan Defence
                </span>
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  Aug 2024 - Sep 2024
                </span>
              </div>

              <p className="text-gray-400 text-sm">
                Managed an IT asset auditing project, implementing an 
                SAP-based tracking system for 1,600 assets, 
                improving allocation accuracy and achieving a 95% tracking precision.
              </p>
            </div>

            <div className="relative p-4 rounded-lg transition-colors group">
              {/* Progress Dot */}
              <div className="absolute -left-[18px] top-5 w-5 h-5 rounded-full bg-[#141414] ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0F0F0F] group-hover:ring-offset-[#141414] transition-all flex items-center justify-center">
                <span className="text-xs text-gray-400 font-medium">4</span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-indigo-400 font-medium">Software Designer Intern</h4>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  Orion Innovation
                </span>
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  Sep 2023 - Jan 2024
                </span>
              </div>

              <p className="text-gray-400 text-sm">
                Developed a WebRTC module frontend with React and TypeScript, 
                ensured code reliability through problem-solving, and used Figma 
                for design and prototyping to align with the technical manager.
              </p>
            </div>

            <div className="relative p-4 rounded-lg transition-colors group">
              {/* Progress Dot */}
              <div className="absolute -left-[18px] top-5 w-5 h-5 rounded-full bg-[#141414] ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0F0F0F] group-hover:ring-offset-[#141414] transition-all flex items-center justify-center">
                <span className="text-xs text-gray-400 font-medium">3</span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-indigo-400 font-medium">Software Development Intern</h4>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  TUV Austria
                </span>
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  Aug 2023 - Oct 2023
                </span>
              </div>

              <p className="text-gray-400 text-sm">
                Improved PwnDoc Pentest Report Generator by developing frontend 
                and backend features, enhancing reliability and performance through 
                QA testing with Selenium.
              </p>
            </div>

            <div className="relative p-4 rounded-lg transition-colors group">
              {/* Progress Dot */}
              <div className="absolute -left-[18px] top-5 w-5 h-5 rounded-full bg-[#141414] ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0F0F0F] group-hover:ring-offset-[#141414] transition-all flex items-center justify-center">
                <span className="text-xs text-gray-400 font-medium">2</span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-indigo-400 font-medium">UI Developer Intern</h4>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  Jotform
                </span>
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  Jun 2022 - Aug 2022
                </span>
              </div>

              <p className="text-gray-400 text-sm">
                Led the design implementation of the URL Redirection Tool with a 12-member team, 
                preventing URL mismatches, enhancing UX, and ensuring future development through 
                detailed documentation.
              </p>
            </div>

            <div className="relative p-4 rounded-lg transition-colors group">
              {/* Progress Dot */}
              <div className="absolute -left-[18px] top-5 w-5 h-5 rounded-full bg-[#141414] ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0F0F0F] group-hover:ring-offset-[#141414] transition-all flex items-center justify-center">
                <span className="text-xs text-gray-400 font-medium">1</span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-indigo-400 font-medium">Founding Developer</h4>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  Petbilir
                </span>
                <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
                  Feb 2021 - Aug 2023
                </span>
              </div>

              <p className="text-gray-400 text-sm">
                Led a 6-person team in strategic decision-making, collaboration, 
                and execution, adopting React, Node.js, Express, and TailwindCSS, 
                while securing two awards and exclusive investment opportunities.
              </p>
            </div>
          </div>
        </div>
        <div id="work-exp-blur-top" className="absolute top-0 left-0 right-2 h-12 bg-gradient-to-b from-[#141414] to-transparent pointer-events-none transition-opacity duration-500 opacity-0" />
        <div id="work-exp-blur-bottom" className="absolute bottom-0 left-0 right-2 h-12 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none transition-opacity duration-500" />
      </div>
    </div>
  )
}

export default WorkExperience
