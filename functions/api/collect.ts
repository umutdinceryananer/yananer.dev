/**
 * The collector. A Cloudflare Pages Function, served same-origin at
 * /api/collect by the same `git push` that deploys the site.
 *
 * Same-origin is the whole point of the shape. `connect-src 'self'` in
 * public/_headers already allows it, so adding this endpoint needed no CSP
 * edit — and a missing CSP entry is the worst failure this system can have:
 * sendBeacon returns true once the data is queued and the policy check happens
 * afterwards, so a blocked beacon produces no error, no rejected promise and no
 * data, which looks exactly like a site nobody visits. Same-origin also means
 * no CORS preflight on the unload batch, and no tracker blocklist to dodge.
 *
 * Two things that do NOT come for free here:
 *
 *   1. public/_headers does not apply to Pages Function responses. None of the
 *      site's HSTS, Referrer-Policy, nosniff or X-Robots-Tag reach this
 *      endpoint. They are set in code below, the way mcp/src/worker.ts does it.
 *
 *   2. Pages Functions cannot define a Durable Object class and cannot carry a
 *      rate-limiting binding, so the [[unsafe.bindings]] limiter from
 *      mcp/wrangler.toml does not port. Abuse control here is: a hard body cap,
 *      full revalidation of every field, and storing only what we re-serialize
 *      ourselves. A WAF rate-limiting rule on this path is the operational
 *      complement and is set up in the dashboard, not in this repo.
 *
 * Nothing derived from the visitor's IP is stored, and the request is never
 * logged. The edge sees an IP because it must; that is where it stops.
 */

/** The slice of D1 this function uses. Declared rather than imported, so the
    site's build stays free of Workers type packages — mcp/src/worker.ts makes
    the same trade for its rate limiter. */
interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): { run(): Promise<unknown> }
  }
}

interface Env {
  ANALYTICS_DB: D1Database
}

interface EventContext {
  request: Request & { cf?: IncomingCf }
  env: Env
}

interface IncomingCf {
  botManagement?: { score?: number; verifiedBot?: boolean }
}

/** Must match src/lib/analytics/types.ts. scripts/audit-analytics.ts enforces it. */
const PROTOCOL = 3

/** sendBeacon's own ceiling. Anything larger did not come from our tracker. */
const MAX_BODY = 64 * 1024
const MAX_EVENTS = 64
/** A session that claims to be older than this is lying or broken. */
const MAX_TS = 6 * 60 * 60 * 1000
const ROUTES = new Set(['about', 'work'])
const FIELD_ACTIONS = new Set(['focus', 'filled', 'abandon', 'submit', 'error'])

/** Obvious non-browsers, for the case where Bot Management is not on the plan
    and `cf.botManagement.score` is absent. Deliberately short: this is the
    coarse net, and the tracker's own trusted-input gate has already run. */
const BOT_UA = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|curl|wget|python-|http-client|lighthouse|preview|fetch/i

const HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
}

const done = (status: number) => new Response(null, { status, headers: HEADERS })

// ── validation ───────────────────────────────────────────────────────────────
//
// Every field is re-read and re-emitted below rather than trusted and stored as
// received. That is what bounds the damage from an unauthenticated public write
// endpoint: the row we insert is built from values this file produced, so the
// upper bound on what anyone can store is a function of this code and not of
// what they sent.

const int = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : null

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null

/** A 0–1 offset, kept as a 0–1 offset. Three decimals is finer than any
    viewport can resolve, and storing the same shape the contract describes
    means the dashboard never has to remember a scaling factor. */
const unit = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? Math.round(v * 1000) / 1000 : null

type Rec = Record<string, unknown>

