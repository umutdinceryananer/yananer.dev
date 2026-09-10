// `npm run dashboard` -- the analytics screen.
//
// Builds a self-contained HTML page from the same queries `npm run stats`
// prints, writes it to .analytics/dashboard.html and opens it. One file, no
// server, no external requests: it is a report you can keep, mail to yourself,
// or open on a plane.
//
// It runs on this machine rather than being deployed, deliberately for now. A
// hosted dashboard needs a Worker on its own hostname behind Cloudflare Access,
// which is a second deploy and an auth setup; this needs neither and reads the
// production database directly. If it turns out to be something worth opening
// from a phone, the hosted version reuses this file's rendering wholesale.
//
// The statistical rules the page enforces, because a dashboard that presents
// noise as insight is worse than no dashboard:
//   - no percentage whose denominator is under 100
//   - no day-over-day comparison at this volume
//   - a panel below its threshold says so instead of drawing a shape

import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { execFile } from 'child_process'
import { runAll, section, num, type Row } from './d1'

const OUT_DIR = '.analytics'
const OUT = resolve(OUT_DIR, 'dashboard.html')

/** Below this many sessions, a percentage is reporting precision the data does
    not have. Shown as a raw count instead. */
const PCT_FLOOR = 100

/** Flags this script handles itself. Everything else is wrangler's -- and
    passing one of these through to it makes every query fail at once, which is
    exactly what happened the first time. */
const OWN_FLAGS = ['--no-open']

const args = process.argv.slice(2)
const forWrangler = args.filter((a) => !OWN_FLAGS.includes(a))
const explicit = forWrangler.some((a) => a === '--local' || a === '--remote')
const all = runAll([...(explicit ? [] : ['--remote']), ...forWrangler])

// ── helpers ──────────────────────────────────────────────────────────────────

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const rows = (prefix: string): Row[] => section(all, prefix)?.rows ?? []
const failed = all.filter((s) => s.error)

/** A horizontal bar row. `label` on the left, bar, value on the right. */
function bars(data: { label: string; value: number; note?: string; accent?: boolean }[], unit = ''): string {
  if (!data.length) return `<p class="empty">Nothing recorded yet.</p>`
  const max = Math.max(...data.map((d) => d.value), 1)
  return `<div class="bars">${data
    .map(
      (d) => `<div class="bar">
      <span class="bl">${esc(d.label)}</span>
      <span class="bt"><i style="width:${Math.max(1.5, (d.value / max) * 100)}%" ${d.accent ? 'class="acc"' : ''}></i></span>
      <span class="bv">${esc(d.value)}${unit}${d.note ? `<em>${esc(d.note)}</em>` : ''}</span>
    </div>`,
    )
    .join('')}</div>`
}

function card(title: string, subtitle: string, body: string): string {
  return `<section class="card">
    <h2>${esc(title)}</h2>
    <p class="sub">${esc(subtitle)}</p>
    ${body}
  </section>`
}

// ── Q0: is anything arriving ────────────────────────────────────────────────

const meta = Object.fromEntries(rows('Q0').map((r) => [String(r.metric), r.value]))
const totalBatches = num(meta.batches)
const totalSessions = num(meta.sessions)

// ── Q1: does anyone press Work ──────────────────────────────────────────────

const q1 = rows('Q1')[0] ?? {}
const sessions = num(q1.sessions)
const reachedWork = num(q1.reached_work)
const workHeadline =
  sessions === 0
    ? `<div class="big muted">no data</div><p class="empty">Nothing has been collected yet.</p>`
    : sessions < PCT_FLOOR
      ? `<div class="big">${reachedWork}<span class="of"> of ${sessions}</span></div>
         <p class="warn">Shown as a count, not a percentage: ${sessions} sessions is too few for a
         rate to mean anything. It becomes a percentage past ${PCT_FLOOR}.</p>`
      : `<div class="big">${Math.round((reachedWork / sessions) * 100)}<span class="of">%</span></div>
         <p class="sub">${reachedWork} of ${sessions} sessions opened the Work tab.</p>`

// ── Q2: by day ──────────────────────────────────────────────────────────────

