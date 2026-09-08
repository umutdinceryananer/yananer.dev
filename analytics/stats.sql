-- The Phase 1 dashboard, which is a terminal.
--
--   npm run stats
--
-- There is no web dashboard yet on purpose: a dashboard built before any data
-- exists is a dashboard designed around guesses. These queries answer the
-- questions the system was actually built for, and the shape of their answers
-- is what the real dashboard should be designed from.
--
-- Every query unpacks the JSON `events` column with json_each. That is
-- affordable only while the table is small -- D1 bills a scan as one row read
-- per row scanned, so once this is measured in months rather than days the
-- nightly rollup tables have to take over. Watch the row counts in Q0.

-- ── Q0. Is anything arriving at all, and how much of the free tier is it? ────
SELECT
  'batches'          AS metric, COUNT(*)              AS value FROM batch
UNION ALL SELECT
  'sessions',              COUNT(DISTINCT sid)              FROM batch
UNION ALL SELECT
  'days',                  COUNT(DISTINCT day)              FROM batch
UNION ALL SELECT
  'first day',             COALESCE(MIN(day), '-')          FROM batch
UNION ALL SELECT
  'last day',              COALESCE(MAX(day), '-')          FROM batch;

-- ── Q1. Does anyone press Work? ─────────────────────────────────────────────
--
-- The question this whole system exists for. Cloudflare Web Analytics counts
-- document loads, and moving between these two views is a hashchange, so this
-- number has never existed for this site.
--
-- Sessions, not views: a tab-switch ends a view and returns opens a new one
-- (see the visibilitychange note in tracker.ts), so raw view counts overstate
-- reach and distinct sids do not.
SELECT
  COUNT(DISTINCT sid)                                            AS sessions,
  COUNT(DISTINCT CASE WHEN route = 'work' THEN sid END)          AS reached_work,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN route = 'work' THEN sid END)
    / NULLIF(COUNT(DISTINCT sid), 0), 1)                         AS pct_work
FROM (
  SELECT b.sid AS sid, json_extract(e.value, '$.r') AS route
  FROM batch b, json_each(b.events) e
  WHERE json_extract(e.value, '$.t') = 'view'
);

-- ── Q2. How does that break down by day? ────────────────────────────────────
--
-- Read the trend, never a single day against the one before it: at this volume
-- Poisson noise alone is roughly plus or minus a third, so a day-over-day
-- change smaller than that is indistinguishable from nothing happening.
SELECT
  b.day,
  json_extract(e.value, '$.r')  AS route,
  COUNT(DISTINCT b.sid)         AS sessions,
  COUNT(*)                      AS views
FROM batch b, json_each(b.events) e
WHERE json_extract(e.value, '$.t') = 'view'
GROUP BY b.day, route
ORDER BY b.day DESC, route;

-- ── Q2b. Does anyone come back? ─────────────────────────────────────────────
--
-- The reason `vid` exists. Counted over browsers that reported one -- a visitor
-- whose browser refuses storage, or who has opted out, sends no vid and simply
-- is not in this table. So read `browsers` as "browsers we could count", not as
-- "everyone", and expect it to sit below the session count in Q1.
--
-- Give this months before believing the shape of it. A returning visitor is by
-- definition someone who came back later, so early data undercounts by exactly
-- the people who have not returned yet.
SELECT
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
);

-- ── Q3. How far down does anyone get, and how long do they really read? ─────
--
-- `ams` excludes time the tab was hidden, time with a dialog open and time with
-- no input at all, so it is the honest number and it will be much smaller than
-- wall time. `hc` counts mid-session document height changes: rows where it is
-- non-zero had a moving denominator under their scroll depth (ShowMore, on
-- phones) and should be read with that in mind.
SELECT
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
ORDER BY route, viewport;

-- ── Q4. Which named things happened? ────────────────────────────────────────
--
-- Counts, deliberately, and never a percentage: a rate whose denominator is
-- under a hundred sessions reads as precision the data does not have.
SELECT
  json_extract(e.value, '$.n')  AS action,
  json_extract(e.value, '$.r')  AS route,
  COUNT(*)                      AS n,
  COUNT(DISTINCT b.sid)         AS sessions
FROM batch b, json_each(b.events) e
WHERE json_extract(e.value, '$.t') = 'action'
GROUP BY action, route
ORDER BY n DESC;
