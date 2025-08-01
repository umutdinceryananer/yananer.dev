const TechStack = () => {
  const technologies = [
    { name: "Python", description: "Core Language", hasHeart: true },
    { name: "Machine Learning", description: "AI", hasHeart: true },
    { name: "Data Science", description: "Data", hasHeart: true },
    { name: "Data Visualization", description: "Data", hasHeart: true },
    { name: "Java", description: "OOP"},
    { name: "Javascript", description: "Web Dev" },
    { name: "AWS", description: "Cloud Services", hasHeart: true },
    { name: "React", description: "UI Framework", hasTooltip: true },
    { name: "Typescript", description: "Type Safety", hasTooltip: true },
    { name: "Node.js", description: "Runtime Environment" },
    { name: "Express", description: "Web Framework" },
    { name: "Selenium", description: "Test Automation" },
    { name: "Docker", description: "Containerization" },
    { name: "Arduino", description: "Embedded Systems", hasHeart: true },
    { name: "MongoDB", description: "NoSQL Database" },
    { name: "MySQL", description: "SQL Database" },
    { name: "PostgreSQL", description: "Relational DB", hasHeart: true },
    { name: "Spring", description: "Java Framework" },
    { name: "Vite", description: "Build Tool", hasTooltip: true },
    { name: "Tailwind", description: "CSS Framework", hasTooltip: true },
    { name: "Git", description: "Version Control", hasTooltip: true },
  ];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight;
    const bottomBlur = document.getElementById('tech-stack-blur-bottom');
    const topBlur = document.getElementById('tech-stack-blur-top');
    
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
        <h3 className="text-xl font-semibold text-white mb-3 text-center font-manrope">Skills & Tech Stack</h3>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>
      <div className="flex-1 relative min-h-[400px] md:min-h-[600px] lg:min-h-0">
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
        <div id="tech-stack-blur-top" className="absolute top-0 left-0 right-2 h-12 bg-gradient-to-b from-[#141414] to-transparent pointer-events-none transition-opacity duration-500 opacity-0" />
        <div id="tech-stack-blur-bottom" className="absolute bottom-0 left-0 right-2 h-12 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none transition-opacity duration-500" />
      </div>
    </div>
  )
}

export default TechStack