const byDay = rows('Q2')
const days = [...new Set(byDay.map((r) => String(r.day)))].sort()
const dayChart = (() => {
  if (!days.length) return `<p class="empty">Nothing recorded yet.</p>`
  const get = (d: string, route: string) =>
    num(byDay.find((r) => r.day === d && r.route === route)?.sessions)
  const max = Math.max(...days.map((d) => get(d, 'about')), 1)
  const W = 640
  const H = 150
  const gap = 6
  const bw = Math.max(6, (W - gap * (days.length - 1)) / days.length)
  return `<svg viewBox="0 0 ${W} ${H + 22}" class="chart" role="img" aria-label="Sessions per day">
    ${days
      .map((d, i) => {
        const x = i * (bw + gap)
        const a = get(d, 'about')
        const w = get(d, 'work')
        const ah = (a / max) * H
        const wh = (w / max) * H
        return `<rect x="${x}" y="${H - ah}" width="${bw}" height="${ah}" rx="2" fill="#2e2e2e"/>
                <rect x="${x}" y="${H - wh}" width="${bw}" height="${wh}" rx="2" fill="#6ea8a1"/>
                <text x="${x + bw / 2}" y="${H + 15}" class="tick">${esc(d.slice(5))}</text>`
      })
      .join('')}
  </svg>
  <p class="legend"><i style="background:#2e2e2e"></i> About &nbsp; <i style="background:#6ea8a1"></i> Work</p>`
})()

// ── Q2b: returning ──────────────────────────────────────────────────────────

const q2b = rows('Q2b')[0] ?? {}
const browsers = num(q2b.browsers)
const cameBack = num(q2b.came_back)
const returning =
  browsers === 0
    ? `<p class="empty">No browser has reported an identifier yet.</p>`
    : `<div class="big">${cameBack}<span class="of"> of ${browsers}</span></div>
       <p class="sub">Browsers that have visited more than once. Most visits by one browser:
       ${num(q2b.most_visits)}. Longest gap: ${num(q2b.longest_gap_days)} days.</p>
       <p class="warn">Undercounts by design early on: someone who will come back next month
       is counted here as a one-time visitor today. Give it months.</p>`

// ── Q3: how far down ────────────────────────────────────────────────────────

const depth = rows('Q3')
const depthBars = bars(
  depth.map((r) => ({
    label: `${r.route} · ${r.viewport}`,
    value: num(r.avg_scroll_pct),
    note: `${num(r.leaves)} views · ${num(r.avg_active_s)}s read`,
    accent: r.viewport === 'phone',
  })),
  '%',
)

// ── Q4: actions ─────────────────────────────────────────────────────────────

const actions = rows('Q4')
const actionBars = bars(
  actions.map((r) => ({ label: String(r.action), value: num(r.n), note: `${num(r.sessions)} sessions` })),
)


// ── Q5: which project earns the click ───────────────────────────────────────

const clicks = rows('Q5')
const unnamed = clicks.filter((r) => String(r.target).startsWith('?'))
const clickBars = bars(
  clicks.slice(0, 12).map((r) => ({
    label: String(r.target),
    value: num(r.clicks),
    note: `${num(r.sessions)} sessions`,
    accent: String(r.target).startsWith('work.card.'),
  })),
)

// ── Q6: the contact funnel ──────────────────────────────────────────────────
//
// Presented as an event log rather than a conversion rate. One of only two
// conversions on this site, at a volume where a percentage would be theatre --
// and the interesting number is which field people stop at, which a single rate
// throws away.

