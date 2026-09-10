// Fail the build on the ways the analytics tracker can break silently.
//
// There are no tests and no CI here, so a build-time throw is the only
// enforcement this repo has -- and it already commits to that idiom three
// times: vite.config.ts throws when the CSP token count is wrong,
// prerender.ts throws when the mount point is missing, and mcp's
// audit-capabilities.ts exits 1 before a deploy.
//
// Every check below exists because its failure mode produces no error at
// runtime. A blocked beacon, an unset endpoint, a tracker that got inlined into
// the main bundle and a script the CSP forgot to hash all look, from the
// outside, like a site nobody visits.
//
// Runs last in `npm run build`, after prerender has finished rewriting
// dist/index.html.

import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createHash } from 'crypto'
import { gzipSync } from 'zlib'

const DIST = resolve('dist')
const HEADERS = resolve(DIST, '_headers')
const INDEX = resolve(DIST, 'index.html')

/** Gzipped ceiling for the tracker chunk. It is a behaviour tracker on a
    portfolio, not a product; if it outgrows this, something was added that
    should have been a query on the collector instead. */
const MAX_TRACKER_GZIP = 6 * 1024

/** The per-tab identity key, present in session.ts and nowhere else. */
const SENTINEL = 'ya_sid'

const problems: string[] = []
const fail = (msg: string) => problems.push(msg)

const headers = readFileSync(HEADERS, 'utf8')
const html = readFileSync(INDEX, 'utf8')

// ── 1. The endpoint has to be reachable under the site's own CSP ─────────────
//
// The highest-value check here, because sendBeacon's failure is invisible: it
// returns true as soon as the payload is queued and the policy check happens
// after that, so a missing connect-src entry produces a console violation in a
// browser nobody is looking at and total data loss everywhere else.

const endpoint = process.env.VITE_ANALYTICS_ENDPOINT

if (endpoint) {
  const connect = headers.match(/connect-src ([^;]+);/)?.[1]
  if (!connect) {
    fail('could not find a connect-src directive in dist/_headers')
  } else if (/^https?:\/\//i.test(endpoint)) {
    const origin = new URL(endpoint).origin
    if (!connect.includes(origin)) {
      fail(
        `VITE_ANALYTICS_ENDPOINT is ${origin}, which connect-src does not allow.\n` +
          `      Add it to public/_headers, or use a same-origin path (covered by 'self').\n` +
          `      connect-src is: ${connect.trim()}`,
      )
    }
  } else if (!endpoint.startsWith('/')) {
    fail(
      `VITE_ANALYTICS_ENDPOINT is "${endpoint}" -- expected an absolute URL or a path starting with "/".`,
    )
  }
  // A relative path is same-origin and therefore already covered by 'self'.
}

// ── 2. Production must actually have an endpoint ─────────────────────────────
//
// session.ts no-ops when it is unset, by design, so a fork and a preview build
// stay quiet. On main that same silence is the bug.

if (process.env.CF_PAGES_BRANCH === 'main' && !endpoint) {
  fail(
    'VITE_ANALYTICS_ENDPOINT is unset on a production build.\n' +
      '      The tracker no-ops silently without it. Set it in the Pages project settings.',
  )
}

// ── 3. The CSP hashes must match the HTML that actually ships ────────────────
//
// A real hole, independent of analytics. cspInlineScriptHashes runs at the end
// of `vite build`; prerender.ts rewrites dist/index.html afterwards. So the
// hashes in dist/_headers describe the pre-prerender HTML. Any executable
// inline <script> that only exists after the prerender is never hashed, and is
// blocked in production with no local symptom at all.

const INLINE = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi
const EXECUTABLE = ['', 'module', 'text/javascript', 'application/javascript']

for (const [, attrs, body] of html.matchAll(INLINE)) {
  const type = (attrs.match(/type="([^"]*)"/)?.[1] ?? '').toLowerCase()
  if (!EXECUTABLE.includes(type)) continue
  // Newlines normalised the same way the HTML parser does before the browser
  // hashes the script -- see the note in vite.config.ts.
  const text = body.replace(/\r\n/g, '\n')
  const hash = createHash('sha256').update(text, 'utf8').digest('base64')
  if (!headers.includes(hash)) {
    fail(
      `an inline <script> in the final dist/index.html is not allowed by the CSP.\n` +
        `      sha256-${hash} is missing from script-src.\n` +
        `      It was almost certainly added after cspInlineScriptHashes ran -- by the prerender.`,
    )
  }
}

// ── 4. The tracker must never have entered the prerender ─────────────────────
//
// main.tsx mounts <Analytics /> outside <App />, and Analytics imports the
// tracker dynamically, precisely so neither reaches the SSR graph. If someone
// moves the mount into App.tsx, the tracker is executed under Node at build
// time and its output is baked into every visitor's HTML.

