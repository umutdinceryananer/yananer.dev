// Running the shared queries against D1 from a terminal.
//
// The queries themselves live in analytics/src/queries.ts, imported rather than
// parsed out of a .sql file, so the dashboard Worker and this script cannot end
// up asking different questions. `wrangler d1 execute --file` is not usable for
// the file form anyway: given six statements it reported "2 commands executed
// successfully" and skipped the rest without a word.

import { execFileSync } from 'child_process'
import { QUERIES, type Row, type Section } from '../analytics/src/queries'

const CONFIG = 'analytics/wrangler.toml'

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
    ['--yes', 'wrangler@4', 'd1', 'execute', 'ANALYTICS_DB', '--config', CONFIG, ...args, '--json', '--command', sql],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  )
  // wrangler prints a banner before the JSON on some paths; take from the first
  // bracket rather than assuming the whole of stdout parses.
  const start = raw.indexOf('[')
  if (start < 0) throw new Error(`no JSON in wrangler output: ${raw.slice(0, 200)}`)
  return (JSON.parse(raw.slice(start)) as { results?: Row[] }[]).flatMap((r) => r.results ?? [])
}

/** Runs every query. A failure is recorded rather than thrown, so one bad query
    cannot hide the rest -- the caller surfaces it. */
export function runAll(args: string[]): Section[] {
  return QUERIES.map((q) => {
    try {
      return { ...q, rows: query(q.sql, args) }
    } catch (err) {
      return { ...q, rows: [], error: err instanceof Error ? err.message.split('\n')[0] : String(err) }
    }
  })
}