const fieldRows = rows('Q6')
const funnel = (() => {
  const fields = [...new Set(fieldRows.map((r) => String(r.field)))].filter((f) => f !== 'form')
  if (!fields.length) return `<p class="empty">Nobody has touched the form yet.</p>`
  const at = (f: string, a: string) => num(fieldRows.find((r) => r.field === f && r.action === a)?.n)
  const submits = num(fieldRows.find((r) => r.field === 'form' && r.action === 'submit')?.n)
  return `<div class="bars">${fields
    .map((f) => {
      const focus = at(f, 'focus')
      const filled = at(f, 'filled')
      const left = at(f, 'abandon')
      // No ratio without a denominator. The tracker emits focus before filled,
      // so focus should never be the smaller number -- but a display that
      // renders "5/0" when it is has stopped describing anything.
      const value = focus >= filled && focus > 0 ? `${filled}/${focus}` : `${filled} filled`
      return `<div class="bar">
        <span class="bl">${esc(f)}</span>
        <span class="bt"><i style="width:${focus > 0 ? Math.min(100, (filled / focus) * 100) : 0}%"></i></span>
        <span class="bv">${value}${left ? `<em>${left} left it empty</em>` : ''}</span>
      </div>`
    })
    .join('')}</div>
  <p class="sub" style="margin:.8rem 0 0">${submits} message${submits === 1 ? '' : 's'} sent.</p>`
})()

// ── Q7 / Q8: errors and rage ────────────────────────────────────────────────

const errs = rows('Q7')
const errList = errs.length
  ? `<div class="bars">${errs
      .slice(0, 6)
      .map(
        (r) => `<div class="bar">
      <span class="bl" title="${esc(r.message)}">${esc(r.message)}</span>
      <span class="bt"><i style="width:100%"></i></span>
      <span class="bv">${num(r.n)}<em>${esc(r.source ?? '')}${r.line ? `:${num(r.line)}` : ''}</em></span>
    </div>`,
      )
      .join('')}</div>`
  : `<p class="empty">Nothing has thrown in front of a visitor.</p>`

const rage = rows('Q8')
const rageList = rage.length
  ? bars(rage.map((r) => ({ label: String(r.target), value: num(r.bursts), note: `${num(r.sessions)} sessions`, accent: true })))
  : `<p class="empty">Nobody has clicked the same thing three times in a second.</p>`

// ── page ────────────────────────────────────────────────────────────────────