const SSR_ENTRY = resolve('dist-ssr/entry-server.js')
if (existsSync(SSR_ENTRY) && readFileSync(SSR_ENTRY, 'utf8').includes(SENTINEL)) {
  fail(
    'the tracker reached the SSR bundle (dist-ssr/entry-server.js).\n' +
      '      <Analytics /> belongs in main.tsx, not in App.tsx -- see components/Analytics.tsx.',
  )
}
if (html.includes(SENTINEL)) {
  fail(`the prerendered dist/index.html contains "${SENTINEL}" -- the tracker ran during the build.`)
}

// ── 5. The tracker must stay out of the main bundle, and stay small ─────────
//
// Two different properties, two different markers, because they are not the
// same claim.
//
// BEACON is the collecting machinery. With no endpoint configured the early
// return in tracker.ts is statically true and everything past it folds away, so
// this string must be absent from the output entirely -- that is the proof a
// fork, a preview or a disabled build really does ship none of it rather than
// merely not calling it.
//
// SENTINEL is the identity module. It must never reach the main bundle either,
// but it does NOT vanish in a disabled build and asserting that it did was
// wrong: `optedOut()` runs before the endpoint check and has side effects (it
// clears a stored identifier when the visitor has refused), so the bundler
// cannot drop it. What survives is a ~375 byte stub that reads the opt-out flag
// and returns. That is correct behaviour, not a leak.
//
// Filenames are not used for any of this: Rollup splits these modules across
// chunks as it sees fit and is free to re-split at any time. The property is
// what must hold, not the layout.

/** The beacon body type -- present only where the tracker actually sends. */
const BEACON = 'text/plain;charset=UTF-8'

const chunks = readdirSync(DIST).filter((f) => f.endsWith('.js'))
const withMarker = (marker: string) =>
  chunks.filter((f) => readFileSync(resolve(DIST, f), 'utf8').includes(marker))

const sending = withMarker(BEACON)
const identity = withMarker(SENTINEL)
const inMain = [...new Set([...sending, ...identity])].filter((f) => f.startsWith('main.'))

if (inMain.length) {
  fail(
    `analytics code was bundled into ${inMain.join(', ')}.\n` +
      '      It must stay behind a dynamic import so a visitor who opts out never\n' +
      '      downloads it. A static import from anything App.tsx renders will do this.',
  )
}

if (!endpoint) {
  if (sending.length) {
    fail(
      `no endpoint is configured, but the beacon still ships in ${sending.join(', ')}.\n` +
        '      Everything past the endpoint check in tracker.ts is supposed to fold away.',
    )
  } else {
    console.log('Analytics: no endpoint set, the tracker folded out of the bundle')
  }
} else if (!sending.length) {
  fail('no built chunk carries the beacon -- is the tracker still reachable from Analytics.tsx?')
} else {
  const carrying = [...new Set([...sending, ...identity])]
  const gz = carrying.reduce((n, f) => n + gzipSync(readFileSync(resolve(DIST, f))).length, 0)
  if (gz > MAX_TRACKER_GZIP) {
    fail(
      `analytics is ${(gz / 1024).toFixed(1)}KB gzipped across ${carrying.length} chunk(s), ` +
        `over the ${MAX_TRACKER_GZIP / 1024}KB budget.`,
    )
  } else {
    console.log(
      `Analytics: ${(gz / 1024).toFixed(1)}KB gzipped across ${carrying.length} chunk(s) ` +
        `(${carrying.join(', ')})`,
    )
  }
}

// ── 6. If it measures, it has to say so ──────────────────────────────────────
//
// Not a legal opinion, a wiring check: the notice is generated from
// src/data/privacy.ts and reached from the footer, and both halves are easy to
// break without noticing -- the page by removing it from the generator, the
// link by refactoring Footer. Either failure leaves a site that measures
// visitors and tells them nothing.

if (endpoint) {
  if (!existsSync(resolve(DIST, 'privacy/index.html'))) {
    fail(
      'the tracker is enabled but dist/privacy/index.html is missing.\n' +
        '      It is generated from src/data/privacy.ts by scripts/generate-agent-files.ts.',
    )
  }
  const footer = readFileSync(resolve('src/components/Footer.tsx'), 'utf8')
  if (!footer.includes('PrivacyModal')) {
    fail('the tracker is enabled but src/components/Footer.tsx no longer links the privacy notice.')
  }
}

// ── 7. The two copies of the protocol must agree ─────────────────────────────
//
// PROTOCOL is declared twice on purpose -- once in the bundle's contract and
// once in the collector, which is a Pages Function with its own tsconfig and no
// import path back into src/. The header of types.ts has always said the two are
// mirrored by hand; nothing checked it. Drift here is the quiet kind: the
// collector answers 409 to every batch and the site simply stops collecting.

const contract = readFileSync(resolve('src/lib/analytics/types.ts'), 'utf8')
const collector = readFileSync(resolve('functions/api/collect.ts'), 'utf8')
// `export const` in the contract, bare `const` in the collector -- the two files
// have no import path between them, which is the whole reason this check exists.
const versionIn = (src: string) => src.match(/^(?:export )?const PROTOCOL = (\d+)$/m)?.[1]
const [a, b] = [versionIn(contract), versionIn(collector)]

