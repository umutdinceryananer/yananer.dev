const Education = () => {

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-3 text-center font-manrope">Education</h3>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>
      
      <div className="flex-1 bg-[#1a1a1a] rounded-lg p-4 relative overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all">
        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Soft gradient waves */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl transform translate-x-1/2 translate-y-1/2" />
        </div>
        
        {/* Content */}
        <div className="relative space-y-1">
          {/* University Name with Badge */}
          <div className="flex items-center gap-2 mb-0">
            <h4 className="text-base font-medium text-indigo-400">Ihsan Dogramaci Bilkent University</h4>
            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] rounded-full border border-indigo-500/20">
              BSc
            </span>
          </div>

          {/* Department */}
          <p className="text-gray-300 text-sm">
            Information Systems and Technologies
          </p>

          {/* Timeline */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Started:</span>
              <span className="text-indigo-400 font-medium">2020</span>
            </div>
            <span className="text-gray-600">•</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Graduation:</span>
              <span className="text-indigo-400 font-medium">25 June 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Education
