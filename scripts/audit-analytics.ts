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

/** Present in the tracker chunk and nowhere else. */
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

// ── 5. The tracker must be its own chunk, and a small one ────────────────────
//
// With no endpoint configured the early return in tracker.ts is statically
// true, so the bundler folds the whole module away and the sentinel disappears
// from the output entirely. That is worth asserting in its own right: it is the
// proof that a fork, a preview or an opted-out build really does ship none of
// this rather than merely not calling it.

const chunks = readdirSync(DIST).filter((f) => f.endsWith('.js'))
const carrying = chunks.filter((f) => readFileSync(resolve(DIST, f), 'utf8').includes(SENTINEL))

if (!endpoint) {
  if (carrying.length) {
    fail(
      `no endpoint is configured, but "${SENTINEL}" still ships in ${carrying.join(', ')}.\n` +
        '      The disabled tracker is supposed to fold away entirely -- something now\n' +
        '      references it outside the endpoint check in tracker.ts.',
    )
  } else {
    console.log('Analytics: no endpoint set, tracker folded out of the bundle')
  }
} else if (!carrying.length) {
  fail(`no built chunk contains "${SENTINEL}" -- is the tracker still reachable from Analytics.tsx?`)
} else if (carrying.length > 1) {
  fail(`"${SENTINEL}" appears in ${carrying.length} chunks (${carrying.join(', ')}); expected exactly one.`)
} else {
  const [chunk] = carrying
  if (chunk.startsWith('main.')) {
    fail(
      `the tracker was bundled into ${chunk}.\n` +
        '      It must stay a dynamic import so a visitor who opts out never downloads it.',
    )
  }
  const gz = gzipSync(readFileSync(resolve(DIST, chunk))).length
  if (gz > MAX_TRACKER_GZIP) {
    fail(
      `the tracker chunk ${chunk} is ${(gz / 1024).toFixed(1)}KB gzipped, over the ${MAX_TRACKER_GZIP / 1024}KB budget.`,
    )
  } else {
    console.log(`Analytics: ${chunk}, ${(gz / 1024).toFixed(1)}KB gzipped`)
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

// ── report ───────────────────────────────────────────────────────────────────

if (problems.length) {
  throw new Error(
    `audit-analytics found ${problems.length} problem(s):\n` +
      problems.map((p) => `  - ${p}`).join('\n'),
  )
}

if (endpoint) console.log(`Analytics: posting to ${endpoint}`)
