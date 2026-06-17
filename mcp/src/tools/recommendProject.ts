import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { publicRepos } from '../lib/projectsView'
import { relevanceTokens } from '../lib/fuzzy'

export function registerRecommendProject(server: McpServer) {
  server.registerTool(
    'recommend_project',
    {
      title: 'Recommend a project',
      description:
        'Given an interest or focus area (e.g. "LLM agents", "backend", "data/ML", "game theory"), suggest the best-matching public projects with why + the files to read first.',
      inputSchema: {
        interest: z.string().describe('An interest, technology, or focus area.'),
      },
    },
    async ({ interest }) => {
      const scored = publicRepos
        .map((p) => {
          const text = [p.name, p.signal, ...(p.tech ?? []), p.oneLiner].join(' ')
          const hits = relevanceTokens(interest, text)
          return { p, hits, score: hits.length }
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)

      const chosen = scored.length
        ? scored
        : publicRepos.map((p) => ({ p, hits: [] as string[], score: 0 }))

      const recommendations = chosen.slice(0, 4).map(({ p, hits }) => ({
        name: p.name,
        signal: p.signal,
        why: hits.length ? `matches: ${hits.join(', ')}` : 'general recommendation',
        repoUrl: p.repoUrl,
        liveDemoUrl: p.liveDemoUrl,
        readFirst: (p.keyEntryPoints ?? []).slice(0, 4),
      }))

      const out = { interest, matched: scored.length > 0, recommendations }
      return {
        content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
        structuredContent: out,
      }
    },
  )
}
