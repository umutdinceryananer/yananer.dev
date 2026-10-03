/**
 * The analytics, as an MCP server, at stats.yananer.dev/mcp.
 *
 * The dashboard answers questions nobody goes and asks it. This lets the
 * question come from wherever the owner already is -- a Claude chat, on a
 * laptop or a phone -- and get an answer in a sentence instead of a page of
 * panels. Same queries, same database, same password: it is a third way of
 * reading what the dashboard and `npm run stats` read, not a second dataset.
 *
 * ── Why it is written by hand ────────────────────────────────────────────────
 *
 * This Worker has no dependencies, and the protocol it needs here is small:
 * stateless Streamable HTTP, where every POST is one JSON-RPC message and every
 * answer is plain JSON. No sessions, no server-sent events, no Durable Object.
 * The SDK that mcp/ uses earns its weight there, where tools stream and sessions
 * hold state. Here it would be a dependency tree to answer four methods.
 *
 * ── Why it is not on mcp.yananer.dev ─────────────────────────────────────────
 *
 * That server is public by design -- anyone's assistant can connect to it and
 * read the portfolio. Putting visitor data on it would publish that too. This
 * one sits behind the same check as the dashboard, in the same Worker, so there
 * is exactly one door to the numbers and one password on it.
 */

import { QUERIES, num, type Row } from './queries'
import { label } from './labels'
import type { D1Database } from './worker'

/** Newest first. An initialize asking for one of these gets it back; anything
    else gets the newest, and the client decides whether it can speak that. */
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05']

const SERVER = { name: 'yananer-stats', version: '1.0.0' }

/** Caps on what a tool hands back. A chat answer built from four hundred rows
    is not more informative than one built from twenty, only slower. */
const MAX_ROWS = 25

const INSTRUCTIONS = `Private analytics for yananer.dev, the owner's personal portfolio site.

Use site_summary for "how is the site doing", "anything this week" and similar -- it answers in a few numbers against the previous period. Use site_report only when a specific detail is asked for.

Traffic is small: a handful of visits a week is normal, and the owner's own visits are counted too. Say what the numbers are plainly; do not dress small numbers up as trends. A "session" is one browser tab, not one person.`

// ── JSON-RPC plumbing ────────────────────────────────────────────────────────

interface Message {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

type Reply = { jsonrpc: '2.0'; id: string | number | null } & (
  | { result: unknown }
  | { error: { code: number; message: string } }
)

const ok = (id: Message['id'], result: unknown): Reply => ({ jsonrpc: '2.0', id: id ?? null, result })
const fail = (id: Message['id'], code: number, message: string): Reply => ({
  jsonrpc: '2.0',
  id: id ?? null,
  error: { code, message },
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // One person's private numbers. See the same header on the dashboard.
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
    },
  })

/** Handles one HTTP request to /mcp. The caller has already checked the password. */
export async function handleMcp(request: Request, db: D1Database): Promise<Response> {
  // POST only. GET is how a client asks for a server-sent event stream, and
  // there is nothing here to stream; 405 is the answer the spec names for that.
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST' } })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(fail(null, -32700, 'Parse error'))
  }

  // Batches were dropped from the protocol in 2025-06-18 but older clients may
  // still send one, and answering it costs a map.
  const messages = (Array.isArray(body) ? body : [body]) as Message[]
  const replies: Reply[] = []
  for (const m of messages) {
    const reply = await dispatch(m, db)
    if (reply) replies.push(reply)
  }

  // Only notifications in the request: nothing to say back, and 202 is what
  // the transport defines for exactly that.
  if (!replies.length) return new Response(null, { status: 202 })
  return json(Array.isArray(body) ? replies : replies[0])
}

async function dispatch(m: Message, db: D1Database): Promise<Reply | null> {
  if (!m || typeof m !== 'object' || typeof m.method !== 'string') {
    return fail(m?.id, -32600, 'Invalid request')
  }
  // No id means a notification (initialized, cancelled, ...). None of them
  // need anything from a stateless server, and none of them get a reply.
  if (m.id === undefined) return null

  switch (m.method) {
    case 'initialize': {
      const asked = String(m.params?.protocolVersion ?? '')
      return ok(m.id, {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: {} },
        serverInfo: SERVER,
        instructions: INSTRUCTIONS,
      })
    }
    case 'ping':
      return ok(m.id, {})
    case 'tools/list':
      return ok(m.id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: t.annotations,
        })),
      })
    case 'tools/call': {
      const name = String(m.params?.name ?? '')
      const tool = TOOLS.find((t) => t.name === name)
      if (!tool) return fail(m.id, -32602, `Unknown tool: ${name}`)
      const args = (m.params?.arguments ?? {}) as Record<string, unknown>
      try {
        const out = await tool.run(args, db)
        return ok(m.id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out })
      } catch (err) {
        // A tool that failed is a result the model should see and explain, not
        // a protocol error the client swallows -- the spec draws the line there.
        const message = err instanceof Error ? err.message : String(err)
        return ok(m.id, { content: [{ type: 'text', text: `Query failed: ${message}` }], isError: true })
      }
    }
    default:
      return fail(m.id, -32601, `Method not found: ${m.method}`)
  }
}

