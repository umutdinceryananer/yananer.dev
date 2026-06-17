import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { decisions, type Decision } from '../data/decisions'
import { bestMatch } from '../lib/fuzzy'

const MATURITY: Record<NonNullable<Decision['maturity']>, string> = {
  implemented: 'implemented and running in the private system',
  partial: 'partially built / in development — not validated or not delivered yet',
  design: 'designed, NOT yet built — no results from it exist yet',
}

function shape(d: Decision) {
  const caveat =
    d.source === 'sterilized-adr'
      ? "Source: the author's ADR for a PRIVATE project (Hisar) — self-reported, NOT independently verifiable (no public code to check). Keep separate from the verifiable public repos."
      : 'Source: analysis of public code — verify the WHAT against the evidence files.'
  return {
    id: d.id,
    title: d.title,
    repo: d.repo,
    decision: d.decision,
    rationale: d.rationale,
    tradeoffs: d.tradeoffs,
    ...(d.alternatives?.length ? { alternatives: d.alternatives } : {}),
    evidence: d.evidence,
    source: d.source,
    ...(d.maturity ? { maturity: MATURITY[d.maturity] } : {}),
    caveat,
  }
}

export function registerExplainDecision(server: McpServer) {
  server.registerTool(
    'explain_decision',
    {
      title: 'Explain a design decision',
      description:
        'Explain why something was built a certain way, with the decision, rationale, tradeoffs, and alternatives considered. Covers public repos (evidence = real files) and sterilized Hisar ADRs (private, self-reported). Pass a topic or question, e.g. "why APScheduler in FX-Risk-Engine", "reproducible tournaments", "Hisar gatekeeper before the LLM", "why defer GraphRAG".',
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