const generated = new Date().toISOString().replace('T', ' ').slice(0, 16)
const range = meta['first day'] === meta['last day'] ? meta['first day'] : `${meta['first day']} → ${meta['last day']}`

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>yananer.dev — analytics</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; padding:2.5rem 1.25rem 4rem; background:#050505; color:#c6c6c6;
         font:15px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .wrap { max-width: 900px; margin: 0 auto; }
  header { display:flex; align-items:baseline; justify-content:space-between; gap:1rem;
           flex-wrap:wrap; margin-bottom:.4rem; }
  h1 { font-size:1.15rem; color:#fff; margin:0; font-weight:600; }
  .stamp { color:#797979; font-size:.75rem; }
  .strip { display:flex; gap:1.5rem; flex-wrap:wrap; padding:.85rem 1rem; margin:1rem 0 1.5rem;
           background:#0a0a0a; border:1px solid #1d1d1d; border-radius:10px; font-size:.8rem; }
  .strip b { color:#fff; font-weight:600; }
  .strip span { color:#797979; }
  .grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); }
  .card { background:#0a0a0a; border:1px solid #1d1d1d; border-radius:12px; padding:1.15rem 1.25rem; }
  .card.wide { grid-column:1/-1; }
  h2 { font-size:.9rem; color:#fff; margin:0 0 .15rem; font-weight:600; }
  .sub { color:#797979; font-size:.78rem; margin:0 0 .9rem; }
  .warn { color:#8a7f5c; font-size:.72rem; margin:.7rem 0 0; line-height:1.5; }
  .empty { color:#5a5a5a; font-size:.8rem; font-style:italic; margin:.4rem 0 0; }
  .big { font-size:2.6rem; color:#fff; font-weight:600; line-height:1.1; letter-spacing:-.02em; }
  .big.muted { color:#404040; font-size:1.6rem; }
  .of { font-size:1rem; color:#797979; font-weight:400; letter-spacing:0; }
  .bars { display:flex; flex-direction:column; gap:.5rem; }
  .bar { display:grid; grid-template-columns:9.5rem 1fr auto; align-items:center; gap:.7rem; font-size:.78rem; }
  .bl { color:#a3a3a3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bt { background:#131313; border-radius:3px; height:9px; overflow:hidden; }
  .bt i { display:block; height:100%; background:#3f3f3f; border-radius:3px; }
  .bt i.acc { background:#6ea8a1; }
  .bv { color:#fff; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .bv em { color:#5a5a5a; font-style:normal; font-size:.72rem; margin-left:.45rem; }
  .chart { width:100%; height:auto; }
  .tick { fill:#5a5a5a; font-size:9px; text-anchor:middle; }
  .legend { color:#797979; font-size:.72rem; margin:.5rem 0 0; }
  .legend i { display:inline-block; width:9px; height:9px; border-radius:2px; vertical-align:middle; }
  .err { background:#1a0f0f; border:1px solid #3a1d1d; color:#c98b8b; padding:.8rem 1rem;
         border-radius:10px; font-size:.78rem; margin-bottom:1rem; }
  footer { color:#4a4a4a; font-size:.72rem; margin-top:2rem; line-height:1.6; }
</style></head>
<body><div class="wrap">

<header>
  <h1>yananer.dev — analytics</h1>
  <span class="stamp">generated ${esc(generated)} UTC</span>
</header>

${
  failed.length
    ? `<div class="err"><b>${failed.length} quer${failed.length === 1 ? 'y' : 'ies'} failed to run</b><br>${failed
        .map((f) => `${esc(f.title)} — ${esc(f.error)}`)
        .join('<br>')}</div>`
    : ''
}

<div class="strip">
  <span>sessions <b>${totalSessions}</b></span>
  <span>batches <b>${totalBatches}</b></span>
  <span>days <b>${esc(meta.days ?? 0)}</b></span>
  <span>range <b>${esc(range ?? '—')}</b></span>
</div>

<div class="grid">
  ${card('Does anyone press Work?', 'The question this whole system exists for — Cloudflare Web Analytics counts document loads, and this is a hashchange.', workHeadline)}
  ${card('Does anyone come back?', 'Counted over browsers that reported an identifier. Someone with storage disabled, or opted out, is not here.', returning)}
  <section class="card wide">
    <h2>Sessions per day</h2>
    <p class="sub">Read the trend, never one day against the last: at this volume a day-over-day change under about a third is noise.</p>
    ${dayChart}
  </section>
  ${card('How far down does anyone get?', 'Average deepest scroll. "read" is active time only — tab hidden, dialog open and idle time are all excluded.', depthBars)}
  ${card('What did people press?', 'Named things that are not clicks — a theme flip, a dropped foreign error.', actionBars)}
  <section class="card wide">
    <h2>Which project earns the click?</h2>
    <p class="sub">Every named target, most-clicked first. Project cards highlighted.${
      unnamed.length ? ` <b>${unnamed.length} target(s) have no name</b> — the build should have caught that.` : ''
    }</p>
    ${clickBars}
  </section>
  ${card('Where does the contact form lose people?', 'Filled out of focused, per field. Field names only — what was typed never left the browser.', funnel)}
  ${card('Did anything break?', "Only this site's own files. Extension errors are dropped at the source and counted as err.foreign above.", errList)}
  ${card('Rage clicks', 'Three hits on one target inside a second. Derived from the click stream, not collected separately.', rageList)}
</div>

<footer>
  Built by <code>npm run dashboard</code> from analytics/stats.sql, read straight off
  ${esc(explicit ? 'the database you selected' : 'the production D1 database')}.<br>
  This file is local and gitignored. Re-run the command to refresh it.
</footer>

</div></body></html>
`

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT, html)
console.log(`\n  ${OUT}`)
console.log(`  ${totalSessions} sessions, ${totalBatches} batches${failed.length ? `, ${failed.length} query error(s)` : ''}\n`)

// Best effort. A path printed above is the actual deliverable; opening it is a
// convenience, and a headless or minimal environment has no opener at all.
if (!args.includes('--no-open')) {
  execFile('xdg-open', [OUT], (err) => {
    if (err) console.log('  (open it yourself — no xdg-open here)\n')
  })
}

if (failed.length) {
  throw new Error(`${failed.length} of the queries in analytics/stats.sql did not run.`)
}
