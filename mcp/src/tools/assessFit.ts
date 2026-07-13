import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { capabilities } from '../data/capabilities'
import { profile } from '../lib/projectsView'
import { matchKeywords } from '../lib/fuzzy'

export function registerAssessFit(server: McpServer) {
  server.registerTool(
    'assess_fit',
    {
      title: 'Assess fit for a role',
      description:
        "Map Umut's verifiable work to a role (capability → evidence files) and surface honest gaps. " +
        'Pass a role title / pasted job description (`role`), and/or an explicit list of skills the ' +
        'recruiter cares about (`keywords`) — each keyword is checked individually and reported as ' +
        'covered (with evidence), a known gap, or not found. Self-hosted: a guided pointer to evidence, ' +
        'NOT a neutral evaluation.',
      inputSchema: {
        role: z.string().optional().describe('A role title or pasted job description.'),
        keywords: z
          .array(z.string())
          .optional()
          .describe('Specific skills/keywords the recruiter cares about; each is assessed individually.'),
      },
    },
    async ({ role, keywords }) => {
      const caveat =
        'Self-hosted, so not a neutral evaluation. Verify each capability against the cited evidence files; private items (e.g. Hisar) are not independently verifiable.'

      const hasRole = typeof role === 'string' && role.trim().length > 0
      const kws = (keywords ?? []).map((k) => k.trim()).filter(Boolean)

      if (!hasRole && !kws.length) {
        const out = {
          note: 'Provide a role/JD (`role`) and/or a list of skills (`keywords`) to assess fit.',
          caveat,
        }
        return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out }
      }

      // Combined haystack (role text + keywords) drives the capability roll-up.
      const haystack = [hasRole ? role! : '', ...kws].join(' . ')

      const matched = capabilities
        .map((c) => ({ c, on: matchKeywords(haystack, c.keywords) }))
        .filter((x) => x.on.length > 0)
        .sort((a, b) => b.on.length - a.on.length)
        .map((x) => ({ capability: x.c.label, matchedOn: x.on, evidence: x.c.evidence }))

      // Per-keyword breakdown: covered (evidence) / gap (honest note) / not found.
      const keywordBreakdown = kws.length
        ? kws.map((kw) => {
            const covered = capabilities.filter((c) => matchKeywords(kw, c.keywords).length > 0)
            if (covered.length) {
              return {
                keyword: kw,
                status: 'covered' as const,
                capabilities: covered.map((c) => c.label),
                evidence: [...new Set(covered.flatMap((c) => c.evidence))],
              }
            }
            const gap = profile.growth.find((g) => matchKeywords(g.area, [kw]).length > 0)
            if (gap) return { keyword: kw, status: 'gap' as const, area: gap.area, note: gap.note }
            return {
              keyword: kw,
              status: 'not_found' as const,
              note: 'No verifiable evidence, and not listed among the known gaps.',
            }
          })
        : undefined

      const honestGaps = profile.growth.map((g) => ({
        area: g.area,
        note: g.note,
        relevant: matchKeywords(haystack, [g.area]).length > 0,
      }))

      // Fallback only when nothing matched at all (no capability roll-up AND no covered keyword).
      const anyCovered = keywordBreakdown?.some((k) => k.status === 'covered') ?? false
      const noMatchFallback =
        !matched.length && !anyCovered
          ? {
              note: 'No direct keyword matches. Here is the full capability map for manual mapping.',
              allCapabilities: capabilities.map((c) => ({ capability: c.label, evidence: c.evidence })),
            }
          : {}

      const out = {
        input: { ...(hasRole ? { role } : {}), ...(kws.length ? { keywords: kws } : {}) },
        matchedCapabilities: matched,
        ...(keywordBreakdown ? { keywordBreakdown } : {}),
        ...noMatchFallback,
        honestGaps,
        caveat,
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
        structuredContent: out,
      }
    },
  )
}
