import ThemeToggle from './ThemeToggle'

export type Route = 'about' | 'work'

const TABS: { id: Route; href: string; label: string }[] = [
  { id: 'about', href: '#about', label: 'About Me' },
  { id: 'work', href: '#work', label: 'Work' },
]

const TopNav = ({ route }: { route: Route }) => {
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === route))

  return (
    // Three columns with equal 1fr shoulders, so the pill stays dead centre on
    // the page while the toggle sits beside it. A plain flex row would have
    // shifted the pill left by half the button.
    <nav
      aria-label="Views"
      className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 pt-8 pb-6"
    >
      <div aria-hidden />
      <div className="relative inline-grid grid-cols-2 bg-surface-1 border border-gray-800 rounded-full p-1">
        {/* A single highlight that slides, instead of two backgrounds swapping.
            The grid keeps both columns exactly equal, so translating by whole
            multiples of the pill's own width always lands it on a tab — no
            measuring, and nothing to re-sync when the font loads. */}
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-accent-500 will-change-transform transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {TABS.map((t) => (
          <a
            key={t.id}
            href={t.href}
            // The sliding pill says which tab is live to anyone who can see it.
            // aria-current is the same sentence for anyone who cannot.
            aria-current={route === t.id ? 'page' : undefined}
            className={`relative z-10 inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium leading-none transition-colors duration-300 ${
              route === t.id ? 'text-accent-fg' : 'text-gray-400 hover:text-ink'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>
      <div className="justify-self-start">
        <ThemeToggle />
      </div>
    </nav>
  )
}

export default TopNav
