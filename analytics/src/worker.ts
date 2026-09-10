/**
 * The dashboard, at stats.yananer.dev.
 *
 * Serves the same page `npm run dashboard` writes to a file, rendered by the
 * same function against the same queries. The local form stays because it needs
 * no login and no deploy; this one exists so the numbers can be looked at from
 * a phone.
 *
 * It also carries the nightly job, which is why the dashboard and the retention
 * delete live in one Worker rather than two: a Pages Function cannot have a cron
 * trigger, and a second Worker for one DELETE would be a second deploy to
 * remember.
 *
 * ── On being readable by anyone ──────────────────────────────────────────────
 *
 * This page is behind Cloudflare Access. Access is configured in the Zero Trust
 * dashboard, not here, so this Worker cannot depend on it having been done --
 * and a deploy that lands before the policy does would publish the site's
 * analytics to anyone who guesses the hostname.
 *
 * So it fails closed. Without the header Access injects on an authenticated
 * request, nothing is served. That is a guard against being deployed naked, not
 * a verification of the token: Access terminates in front of this Worker and the
 * header cannot reach it from outside, provided nothing else can. Which is why
 * `workers_dev = false` in wrangler.toml is load-bearing rather than tidiness --
 * a *.workers.dev hostname would route straight here, around the policy.
 */

import { QUERIES, type Row, type Section } from './queries'
import { renderDashboard } from './render'

/** The slice of D1 used here, declared rather than imported so this package
    needs no types dependency -- the same trade mcp/src/worker.ts makes. */
interface D1PreparedStatement {
  all<T = Row>(): Promise<{ results?: T[] }>
  run(): Promise<{ meta?: { changes?: number } }>
}
interface D1Database {
  prepare(query: string): D1PreparedStatement
}

export interface Env {
  ANALYTICS_DB: D1Database
}

/** Set by Access on every authenticated request, and impossible to forge from
    outside a zone where Access is in front. */
const ACCESS_HEADER = 'Cf-Access-Authenticated-User-Email'

/** How long raw batches are kept. The privacy notice says this number, so the
    two have to agree -- it is the only reason the sentence is allowed back. */
const RETENTION_DAYS = 90

const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Never cached anywhere: it is one person's private numbers, and a shared
      // cache in front of an Access-protected origin is how they stop being
      // private.
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
    },
  })

const NOT_CONFIGURED = `<!doctype html><meta charset="utf-8">
<title>Not configured</title>
<style>body{background:#050505;color:#c6c6c6;font:15px/1.6 system-ui,sans-serif;
margin:0;padding:4rem 1.5rem;max-width:34rem;margin:0 auto}
h1{color:#fff;font-size:1.1rem}code{background:#171717;padding:.1rem .35rem;border-radius:4px}
p{color:#a3a3a3;font-size:.9rem}</style>
<h1>This dashboard is not protected yet</h1>
<p>Nothing is served until Cloudflare Access is in front of it. Create an Access
application for this hostname in Zero Trust, then reload.</p>
<p>Attach the custom domain first and create the policy second — Cloudflare will
not add a domain that already has one.</p>`

async function runAll(db: D1Database): Promise<Section[]> {
  // Sequential rather than Promise.all: ten concurrent statements against one
  // D1 binding buys nothing at this size and makes a failure harder to place.
  const out: Section[] = []
  for (const q of QUERIES) {
    try {
      const { results } = await db.prepare(q.sql).all()
      out.push({ ...q, rows: results ?? [] })
    } catch (err) {
      out.push({ ...q, rows: [], error: err instanceof Error ? err.message : String(err) })
    }
  }
  return out
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (request.method !== 'GET') return html('', 405)
    if (pathname !== '/') return html('', 404)
    if (!request.headers.get(ACCESS_HEADER)) return html(NOT_CONFIGURED, 403)

    const sections = await runAll(env.ANALYTICS_DB)
    return html(
      renderDashboard(sections, {
        generated: new Date().toISOString().replace('T', ' ').slice(0, 16),
        source: 'the production D1 database',
      }),
    )
  },

  /**
   * The nightly job.
   *
   * One statement, and it has to stay that way: the Workers free plan gives a
   * scheduled handler 10ms of CPU, so anything that pulled rows into JavaScript
   * to decide what to drop would be killed halfway. Expressed as SQL, the work
   * happens inside D1's own 30s query budget and this handler does nothing but
   * wait.
   *
   * Rollup tables are deliberately not here yet. They matter when the raw table
   * is large enough that scanning it costs real read quota, and at this site's
   * traffic that is years away -- the dashboard prints the row count so the day
   * it stops being true is visible rather than inferred.
   */
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    // Interpolated rather than bound: SQLite takes date() modifiers as literal
    // arguments, and RETENTION_DAYS is a number in this file -- there is no
    // input here to be careful about.
    const result = await env.ANALYTICS_DB.prepare(
      `DELETE FROM batch WHERE day < date('now', '-${RETENTION_DAYS} day')`,
    ).run()
    const dropped = result?.meta?.changes ?? 0
    if (dropped) console.log(`retention: dropped ${dropped} batch row(s) older than ${RETENTION_DAYS} days`)
  },
}

/** Minimal shape of what Cloudflare passes a scheduled handler. */
interface ScheduledController {
  scheduledTime: number
  cron: string
}
