// `npm run dashboard` -- the analytics page, written to a file and opened.
//
// The same page analytics/src/worker.ts serves at stats.yananer.dev, rendered by
// the same function. This form needs no deploy and no login, reads production
// directly, and is the one to reach for when the hosted one is being changed.
//
//   npm run dashboard
//   npm run dashboard -- --local --persist-to .wrangler/state
//   npm run dashboard -- --no-open

import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { execFile } from 'child_process'
import { runAll } from './d1'
import { renderDashboard } from '../analytics/src/render'

const OUT_DIR = '.analytics'
const OUT = resolve(OUT_DIR, 'dashboard.html')

/** Flags this script handles itself. Passing one through to wrangler makes
    every query fail at once, which is exactly what happened the first time. */
const OWN_FLAGS = ['--no-open']

const args = process.argv.slice(2)
const forWrangler = args.filter((a) => !OWN_FLAGS.includes(a))
const explicit = forWrangler.some((a) => a === '--local' || a === '--remote')
const all = runAll([...(explicit ? [] : ['--remote']), ...forWrangler])

const html = renderDashboard(all, {
  generated: new Date().toISOString().replace('T', ' ').slice(0, 16),
  source: explicit ? 'the database you selected' : 'the production D1 database',
})

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT, html)

const sessions = all.find((s) => s.title.startsWith('Q0'))?.rows.find((r) => r.metric === 'sessions')?.value
const failed = all.filter((s) => s.error)
console.log(`\n  ${OUT}`)
console.log(`  ${sessions ?? 0} sessions${failed.length ? `, ${failed.length} query error(s)` : ''}\n`)

// Best effort. The path above is the deliverable; opening it is a convenience,
// and a headless or minimal environment has no opener at all.
if (!args.includes('--no-open')) {
  execFile('xdg-open', [OUT], (err) => {
    if (err) console.log('  (open it yourself -- no xdg-open here)\n')
  })
}

if (failed.length) {
  throw new Error(`${failed.length} of the queries did not run.`)
}
