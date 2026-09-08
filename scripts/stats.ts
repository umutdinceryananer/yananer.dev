// `npm run stats` -- the dashboard, until there is a real one.
//
// This exists because `wrangler d1 execute --file` is not usable for this:
// given analytics/stats.sql it reported "2 commands executed successfully" for
// a file holding six, silently skipping four of them, and printed what it did
// run as raw JSON. A reporting tool that quietly drops two thirds of its report
// is worse than no tool.
//
// So the splitting happens here, one --command per query, and the output is a
// table. Extra arguments are passed through to wrangler, which is how the local
// database gets queried during development:
//
//   npm run stats
//   npm run stats -- --local --persist-to .wrangler/state

import { readFileSync } from 'fs'
import { execFileSync } from 'child_process'

const CONFIG = 'analytics/wrangler.toml'
const passthrough = process.argv.slice(2)
// --remote unless the caller asked for something else. Production is the
// default because that is where the data anyone wants to read lives.
const location = passthrough.some((a) => a === '--local' || a === '--remote') ? [] : ['--remote']

interface Block {
  title: string
  sql: string
}

/** Splits the file on its own section headers, then strips comments so what
    reaches wrangler is only SQL. */
function blocks(): Block[] {
  const raw = readFileSync('analytics/stats.sql', 'utf8')
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

function run(sql: string): Record<string, unknown>[] {
  const raw = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'ANALYTICS_DB', '--config', CONFIG, ...location, ...passthrough, '--json', '--command', sql],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  )
  // wrangler prints a banner before the JSON on some paths; take from the first
  // bracket rather than assuming the whole of stdout parses.
  const start = raw.indexOf('[')
  const parsed = JSON.parse(raw.slice(start)) as { results?: Record<string, unknown>[] }[]
  return parsed.flatMap((r) => r.results ?? [])
}

function table(rows: Record<string, unknown>[]): void {
  if (!rows.length) {
    console.log('  (no rows yet)')
    return
  }
  const cols = Object.keys(rows[0])
  const cell = (v: unknown) => (v === null || v === undefined ? '-' : String(v))
  const width = cols.map((c) => Math.max(c.length, ...rows.map((r) => cell(r[c]).length)))
  const line = (parts: string[]) => '  ' + parts.map((p, i) => p.padEnd(width[i])).join('  ')
  console.log(line(cols))
  console.log(line(width.map((w) => '-'.repeat(w))))
  for (const r of rows) console.log(line(cols.map((c) => cell(r[c]))))
}

let failed = 0
for (const { title, sql } of blocks()) {
  console.log(`\n${title}`)
  try {
    table(run(sql))
  } catch (err) {
    failed += 1
    console.log(`  ! ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
  }
}
console.log()
if (failed) {
  // Loud, because a partly-run report reads like a complete one.
  throw new Error(`${failed} of the queries in analytics/stats.sql did not run.`)
}
