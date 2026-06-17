import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { decisions, type Decision } from '../data/decisions'
import { bestMatch } from '../lib/fuzzy'

function shape(d: Decision) {
  const caveat =
    d.source === 'sterilized-adr'
      ? "Source: the author's ADR for a PRIVATE project — self-reported, NOT independently verifiable (no public code to check)."
      : 'Source: analysis of public code — verify the WHAT against the evidence files.'
  return {
    id: d.id,
    title: d.title,
    repo: d.repo,
    decision: d.decision,
    rationale: d.rationale,
    tradeoffs: d.tradeoffs,
    evidence: d.evidence,
    source: d.source,
    caveat,
  }
}

export function registerExplainDecision(server: McpServer) {
  server.registerTool(
    'explain_decision',
    {
      title: 'Explain a design decision',
      description:
        'Explain why something was built a certain way, grounded in evidence files. Pass a topic or question, e.g. "why APScheduler in FX-Risk-Engine", "reproducible tournaments", "synthetic data".',
      inputSchema: {
        topic: z.string().describe('A topic or question about an architecture decision.'),
      },
    },
    async ({ topic }) => {
      const match = bestMatch(topic, decisions, (d) => [d.title, d.repo, ...d.topics])
      if (!match) {
        return {
          content: [
            {
              type: 'text',
              text:
                `No confident match for "${topic}". Available decisions:\n- ` +
                decisions.map((d) => `${d.title}  [${d.repo}]`).join('\n- '),
            },
          ],
          isError: true,
        }
      }
      const out = shape(match)
      return {
        content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
        structuredContent: out,
      }
    },
  )
}
