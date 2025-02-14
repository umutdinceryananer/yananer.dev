import { useNavigate, useLocation } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-4">
      <button 
        onClick={() => navigate('/')}
        className={`px-6 py-2 rounded-lg transition-all font-manrope ${
          isActive('/') 
            ? 'bg-indigo-500 hover:bg-indigo-500 text-white ring-2 ring-indigo-500/50' 
            : 'bg-[#141414] text-white hover:bg-[#1a1a1a] border border-indigo-500/30'
        }`}
      >
        Home
      </button>
      <button 
        onClick={() => navigate('/blog')}
        className={`px-6 py-2 rounded-lg transition-all font-manrope ${
          isActive('/blog') 
            ? 'bg-indigo-500 hover:bg-indigo-500 text-white ring-2 ring-indigo-500/50' 
            : 'bg-[#141414] text-white hover:bg-[#1a1a1a] border border-indigo-500/30'
        }`}
      >
        Blog
      </button>
    </div>
  )
}

export default Header 