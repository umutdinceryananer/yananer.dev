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
        "Given a role title or pasted job description, map Umut's verifiable work to it (capability → evidence files) and surface honest gaps. This is self-hosted: a guided pointer to evidence, NOT a neutral evaluation.",
      inputSchema: {
        role: z.string().describe('A role title or pasted job description.'),
      },
    },
    async ({ role }) => {
      const matched = capabilities
        .map((c) => ({ c, on: matchKeywords(role, c.keywords) }))
        .filter((x) => x.on.length > 0)
        .sort((a, b) => b.on.length - a.on.length)
        .map((x) => ({ capability: x.c.label, matchedOn: x.on, evidence: x.c.evidence }))

      const gaps = profile.growth.map((g) => ({
        area: g.area,
        note: g.note,
        relevant: matchKeywords(role, [g.area]).length > 0,
      }))

      const caveat =
        'Self-hosted, so not a neutral evaluation. Verify each capability against the cited evidence files; private items (e.g. Themis) are not independently verifiable.'

      const out = matched.length
        ? { input: role, matchedCapabilities: matched, honestGaps: gaps, caveat }
        : {
            input: role,
            note: 'No direct keyword matches — here is the full capability map for manual mapping.',
            allCapabilities: capabilities.map((c) => ({ capability: c.label, evidence: c.evidence })),
            honestGaps: gaps,
            caveat,
          }

      return {
        content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
        structuredContent: out,
      }
    },
  )
}
