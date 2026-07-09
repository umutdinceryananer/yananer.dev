import { useState, useEffect } from 'react'
import { profile } from '../data/profile'

const MCP_URL = 'https://mcp.yananer.dev/mcp'
const SKILL_URL = `${profile.siteUrl}/SKILL.md`
const SKILL_PROMPT = `Read ${SKILL_URL} and help me summarize ${profile.name.split(' ')[0]}'s projects and code.`

const TOOLS = [
  'get_profile', 'list_projects', 'get_project', 'recommend_project',
  'assess_fit', 'explain_decision', 'run_tournament', 'contact',
]

const McpModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [copied, setCopied] = useState<'skill' | 'mcp' | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const copy = async (text: string, key: 'skill' | 'mcp') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1600)
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#141414] border border-gray-800 rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800 sticky top-0 bg-[#141414] z-10">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            <h2 className="text-white text-sm font-semibold font-manrope truncate">
              Point your AI at my work
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Two ways, depending on how much you want to set up.
          </p>

          {/* Option 1 — SKILL.md (static, zero setup) */}
          <section className="rounded-lg border border-gray-800 bg-[#0F0F0F] p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <h3 className="text-white text-sm font-semibold font-manrope">SKILL.md</h3>
              <span className="text-[10px] uppercase tracking-wide text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">No setup</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mb-2.5">
              A static file any AI can read. Paste this one line into ChatGPT, Claude, anything — no
              config, works right away.
            </p>
            <div className="flex items-center gap-2 bg-[#141414] border border-gray-800 rounded-lg p-1.5 pl-3">
              <code className="text-gray-300 text-[11px] sm:text-xs font-mono truncate flex-1">{SKILL_PROMPT}</code>
              <button
                onClick={() => copy(SKILL_PROMPT, 'skill')}
                className="shrink-0 px-3 py-1.5 rounded-md text-xs font-manrope bg-[#1f1f1f] hover:bg-[#262626] text-gray-200 border border-gray-700 transition-colors"
              >
                {copied === 'skill' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <a href={SKILL_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[11px] text-gray-500 hover:text-indigo-300 transition-colors">
              view raw SKILL.md &rarr;
            </a>
          </section>

          {/* Option 2 — MCP server (live, interactive) */}
          <section className="rounded-lg border border-indigo-500/25 bg-gradient-to-b from-indigo-500/[0.07] to-transparent p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
              <h3 className="text-white text-sm font-semibold font-manrope">MCP server</h3>
              <span className="text-[10px] uppercase tracking-wide text-indigo-300/90 bg-indigo-500/10 border border-indigo-500/25 rounded px-1.5 py-0.5">Live · interactive</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mb-2.5">
              Connect Claude or ChatGPT to a live server so it can query my work with real tools —
              grounded in project data, not guesses.
            </p>
            <div className="flex items-center gap-2 bg-[#0F0F0F] border border-gray-800 rounded-lg p-1.5 pl-3">
              <code className="text-indigo-300 text-xs sm:text-sm font-mono truncate flex-1">{MCP_URL}</code>
              <button
                onClick={() => copy(MCP_URL, 'mcp')}
                className="shrink-0 px-3 py-1.5 rounded-md text-xs font-manrope bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                {copied === 'mcp' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="mt-3">
              <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-1.5">Add it to Claude</p>
              <ol className="text-gray-400 text-xs leading-relaxed space-y-1 list-decimal list-inside marker:text-gray-600">
                <li>Settings → <span className="text-gray-300">Connectors</span> → <span className="text-gray-300">Add custom connector</span></li>
                <li>Paste the endpoint above, then <span className="text-gray-300">Connect</span></li>
              </ol>
              <p className="text-gray-500 text-[11px] mt-1.5">
                CLI: <code className="text-indigo-300/90 font-mono">claude mcp add --transport http yananer {MCP_URL}</code>
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800/70">
              <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-1.5">Tools your AI can call</p>
              <div className="flex flex-wrap gap-1.5">
                {TOOLS.map((t) => (
                  <code key={t} className="text-indigo-300/90 text-[11px] font-mono bg-indigo-500/10 border border-indigo-500/15 rounded px-1.5 py-0.5">{t}</code>
                ))}
              </div>
            </div>
          </section>

          <p className="text-gray-600 text-[11px] leading-relaxed">
            Both read-only and rate-limited. Also machine-readable at{' '}
            <a href="/llms.txt" className="text-indigo-400/80 hover:text-indigo-300">llms.txt</a> and{' '}
            <a href="/resume.json" className="text-indigo-400/80 hover:text-indigo-300">resume.json</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default McpModal
