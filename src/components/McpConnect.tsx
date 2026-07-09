import { useState, useEffect } from 'react'

const MCP_URL = 'https://mcp.yananer.dev/mcp'

const TOOLS: { name: string; blurb: string }[] = [
  { name: 'get_profile', blurb: 'Who I am — bio, focus, experience, honest gaps' },
  { name: 'list_projects', blurb: 'Public repos, OSS contributions, private work' },
  { name: 'get_project', blurb: 'One repo in detail + the key files to read first' },
  { name: 'recommend_project', blurb: 'Best-matching projects for an interest area' },
  { name: 'assess_fit', blurb: 'Map my work to a role / JD, with honest gaps' },
  { name: 'explain_decision', blurb: 'A grounded architecture decision + tradeoffs' },
  { name: 'run_tournament', blurb: 'Actually runs an Iterated Prisoner’s Dilemma tournament' },
  { name: 'contact', blurb: 'How to reach me — email + socials' },
]

const McpConnect = () => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-manrope
                   bg-indigo-500/10 border border-indigo-500/25 text-indigo-300
                   hover:bg-indigo-500/15 hover:border-indigo-400/40 transition-colors"
        aria-label="Connect your AI to this site via MCP"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Connect your AI
        <span className="text-indigo-400/70 group-hover:text-indigo-300">· MCP</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#141414] border border-gray-800 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800 sticky top-0 bg-[#141414]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <h2 className="text-white text-sm font-semibold font-manrope truncate">
                  Query this portfolio with your AI
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-white transition-colors text-lg leading-none shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                This site runs a live <span className="text-indigo-300">MCP server</span> (Model Context
                Protocol). Connect Claude or ChatGPT to it and your AI can answer questions about my
                work — grounded in real project data, not guesses.
              </p>

              {/* Endpoint + copy */}
              <div>
                <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-1.5">Server endpoint</p>
                <div className="flex items-center gap-2 bg-[#0F0F0F] border border-gray-800 rounded-lg p-1.5 pl-3">
                  <code className="text-indigo-300 text-xs sm:text-sm font-mono truncate flex-1">{MCP_URL}</code>
                  <button
                    onClick={copy}
                    className="shrink-0 px-3 py-1.5 rounded-md text-xs font-manrope bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* How to connect */}
              <div>
                <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-2">Add it to Claude</p>
                <ol className="text-gray-400 text-xs sm:text-sm leading-relaxed space-y-1 list-decimal list-inside marker:text-gray-600">
                  <li>Settings → <span className="text-gray-300">Connectors</span> → <span className="text-gray-300">Add custom connector</span></li>
                  <li>Paste the endpoint above, then <span className="text-gray-300">Connect</span></li>
                </ol>
                <p className="text-gray-500 text-[11px] mt-2">
                  Claude Code (CLI):{' '}
                  <code className="text-indigo-300/90 font-mono">claude mcp add --transport http yananer {MCP_URL}</code>
                </p>
              </div>

              {/* Tools */}
              <div>
                <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-2">What your AI can call</p>
                <div className="divide-y divide-gray-800/60">
                  {TOOLS.map((t) => (
                    <div key={t.name} className="flex items-baseline gap-2 py-1.5">
                      <code className="text-indigo-300 text-xs font-mono shrink-0">{t.name}</code>
                      <span className="text-gray-500 text-[11px] sm:text-xs leading-snug">{t.blurb}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-gray-600 text-[11px] leading-relaxed">
                Read-only and rate-limited. Also machine-readable at{' '}
                <a href="/llms.txt" className="text-indigo-400/80 hover:text-indigo-300">llms.txt</a>,{' '}
                <a href="/SKILL.md" className="text-indigo-400/80 hover:text-indigo-300">SKILL.md</a>, and{' '}
                <a href="/resume.json" className="text-indigo-400/80 hover:text-indigo-300">resume.json</a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default McpConnect