if (!a || !b) {
  fail(`could not read PROTOCOL from ${!a ? 'src/lib/analytics/types.ts' : 'functions/api/collect.ts'}.`)
} else if (a !== b) {
  fail(
    `PROTOCOL disagrees: types.ts says ${a}, functions/api/collect.ts says ${b}.\n` +
      '      The collector rejects every batch it predates, so this stops collection silently.',
  )
}

// The event names have to line up too: an event the contract can emit and the
// collector has no branch for is dropped without a trace.
const emitted = [...contract.matchAll(/^\s+t: '([a-z]+)'$/gm)].map((m) => m[1])
const handled = new Set([...collector.matchAll(/^\s+case '([a-z]+)':/gm)].map((m) => m[1]))
const union = contract.slice(contract.indexOf('export type AnalyticsEvent'))
for (const name of new Set(emitted)) {
  // Only the ones actually in the union -- LayoutEvent is defined but excluded.
  const inUnion = union.includes(`${name.charAt(0).toUpperCase()}${name.slice(1)}Event`)
  if (inUnion && !handled.has(name)) {
    fail(`the contract emits "${name}" but functions/api/collect.ts has no case for it -- it would be dropped.`)
  }
}

// ── 7. Every click target has to have a name ────────────────────────────────
//
// The whole click dataset is keyed on `data-ya`. An interactive element without
// one is not an error anyone will see: the tracker reports it as `?button`,
// which is enough to notice but not enough to act on, and by the time it is
// noticed the clicks are already recorded under a name nobody can map back.
//
// Exemptions are structural rather than a list of file positions, so they
// cannot go stale: a dialog backdrop and a panel that only stops propagation
// are not targets anyone chooses, and counting them would bury the ones they do.

const EXEMPT = ['stopPropagation', 'role="dialog"', 'chrome.root']

function clickTargets(src: string): { line: number; text: string }[] {
  const lines = src.split('\n')
  const out: { line: number; text: string }[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('onClick=')) continue
    let start = i
    while (start >= 0 && !/^\s*<[A-Za-z]/.test(lines[start])) start--
    if (start < 0) continue
    let end = i
    while (end < lines.length && !/\/?>\s*$/.test(lines[end])) end++
    out.push({ line: start + 1, text: lines.slice(start, end + 1).join('\n') })
  }
  return out
}

const tsxFiles: string[] = []
const walk = (dir: string) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.tsx')) tsxFiles.push(full)
  }
}
walk(resolve('src'))

const unnamed: string[] = []
for (const file of tsxFiles) {
  const src = readFileSync(file, 'utf8')
  for (const { line, text } of clickTargets(src)) {
    if (text.includes('data-ya="')) continue
    if (EXEMPT.some((e) => text.includes(e))) continue
    unnamed.push(`${file.replace(resolve('.') + '/', '')}:${line}`)
  }
}
if (unnamed.length) {
  fail(
    `${unnamed.length} clickable element(s) have no data-ya name:\n` +
      unnamed.map((u) => `        ${u}`).join('\n') +
      '\n      Add one, or -- if it is a backdrop or a propagation stopper -- it should look like one.',
  )
}

// Names without a key are one specific element and must be unique; names with a
// key are templates over a list (twelve project cards, three form fields) and
// are supposed to repeat.
//
// Scanned by position rather than by a regex over the whole element: attributes
// here are written both inline and across lines, and a pattern that assumed
// either shape quietly matched only some of them -- which is the failure mode
// where a check reports success while examining two thirds of the input.

const NAME = /data-ya="([^"]+)"/g
const seen = new Map<string, string>()

for (const file of tsxFiles) {
  const src = readFileSync(file, 'utf8')
  const short = file.replace(resolve('.') + '/', '')
  const hits = [...src.matchAll(NAME)]
  for (let i = 0; i < hits.length; i++) {
    const name = hits[i][1]
    // Everything between this name and the next one belongs to this element.
    const until = i + 1 < hits.length ? hits[i + 1].index : src.length
    if (src.slice(hits[i].index, until).includes('data-ya-key')) continue
    const prev = seen.get(name)
    if (prev) {
      fail(`data-ya="${name}" appears in ${prev} and ${short} with no data-ya-key to tell them apart.`)
    }
    seen.set(name, short)
  }
}

console.log(`Analytics: ${seen.size} named click target(s), ${tsxFiles.length} components scanned`)

// ── report ───────────────────────────────────────────────────────────────────

if (problems.length) {
  throw new Error(
    `audit-analytics found ${problems.length} problem(s):\n` +
      problems.map((p) => `  - ${p}`).join('\n'),
  )
}

if (endpoint) console.log(`Analytics: posting to ${endpoint}`)
