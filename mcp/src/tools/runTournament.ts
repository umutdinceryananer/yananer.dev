import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Tournament, type TournamentFormat } from '../../engine/core/tournament'
import { baseStrategies } from '../../engine/strategies/index'
import { bestMatch } from '../lib/fuzzy'
import { BOUNDS } from '../lib/bounds'

const catalog = baseStrategies
const catalogNames = catalog.map((s) => s.name)

function resolveStrategy(input: string) {
  const q = input.trim().toLowerCase()
  const exact = catalog.find((s) => s.name.toLowerCase() === q)
  if (exact) return exact
  return bestMatch(input, catalog, (s) => [s.name], 0.5)
}

export function registerRunTournament(server: McpServer) {
  server.registerTool(
    'run_tournament',
    {
      title: 'Run an IPD tournament',
      description:
        `Actually run an Iterated Prisoner's Dilemma tournament (My-Game-Theory-Lab engine) and return standings. ` +
        `Strategies by name: ${catalogNames.join(', ')}.`,
      inputSchema: {
        strategies: z
          .array(z.string())
          .min(BOUNDS.minStrategies)
          .max(BOUNDS.maxStrategies)
          .describe(
            `Strategy names (${BOUNDS.minStrategies}-${BOUNDS.maxStrategies}). Options: ${catalogNames.join(', ')}.`,
          ),
        format: z
          .enum(['single-round-robin', 'double-round-robin', 'swiss'])
          .default('single-round-robin'),
        rounds: z
          .number()
          .int()
          .min(BOUNDS.roundsMin)
          .max(BOUNDS.roundsMax)
          .default(BOUNDS.roundsDefault)
          .describe('Rounds per match.'),
        errorRate: z
          .number()
          .min(BOUNDS.errorRateMin)
          .max(BOUNDS.errorRateMax)
          .default(0)
          .describe('Per-move noise probability (0-1).'),
        swissRounds: z
          .number()
          .int()
          .min(BOUNDS.swissRoundsMin)
          .max(BOUNDS.swissRoundsMax)
          .optional()
          .describe('Number of Swiss rounds (swiss format only).'),
        seed: z
          .union([z.number(), z.string()])
          .optional()
          .describe('Seed for reproducible results.'),
      },
    },
    async ({ strategies, format, rounds, errorRate, swissRounds, seed }) => {
      const resolved: typeof catalog = []
      const unknown: string[] = []
      const seen = new Set<string>()
      for (const name of strategies) {
        const s = resolveStrategy(name)
        if (!s) {
          unknown.push(name)
          continue
        }
        if (seen.has(s.name)) continue
        seen.add(s.name)
        resolved.push(s)
      }
      if (unknown.length) {
        return {
          content: [
            {
              type: 'text',
              text: `Unknown strategy name(s): ${unknown.join(', ')}.\nValid: ${catalogNames.join(', ')}`,
            },
          ],
          isError: true,
        }
      }
      if (resolved.length < BOUNDS.minStrategies) {
        return {
          content: [
            {
              type: 'text',
              text: `Need at least ${BOUNDS.minStrategies} distinct strategies after de-duplication.`,
            },
          ],
          isError: true,
        }
      }

      const fmt: TournamentFormat =
        format === 'swiss' ? { kind: 'swiss', rounds: swissRounds } : { kind: format }

      const outcome = new Tournament().runWithFormat(fmt, resolved, rounds, errorRate, undefined, seed)
      const standings = outcome.results.map((r, i) => ({
        rank: i + 1,
        name: r.name,
        totalScore: r.totalScore,
        averageScore: Number(r.averageScore.toFixed(3)),
        wins: r.wins,
        matchesPlayed: r.matchesPlayed,
        rating: r.rating ?? outcome.ratings[r.name],
      }))

      const result = {
        format: fmt.kind,
        rounds,
        errorRate,
        seed: seed ?? null,
        reproducible: seed !== undefined,
        strategies: resolved.map((s) => s.name),
        standings,
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      }
    },
  )
}
