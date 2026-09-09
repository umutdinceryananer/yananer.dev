// Reading analytics/stats.sql and running it against D1.
//
// Shared by scripts/stats.ts (terminal tables) and scripts/dashboard.ts (a
// page), so the two can never drift into showing different numbers -- there is
// one set of queries and one way of running them.
//
// It splits the file itself rather than handing it to `wrangler d1 execute
// --file`, which reported "2 commands executed successfully" for a file holding
// six clean statements and skipped the rest without saying so.

import { readFileSync } from 'fs'
import { execFileSync } from 'child_process'

const CONFIG = 'analytics/wrangler.toml'
const SQL_FILE = 'analytics/stats.sql'

export interface Block {
  /** The section header from stats.sql, e.g. "Q1. Does anyone press Work?" */
  title: string
  sql: string
}

export type Row = Record<string, unknown>

/** Splits on the file's own `-- ── title ──` headers, then strips comments so
    what reaches wrangler is only SQL. */
export function blocks(): Block[] {
  const raw = readFileSync(SQL_FILE, 'utf8')
  const out: Block[] = []
  let title = ''
  let buffer: string[] = []

  const flush = () => {
    const sql = buffer.join('\n').trim().replace(/;$/, '').trim()
    if (sql) out.push({ title, sql })
    buffer = []
  }

  for (const line of raw.split('\n')) {
    const header = line.match(/^-- ── (.+?) ─+$/)
    if (header) {
      flush()
      title = header[1]
      continue
    }
    if (line.trim().startsWith('--')) continue
    buffer.push(line)
  }
  flush()
  return out
}

/**
 * Arguments passed through to wrangler, defaulting to --remote.
 *
 * Production is the default because that is where the data anyone wants to read
 * lives; `-- --local --persist-to <dir>` reaches a development database.
 */
export function wranglerArgs(argv: string[]): string[] {
  const explicit = argv.some((a) => a === '--local' || a === '--remote')
  return [...(explicit ? [] : ['--remote']), ...argv]
}

export function query(sql: string, args: string[]): Row[] {
  // npx rather than a devDependency: the site's build never needs wrangler, and
  // installing it would add weight to every Cloudflare Pages build for the sake
  // of two commands run by hand. Pinned to a major so a future release cannot
  // change the flags underneath this.
  const raw = execFileSync(
    'npx',
    [
      '--yes',
      'wrangler@4',
      'd1',
      'execute',
      'ANALYTICS_DB',
      '--config',
      CONFIG,
      ...args,
      '--json',
      '--command',
      sql,
    ],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  )
  // wrangler prints a banner before the JSON on some paths; take from the first
  // bracket rather than assuming the whole of stdout parses.
  const start = raw.indexOf('[')
  if (start < 0) throw new Error(`no JSON in wrangler output: ${raw.slice(0, 200)}`)
  const parsed = JSON.parse(raw.slice(start)) as { results?: Row[] }[]
  return parsed.flatMap((r) => r.results ?? [])
}

export interface Section extends Block {
  rows: Row[]
  error?: string
}

/** Runs every block. A failing query is recorded rather than thrown, so one bad
    query cannot hide the rest -- but the caller is expected to surface it. */
export function runAll(args: string[]): Section[] {
  return blocks().map((b) => {
    try {
      return { ...b, rows: query(b.sql, args) }
    } catch (err) {
      return { ...b, rows: [], error: err instanceof Error ? err.message.split('\n')[0] : String(err) }
    }
  })
}

/** Pulls one section out by its Q-number prefix. */
export const section = (all: Section[], prefix: string): Section | undefined =>
  all.find((s) => s.title.startsWith(prefix))

export const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0)
