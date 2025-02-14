import { useNavigate } from 'react-router-dom'
import resumePDF from '../../assets/portfolio_resume_february_2025.pdf'

const BlogCTA = () => {
  const navigate = useNavigate()

  return (
    <div className="h-full flex items-center gap-4">
      {/* CV Button */}
      <a 
        href={resumePDF}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex-1 h-full rounded-lg p-4 bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-all hover:scale-[1.02] border border-gray-800 hover:border-indigo-500/50 overflow-hidden"
      >
        <div className="relative flex flex-col items-start justify-center h-full">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white font-manrope">View CV</h3>
        </div>
      </a>

      {/* Blog Button */}
      <a 
        onClick={(e) => { e.preventDefault(); navigate('/blog'); }}
        href="/blog"
        className="group relative flex-1 h-full rounded-lg p-4 bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-all hover:scale-[1.02] border border-gray-800 hover:border-indigo-500/50 overflow-hidden"
      >
        <div className="relative flex flex-col items-start justify-center h-full">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white font-manrope">Visit Blog</h3>
        </div>
      </a>
    </div>
  )
}

export default BlogCTA