// ── Tools ────────────────────────────────────────────────────────────────────

interface Tool {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations: Record<string, unknown>
  run(args: Record<string, unknown>, db: D1Database): Promise<Record<string, unknown>>
}

/** 'YYYY-MM-DD', in UTC -- the same clock the collector stamps `day` with. */
const isoDay = (msAgo: number) => new Date(Date.now() - msAgo).toISOString().slice(0, 10)
const DAY_MS = 24 * 60 * 60 * 1000

async function rows(db: D1Database, sql: string, ...bind: unknown[]): Promise<Row[]> {
  const { results } = await db.prepare(sql).bind(...bind).all()
  return results ?? []
}

/** The headline numbers for one window [from, to). `to` is exclusive so the
    current window can run to the end of today without naming tomorrow. */
async function periodCounts(db: D1Database, from: string, to: string) {
  const [counts] = await rows(
    db,
    `SELECT COUNT(DISTINCT sid) AS sessions, COUNT(DISTINCT vid) AS browsers
     FROM batch
     WHERE day >= ?1 AND day < ?2`,
    from,
    to,
  )
  // Came back = this browser has more than one visit on record by the end of
  // the period, counting visits before it. The same definition as Q2b on the
  // dashboard, so the two never disagree; the first version only counted
  // browsers known from *before* the period, and a reader who visited twice in
  // the same week was missed.
  const [back] = await rows(
    db,
    `SELECT COUNT(*) AS came_back FROM (
       SELECT b.vid FROM batch b
       WHERE b.vid IS NOT NULL AND b.day >= ?1 AND b.day < ?2
       GROUP BY b.vid
       HAVING (SELECT COUNT(DISTINCT p.sid) FROM batch p WHERE p.vid = b.vid AND p.day < ?2) > 1
     )`,
    from,
    to,
  )
  const [work] = await rows(
    db,
    `SELECT COUNT(DISTINCT b.sid) AS sessions
     FROM batch b, json_each(b.events) e
     WHERE b.day >= ?1 AND b.day < ?2
       AND json_extract(e.value, '$.t') = 'view'
       AND json_extract(e.value, '$.r') = 'work'`,
    from,
    to,
  )
  return {
    sessions: num(counts?.sessions),
    browsers: num(counts?.browsers),
    cameBack: num(back?.came_back),
    openedWork: num(work?.sessions),
  }
}