function cleanEvent(raw: unknown): Rec | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Rec
  const ts = int(e.ts, 0, MAX_TS)
  if (ts === null) return null
  if (typeof e.r !== 'string' || !ROUTES.has(e.r)) return null
  const base = { ts, r: e.r }

  switch (e.t) {
    case 'view':
      return { t: 'view', ...base }

    case 'leave': {
      const ms = int(e.ms, 0, MAX_TS)
      const ams = int(e.ams, 0, MAX_TS)
      const sd = int(e.sd, 0, 100)
      if (ms === null || ams === null || sd === null) return null
      if (!Array.isArray(e.bands) || e.bands.length !== 10) return null
      const bands = e.bands.map((b) => int(b, 0, MAX_TS))
      if (bands.some((b) => b === null)) return null
      const hc = int(e.hc, 0, 1000)
      return {
        t: 'leave',
        ...base,
        ms,
        // Active time cannot exceed wall time; a payload that says otherwise is
        // forged or a clock bug, and either way the smaller number is the safe
        // one to keep.
        ams: Math.min(ams, ms),
        sd,
        bands,
        ...(hc ? { hc } : {}),
        dh: int(e.dh, 0, 1e6) ?? 0,
        vw: int(e.vw, 0, 1e5) ?? 0,
        vh: int(e.vh, 0, 1e5) ?? 0,
      }
    }

    case 'click': {
      const s = str(e.s, 120)
      if (!s) return null
      const nx = unit(e.nx)
      const py = int(e.py, 0, 1e6)
      return {
        t: 'click',
        ...base,
        s,
        ox: unit(e.ox) ?? 0,
        oy: unit(e.oy) ?? 0,
        // Both omitted for a click inside a dialog: those are position:fixed and
        // live outside the scroll container, so there is no honest page-space
        // coordinate to record. The tracker leaves them off; this keeps them off.
        ...(nx !== null ? { nx } : {}),
        ...(py !== null ? { py } : {}),
        vw: int(e.vw, 0, 1e5) ?? 0,
        dh: int(e.dh, 0, 1e6) ?? 0,
        tag: str(e.tag, 16) ?? '',
        ...(str(e.lbl, 64) ? { lbl: str(e.lbl, 64) } : {}),
        ...(str(e.h, 160) ? { h: str(e.h, 160) } : {}),
      }
    }

    case 'dead': {
      const s = str(e.s, 120)
      if (!s) return null
      return { t: 'dead', ...base, s, ...(str(e.lbl, 64) ? { lbl: str(e.lbl, 64) } : {}) }
    }

    case 'err': {
      const m = str(e.m, 200)
      if (!m) return null
      return {
        t: 'err',
        ...base,
        m,
        ...(str(e.src, 80) ? { src: str(e.src, 80) } : {}),
        ...(int(e.ln, 0, 1e6) !== null ? { ln: int(e.ln, 0, 1e6) } : {}),
      }
    }

    case 'field': {
      const f = str(e.f, 40)
      if (!f || typeof e.a !== 'string' || !FIELD_ACTIONS.has(e.a)) return null
      const ms = int(e.ms, 0, MAX_TS)
      return { t: 'field', ...base, f, a: e.a, ...(ms !== null ? { ms } : {}) }
    }

    case 'action': {
      const n = str(e.n, 48)
      if (!n) return null
      return { t: 'action', ...base, n, ...(str(e.s, 64) ? { s: str(e.s, 64) } : {}) }
    }

    // 'layout' is defined in the contract but not emitted yet, and anything
    // else never existed. Both are dropped rather than rejecting the batch —
    // one unknown event should not cost the good ones alongside it.
    default:
      return null
  }
}

/** Referrer down to host + path. The query string is where search engines and
    ad networks put identifiers, and it is not wanted here. */
function cleanRef(v: unknown): string | undefined {
  const raw = str(v, 300)
  if (!raw) return undefined
  try {
    const u = new URL(raw)
    return `${u.host}${u.pathname}`.slice(0, 120)
  } catch {
    return undefined
  }
}

function cleanCtx(raw: unknown): Rec | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Rec
  const out: Rec = {
    sw: int(c.sw, 0, 1e5) ?? 0,
    sh: int(c.sh, 0, 1e5) ?? 0,
    vw: int(c.vw, 0, 1e5) ?? 0,
    vh: int(c.vh, 0, 1e5) ?? 0,
    // Divided back out: the contract describes dpr as the ratio itself (2, 1.5),
    // and storing a scaled integer would make every reader remember a factor.
    dpr: (int(typeof c.dpr === 'number' ? c.dpr * 100 : NaN, 50, 1000) ?? 100) / 100,
    tz: str(c.tz, 40) ?? '',
    lang: str(c.lang, 20) ?? '',
    theme: c.theme === 'light' ? 'light' : 'dark',
    rm: c.rm === true,
  }
  const ref = cleanRef(c.ref)
  if (ref) out.ref = ref
  if (c.utm && typeof c.utm === 'object') {
    const utm: Record<string, string> = {}
    for (const [k, v] of Object.entries(c.utm as Rec).slice(0, 5)) {
      const val = str(v, 64)
      if (val && /^[a-z_]{1,20}$/.test(k)) utm[k] = val
    }
    if (Object.keys(utm).length) out.utm = utm
  }
  return out
}

