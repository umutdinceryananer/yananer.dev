export type Route = 'about' | 'work'

const TopNav = ({ route }: { route: Route }) => {
  const tab = (active: boolean) =>
    `px-5 py-1.5 rounded-full text-sm font-manrope transition-colors ${
      active ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-400 hover:text-white'
    }`

  return (
    <nav className="w-full flex justify-center pt-8 pb-6">
      <div className="inline-flex items-center gap-1 bg-[#141414] border border-gray-800 rounded-full p-1">
        <a href="#about" className={tab(route === 'about')}>About Me</a>
        <a href="#work" className={tab(route === 'work')}>Work</a>
      </div>
    </nav>
  )
}

export default TopNav