const siteSummary: Tool = {
  name: 'site_summary',
  title: 'Site summary',
  description:
    'How yananer.dev did over the last N days (default 7), against the N days before: visits, browsers, how many came back, how many opened the Work page, where visitors came from, what they clicked, how long they read, and anything that broke. Start here for any general question about the site.',
  inputSchema: {
    type: 'object',
    properties: {
      days: {
        type: 'integer',
        minimum: 1,
        maximum: 45,
        default: 7,
        description: 'Length of the period, ending today. 45 at most: raw data is kept for 90 days, and the comparison needs a second period of the same length.',
      },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, openWorldHint: false },

  run: (args, db) => summarize(db, Math.min(45, Math.max(1, Math.round(Number(args.days ?? 7)) || 7))),
}

/** The last `days` days against the `days` before. Shared by site_summary and
    the weekly push, so the notification and the chat answer cannot disagree. */
export async function summarize(db: D1Database, days: number) {
  const tomorrow = isoDay(-DAY_MS)
  const from = isoDay((days - 1) * DAY_MS)
  const prevFrom = isoDay((2 * days - 1) * DAY_MS)

  const [now, before] = await Promise.all([periodCounts(db, from, tomorrow), periodCounts(db, prevFrom, from)])

  const sources = await rows(
    db,
    `SELECT
       CASE
         WHEN json_extract(ctx, '$.utm.source') IS NOT NULL
           THEN json_extract(ctx, '$.utm.source') || ' (utm)'
         WHEN COALESCE(json_extract(ctx, '$.ref'), '') = '' THEN 'typed or bookmarked'
         ELSE substr(json_extract(ctx, '$.ref'), 1, instr(json_extract(ctx, '$.ref') || '/', '/') - 1)
       END AS source,
       COUNT(DISTINCT sid) AS sessions
     FROM batch
     WHERE ctx IS NOT NULL AND day >= ?1
     GROUP BY source ORDER BY sessions DESC LIMIT 5`,
    from,
  )
  const clicks = await rows(
    db,
    `SELECT json_extract(e.value, '$.s') AS target, COUNT(*) AS clicks
     FROM batch b, json_each(b.events) e
     WHERE b.day >= ?1 AND json_extract(e.value, '$.t') = 'click'
     GROUP BY target ORDER BY clicks DESC LIMIT 8`,
    from,
  )
  const [reading] = await rows(
    db,
    `SELECT
       CAST(AVG(json_extract(e.value, '$.ams')) / 1000 AS INT) AS active_s,
       CAST(AVG(json_extract(e.value, '$.sd')) AS INT)         AS scroll_pct
     FROM batch b, json_each(b.events) e
     WHERE b.day >= ?1 AND json_extract(e.value, '$.t') = 'leave'`,
    from,
  )
  const errors = await rows(
    db,
    `SELECT json_extract(e.value, '$.m') AS message, COUNT(*) AS times
     FROM batch b, json_each(b.events) e
     WHERE b.day >= ?1 AND json_extract(e.value, '$.t') = 'err'
     GROUP BY message ORDER BY times DESC LIMIT 5`,
    from,
  )

  return {
    period: { days, from, to: isoDay(0) },
    visits: { thisPeriod: now.sessions, previousPeriod: before.sessions },
    browsers: { thisPeriod: now.browsers, cameBack: now.cameBack },
    openedWorkPage: { thisPeriod: now.openedWork, previousPeriod: before.openedWork },
    reading:
      reading?.active_s == null
        ? null
        : { averageActiveSeconds: num(reading.active_s), averageScrollPercent: num(reading.scroll_pct) },
    sources: sources.map((r) => ({ source: String(r.source), visits: num(r.sessions) })),
    topClicks: clicks.map((r) => ({ what: label(String(r.target)), clicks: num(r.clicks) })),
    errors: errors.map((r) => ({ message: String(r.message), times: num(r.times) })),
    notes: [
      'A visit is one browser tab. The owner’s own visits count too, except from browsers opted out with yananer.dev/?notrack.',
      'browsers counts only visitors whose browser kept the id; storage-blocked visits are visits without one.',
    ],
  }
}

const QUESTION_LIST = QUERIES.map((q) => q.title).join('\n')

/** "Q5" from "Q5. Which project earns the click?" */
const questionId = (title: string) => title.slice(0, title.indexOf('.')).trim()

const siteReport: Tool = {
  name: 'site_report',
  title: 'Site report',
  description: `The full analytics questions, over all retained data (90 days), exactly as the dashboard shows them. Use only when site_summary does not answer what was asked. Pass the ids you need; omit to get all of them.\n\n${QUESTION_LIST}`,
  inputSchema: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Question ids such as "Q5" or "Q2b". Omit for all.',
      },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, openWorldHint: false },

  async run(args, db) {
    const wanted = Array.isArray(args.questions)
      ? new Set(args.questions.map((q) => String(q).trim().toUpperCase()))
      : null
    const chosen = QUERIES.filter((q) => !wanted || wanted.has(questionId(q.title).toUpperCase()))
    if (!chosen.length) throw new Error(`No question matches. Known ids: ${QUERIES.map((q) => questionId(q.title)).join(', ')}`)

    const sections = []
    for (const q of chosen) {
      try {
        const { results } = await db.prepare(q.sql).all()
        const all = results ?? []
        sections.push({
          question: q.title,
          // Click targets are stored as the attribute name; the dashboard shows
          // them by their label, and so should this.
          rows: all.slice(0, MAX_ROWS).map((r) => ('target' in r ? { ...r, target: label(String(r.target)) } : r)),
          ...(all.length > MAX_ROWS ? { truncated: `${all.length - MAX_ROWS} more rows not shown` } : {}),
        })
      } catch (err) {
        sections.push({ question: q.title, error: err instanceof Error ? err.message : String(err) })
      }
    }
    return { sections }
  },
}

const TOOLS: Tool[] = [siteSummary, siteReport]