// ── handler ──────────────────────────────────────────────────────────────────

/**
 * A single `onRequest` rather than `onRequestPost` plus a fallback.
 *
 * Pages resolves method-specific and catch-all exports from the same module in
 * an order this repo would rather not depend on, and a beacon that fell through
 * to the SPA's 404 would get HTML back with a 200-shaped cache story. One
 * export, one branch, no ambiguity.
 */
export const onRequest = async ({ request, env }: EventContext): Promise<Response> => {
  if (request.method !== 'POST') return done(405)

  // Browsers send Sec-Fetch-Site on every fetch and beacon. Its absence is not
  // proof of anything (older engines omit it), so Origin is the fallback rather
  // than an additional requirement.
  const site = request.headers.get('Sec-Fetch-Site')
  if (site) {
    if (site !== 'same-origin') return done(403)
  } else {
    const origin = request.headers.get('Origin')
    if (origin && new URL(request.url).origin !== origin) return done(403)
  }

  // Both checks, always, rather than the score when it exists and the UA
  // otherwise. That `else` was a bug: any environment that populates
  // botManagement with a benign default -- Bot Fight Mode, or miniflare during
  // local development, which scores every request 99 -- disabled the UA net
  // entirely, and a request announcing itself as GPTBot was stored. Found by
  // running the real Worker rather than a stub, which is the argument for doing
  // that. Both are backstops anyway: the tracker refuses to send anything
  // before a trusted input event.
  if (BOT_UA.test(request.headers.get('User-Agent') ?? '')) return done(204)
  const score = request.cf?.botManagement?.score
  if (typeof score === 'number' && score < 30) return done(204)

  const raw = await request.text()
  if (raw.length > MAX_BODY) return done(413)

  let body: Rec
  try {
    body = JSON.parse(raw) as Rec
  } catch {
    return done(400)
  }

  if (body.v !== PROTOCOL) return done(409)
  const sid = str(body.sid, 64)
  const seq = int(body.seq, 0, 100_000)
  if (!sid || sid.length < 8 || seq === null) return done(400)
  // Optional by design: absent when the visitor's browser will not store it, or
  // when they have opted out. A batch without one is still a good batch.
  const vid = body.vid === undefined ? null : str(body.vid, 64)
  if (vid !== null && vid.length < 8) return done(400)
  if (!Array.isArray(body.events) || !body.events.length) return done(400)

  const events = body.events
    .slice(0, MAX_EVENTS)
    .map(cleanEvent)
    .filter((e): e is Rec => e !== null)
  if (!events.length) return done(204)

  const ctx = body.ctx ? cleanCtx(body.ctx) : null
  const now = new Date()

  // One row per batch, not one per event.
  //
  // D1's free plan allows 50 queries per invocation and batch() is not exempt —
  // "limits for individual queries apply to each individual statement contained
  // within a batch statement". A beacon can carry sixty events, so per-event
  // inserts would fail intermittently, and would fail first on the busiest
  // sessions. The events ride as JSON and the nightly rollup unpacks them in
  // SQL, where the work is billed against D1's 30s query budget rather than the
  // free plan's 10ms of Worker CPU.
  // OR IGNORE against the unique (sid, seq) index: sendBeacon can deliver the
  // same payload twice, and the duplicate is dropped at the storage layer
  // rather than costing a read to detect.
  await env.ANALYTICS_DB.prepare(
    'INSERT OR IGNORE INTO batch (day, rcv, sid, vid, seq, ctx, events) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      now.toISOString().slice(0, 10),
      now.getTime(),
      sid,
      vid,
      seq,
      ctx ? JSON.stringify(ctx) : null,
      JSON.stringify(events),
    )
    .run()

  return done(204)
}
