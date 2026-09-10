/**
 * The questions this system exists to answer, as SQL.
 *
 * A TypeScript module rather than the .sql file it used to be, because the
 * dashboard Worker cannot read a file at runtime -- and two copies of these
 * queries, one for the Worker and one for the terminal, is precisely the drift
 * the rest of this feature is built to avoid. One source, imported by both.
 *
 * Every query unpacks the JSON `events` column with json_each. That is
 * affordable while the table is small: D1 bills a scan as one row read per row
 * scanned, so once this is measured in months rather than days the nightly
 * rollup has to take over. Watch the row counts in Q0.
 */

export type Row = Record<string, unknown>

/** A query and whatever came back for it. */
export interface Section extends Query {
  rows: Row[]
  /** Set when the query failed. The caller is expected to surface it: a report
      that quietly drops a third of itself looks exactly like a complete one. */
  error?: string
}

export const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0)

export interface Query {
  /** Shown as the panel heading and the terminal section title. */
  title: string
  sql: string
}

export const QUERIES: Query[] = [
  {
    title: "Q0. Is anything arriving at all, and how much of the free tier is it?",
    sql: `SELECT
  'batches'          AS metric, COUNT(*)              AS value FROM batch
UNION ALL SELECT
  'sessions',              COUNT(DISTINCT sid)              FROM batch
UNION ALL SELECT
  'days',                  COUNT(DISTINCT day)              FROM batch
UNION ALL SELECT
  'first day',             COALESCE(MIN(day), '-')          FROM batch
UNION ALL SELECT
  'last day',              COALESCE(MAX(day), '-')          FROM batch`,
  },
  {
    title: "Q1. Does anyone press Work?",
    sql: `SELECT
  COUNT(DISTINCT sid)                                            AS sessions,
  COUNT(DISTINCT CASE WHEN route = 'work' THEN sid END)          AS reached_work,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN route = 'work' THEN sid END)
    / NULLIF(COUNT(DISTINCT sid), 0), 1)                         AS pct_work
FROM (
  SELECT b.sid AS sid, json_extract(e.value, '$.r') AS route
  FROM batch b, json_each(b.events) e
  WHERE json_extract(e.value, '$.t') = 'view'
)`,
  },
  {
    title: "Q2. How does that break down by day?",
    sql: `SELECT
  b.day,
  json_extract(e.value, '$.r')  AS route,
  COUNT(DISTINCT b.sid)         AS sessions,
  COUNT(*)                      AS views
FROM batch b, json_each(b.events) e
WHERE json_extract(e.value, '$.t') = 'view'
GROUP BY b.day, route
ORDER BY b.day DESC, route`,
  },
  {
    title: "Q2b. Does anyone come back?",
    sql: `SELECT
  COUNT(*)                                          AS browsers,
  SUM(CASE WHEN visits = 1 THEN 1 ELSE 0 END)       AS visited_once,
  SUM(CASE WHEN visits > 1 THEN 1 ELSE 0 END)       AS came_back,
  MAX(visits)                                       AS most_visits,
  MAX(span_days)                                    AS longest_gap_days
FROM (
  SELECT
    vid,
    COUNT(DISTINCT sid)                             AS visits,
    CAST(julianday(MAX(day)) - julianday(MIN(day)) AS INT) AS span_days
  FROM batch
  WHERE vid IS NOT NULL
  GROUP BY vid
)`,
  },
  {
    title: "Q3. How far down does anyone get, and how long do they really read?",
    sql: `SELECT
  json_extract(e.value, '$.r')                              AS route,
  CASE WHEN json_extract(e.value, '$.vw') < 745
       THEN 'phone' ELSE 'desktop' END                      AS viewport,
  COUNT(*)                                                  AS leaves,
  CAST(AVG(json_extract(e.value, '$.sd')) AS INT)           AS avg_scroll_pct,
  CAST(AVG(json_extract(e.value, '$.ams')) / 1000 AS INT)   AS avg_active_s,
  CAST(AVG(json_extract(e.value, '$.ms'))  / 1000 AS INT)   AS avg_wall_s,
  SUM(CASE WHEN json_extract(e.value, '$.hc') > 0 THEN 1 ELSE 0 END) AS height_moved
FROM batch b, json_each(b.events) e
WHERE json_extract(e.value, '$.t') = 'leave'
GROUP BY route, viewport
ORDER BY route, viewport`,
  },
  {
    title: "Q4. Which named things happened?",
    sql: `SELECT
  json_extract(e.value, '$.n')  AS action,
  json_extract(e.value, '$.r')  AS route,
  COUNT(*)                      AS n,
  COUNT(DISTINCT b.sid)         AS sessions
FROM batch b, json_each(b.events) e
WHERE json_extract(e.value, '$.t') = 'action'
GROUP BY action, route
ORDER BY n DESC`,
  },
  {
    title: "Q5. Which project earns the click?",
    sql: `SELECT
  json_extract(e.value, '$.s')  AS target,
  COUNT(*)                      AS clicks,
  COUNT(DISTINCT b.sid)         AS sessions
FROM batch b, json_each(b.events) e
WHERE json_extract(e.value, '$.t') = 'click'
GROUP BY target
ORDER BY clicks DESC`,
  },
  {
    title: "Q6. Where does the contact form lose people?",
    sql: `SELECT
  json_extract(e.value, '$.f')  AS field,
  json_extract(e.value, '$.a')  AS action,
  COUNT(*)                      AS n,
  COUNT(DISTINCT b.sid)         AS sessions
FROM batch b, json_each(b.events) e
WHERE json_extract(e.value, '$.t') = 'field'
GROUP BY field, action
ORDER BY field, action`,
  },
  {
    title: "Q7. Did anything break in front of a visitor?",
    sql: `SELECT
  json_extract(e.value, '$.m')    AS message,
  json_extract(e.value, '$.src')  AS source,
  json_extract(e.value, '$.ln')   AS line,
  COUNT(*)                        AS n,
  COUNT(DISTINCT b.sid)           AS sessions
FROM batch b, json_each(b.events) e
WHERE json_extract(e.value, '$.t') = 'err'
GROUP BY message, source, line
ORDER BY n DESC`,
  },
  {
    title: "Q8. Where do people click and click and nothing happens?",
    sql: `WITH clicks AS (
  SELECT
    b.sid                         AS sid,
    json_extract(e.value, '$.s')  AS target,
    json_extract(e.value, '$.ts') AS ts
  FROM batch b, json_each(b.events) e
  WHERE json_extract(e.value, '$.t') = 'click'
)
SELECT target, COUNT(*) AS bursts, COUNT(DISTINCT sid) AS sessions
FROM (
  SELECT sid, target, ts,
         LAG(ts, 2) OVER (PARTITION BY sid, target ORDER BY ts) AS third_last
  FROM clicks
)
WHERE third_last IS NOT NULL AND ts - third_last <= 1000
GROUP BY target
ORDER BY bursts DESC`,
  },
]
