// `npm run stats` -- the same numbers as the dashboard, in a terminal.
//
// Useful when you want one number in a shell, or want to pipe it. For the
// readable version, `npm run dashboard`. Both read the same queries through
// scripts/d1.ts, so the two can never disagree.
//
//   npm run stats
//   npm run stats -- --local --persist-to .wrangler/state

import { runAll, type Row } from './d1'

function table(rows: Row[]): void {
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

const sections = runAll(process.argv.slice(2))
for (const s of sections) {
  console.log(`\n${s.title}`)
  if (s.error) console.log(`  ! ${s.error}`)
  else table(s.rows)
}
console.log()

const failed = sections.filter((s) => s.error)
if (failed.length) {
  // Loud, because a partly-run report reads like a complete one.
  throw new Error(`${failed.length} of the queries in analytics/stats.sql did not run.`)
}
