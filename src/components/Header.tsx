import { useNavigate, useLocation } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-4">
      <a 
        onClick={(e) => { e.preventDefault(); navigate('/'); }}
        href="/"
        className={`px-6 py-2 rounded-lg transition-all font-manrope ${
          isActive('/') 
            ? 'bg-[#141414] text-white hover:bg-[#1a1a1a] border ring-1 border-indigo-500/10' 
            : 'text-white ring-1 ring-indigo-500/50'
        }`}
      >
        Home
      </a>
      <a 
        onClick={(e) => { e.preventDefault(); navigate('/blog'); }}
        href="/blog"
        className={`px-6 py-2 rounded-lg transition-all font-manrope ${
          isActive('/blog') 
            ? 'bg-[#141414] text-white hover:bg-[#1a1a1a] border ring-1 border-indigo-500/10' 
            : 'text-white ring-1 ring-indigo-500/50'
        }`}
      >
        Blog
      </a>
    </div>
  )
}

export default Header 