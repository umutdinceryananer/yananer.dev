import { useState, useEffect } from 'react'
import { projects, type Project } from '../data/projects'
import { hisarDecisions, type Decision } from '../data/decisions'
import { profile } from '../data/profile'

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-1 bg-[#1a1a1a] rounded-md text-gray-400 text-xs border border-gray-800">
    {children}
  </span>
)

const Badge = ({ children, className }: { children: React.ReactNode; className: string }) => (
  <span className={`px-1.5 py-0.5 rounded-full text-[10px] border whitespace-nowrap ${className}`}>
    {children}
  </span>
)

const nowBadgeClass: Record<string, string> = {
  'In Development': 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  'Pre-launch': 'bg-green-500/10 text-green-300 border-green-500/20',
  Learning: 'bg-gray-500/10 text-gray-400 border-gray-500/25',
}

// Honest build-state of a private (Hisar) decision. Indigo = built, amber = in
// development, gray = designed-but-unbuilt. Never green — this work is unverifiable.
const maturityBadge: Record<NonNullable<Decision['maturity']>, { label: string; cls: string }> = {
  implemented: { label: 'Built', cls: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  partial: { label: 'In progress', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  design: { label: 'Designed', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/25' },
}

const GitHubIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.239 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

const ExternalIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
)

const PlayIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
)

// Full-screen demo overlay. The iframe is only mounted while open, so the
// embedded app is loaded lazily (on click), never on page load.
const DemoModal = ({ demo, onClose }: { demo: { url: string; title: string } | null; onClose: () => void }) => {
  useEffect(() => {
    if (!demo) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [demo, onClose])

  if (!demo) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-[85vh] bg-[#141414] rounded-xl border border-gray-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-800 shrink-0">
          <span className="text-white text-sm font-medium font-manrope truncate">{demo.title}</span>
          <div className="flex items-center gap-4 shrink-0">
            <a href={demo.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-xs">
              Open in new tab ↗
            </a>
            <button onClick={onClose} aria-label="Close demo" className="text-gray-400 hover:text-white transition-colors text-lg leading-none">
              ✕
            </button>
          </div>
        </div>
        <iframe src={demo.url} title={demo.title} className="flex-1 w-full bg-[#0F0F0F]" />
      </div>
    </div>
  )
}

const ProjectCard = ({ p, onPlay }: { p: Project; onPlay?: (p: Project) => void }) => (
  <div className="h-full flex flex-col bg-[#1a1a1a] rounded-lg p-4 relative overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all">
    {/* Decorative Elements (match Education) */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl transform translate-x-1/2 translate-y-1/2" />
    </div>

    {/* Content */}
    <div className="relative flex flex-col gap-1.5 h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="text-base font-medium text-indigo-400 leading-tight">{p.name}</h4>
        {p.isPrivate && <Badge className="bg-red-500/10 text-red-300 border-red-500/20">Private</Badge>}
        {!p.isVerifiable && <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/25">Unverifiable</Badge>}
        {p.syntheticData && <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/25">Synthetic</Badge>}
      </div>

      <p className="text-gray-300 text-sm">{p.signal}</p>

      {p.tech && (
        <div className="flex flex-wrap gap-1">
          {p.tech.slice(0, 4).map((t) => <Tag key={t}>{t}</Tag>)}
        </div>
      )}

      {(p.repoUrl || p.liveDemoUrl) && (
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {p.repoUrl && (
            <a
              href={p.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#141414] text-gray-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/50 hover:bg-[#1f1f1f] transition-colors"
            >
              <GitHubIcon /> Repo
            </a>
          )}
          {p.embedDemo && p.liveDemoUrl ? (
            <button
              onClick={() => onPlay?.(p)}
              className="play-gradient group inline-flex rounded-lg p-[1px]"
            >
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-[#141414] text-gray-200 group-hover:bg-[#1f1f1f] group-hover:text-white text-xs font-medium transition-colors">
                <PlayIcon /> Enter Lab
              </span>
            </button>
          ) : p.liveDemoUrl ? (
            <a
              href={p.liveDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/50 hover:bg-indigo-500/20 transition-colors"
            >
              <ExternalIcon /> Live
            </a>
          ) : null}
        </div>
      )}
    </div>
  </div>
)

const FieldList = ({ label, items }: { label: string; items: string[] }) => (
  <div>
    <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">{label}</p>
    <ul className="list-disc list-inside space-y-0.5 text-gray-400 text-sm leading-relaxed marker:text-gray-600">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  </div>
)

// One collapsible ADR row. Collapsed = title + maturity badge; expanded = the
// reasoning. Visually distinct from project cards (a log, not a grid).
const DecisionRow = ({ d }: { d: Decision }) => {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 py-3 text-left group"
      >
        <svg
          className={`w-3.5 h-3.5 shrink-0 text-gray-500 group-hover:text-indigo-400 transition-all duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="flex-1 min-w-0 text-sm text-gray-200 group-hover:text-white transition-colors">
          {d.title}
        </span>
        {d.maturity && (
          <Badge className={maturityBadge[d.maturity].cls}>{maturityBadge[d.maturity].label}</Badge>
        )}
      </button>
      {open && (
        <div className="pl-6 pb-4 pr-1 flex flex-col gap-3">
          <p className="text-gray-300 text-sm leading-relaxed">{d.summary}</p>
          <div>
            <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Why</p>
            <p className="text-gray-400 text-sm leading-relaxed">{d.rationale}</p>
          </div>
          <FieldList label="Tradeoffs" items={d.tradeoffs} />
          {d.alternatives && d.alternatives.length > 0 && (
            <FieldList label="Alternatives considered" items={d.alternatives} />
          )}
        </div>
      )}
    </div>
  )
}

const Projects = () => {
  const repos = projects.filter((p) => p.kind === 'repo')
  const featuredDecisions = hisarDecisions.filter((d) => d.featured)
  const otherDecisions = hisarDecisions.filter((d) => !d.featured)
  const [demo, setDemo] = useState<{ url: string; title: string } | null>(null)

  return (
    <div className="pt-2">
      {profile.now.length > 0 && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-3 text-center font-manrope flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Now
            </h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {profile.now.map((n, i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 group hover:ring-2 hover:ring-indigo-500/20 transition-all"
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl transform translate-x-1/2 translate-y-1/2" />
                </div>
                <div className="relative flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-medium text-indigo-400 leading-tight">{n.title}</h4>
                    {n.badge && (
                      <Badge className={nowBadgeClass[n.badge] ?? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}>
                        {n.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm">{n.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-3 text-center font-manrope">Projects</h2>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>
      <div className="grid grid-cols-1 min-[745px]:grid-cols-2 min-[1240px]:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {repos.map((p) => (
          <ProjectCard
            key={p.name}
            p={p}
            onPlay={(proj) => proj.liveDemoUrl && setDemo({ url: proj.liveDemoUrl, title: proj.name })}
          />
        ))}
      </div>

      {featuredDecisions.length > 0 && (
        <div className="mt-10">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-3 text-center font-manrope">Design Decisions</h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
          </div>
          <p className="text-center text-gray-500 text-xs sm:text-sm max-w-2xl mx-auto mb-5 leading-relaxed">
            How I think — architecture decisions from <span className="text-gray-400">Hisar</span>, my private
            in-development project. Self-reported, with no public code to check, so they live in their own
            bucket and also drive the <span className="text-indigo-300">explain_decision</span> tool in my MCP
            server.
          </p>

          <div className="max-w-3xl mx-auto rounded-xl border border-gray-800 bg-[#141414]/40 px-4 sm:px-5">
            <div className="divide-y divide-gray-800/60">
              <div className="flex items-center gap-2 py-3 flex-wrap">
                <Badge className="bg-red-500/10 text-red-300 border-red-500/20">Private</Badge>
                <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/25">Not independently verifiable</Badge>
              </div>
              {featuredDecisions.map((d) => (
                <DecisionRow key={d.id} d={d} />
              ))}
              {otherDecisions.length > 0 && (
                <p className="text-gray-500 text-[11px] uppercase tracking-wide pt-3 pb-1">Also designed</p>
              )}
              {otherDecisions.map((d) => (
                <DecisionRow key={d.id} d={d} />
              ))}
            </div>
          </div>
        </div>
      )}

      <DemoModal demo={demo} onClose={() => setDemo(null)} />
    </div>
  )
}

export default Projects
