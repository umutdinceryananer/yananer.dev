-- D1 schema for the first-party analytics collector.
--
-- Apply with:
--   npx wrangler d1 execute yananer-analytics --remote --file analytics/schema.sql
--
-- Phase 1 is this table and nothing else. The rollup tables the dashboard reads
-- arrive with the dashboard itself; until then `npm run stats` queries this
-- directly, which is affordable precisely because there is so little in it.

CREATE TABLE IF NOT EXISTS batch (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Server-stamped, both of them. A visitor's clock is routinely minutes out,
  -- and every `ts` inside `events` is an offset from session start for the same
  -- reason -- see the note at the top of src/lib/analytics/types.ts.
  day    TEXT    NOT NULL,          -- 'YYYY-MM-DD'
  rcv    INTEGER NOT NULL,          -- epoch ms
  sid    TEXT    NOT NULL,          -- per-tab, dies with the tab
  seq    INTEGER NOT NULL,          -- batch counter; (sid, seq) dedupes a retried beacon
  ctx    TEXT,                      -- JSON, first batch of a session only
  events TEXT    NOT NULL           -- JSON array, already validated by the collector
);

-- Two indexes, and no more.
--
-- D1 counts an index write as an extra row written on every insert that touches
-- the indexed column, so each one here is a standing tax on ingest: three rows
-- written per batch instead of one. At this site's volume that is ~7k of the
-- free plan's 100k daily writes, which is affordable -- but only because the
-- list stops at two. Indexing `rcv` as well, the reflex, would pay it again to
-- speed up a query nothing runs.
--
-- `day` earns it twice over: it is what the nightly rollup groups by and what
-- the retention DELETE ranges over, and both would otherwise scan the table.
CREATE INDEX IF NOT EXISTS batch_day ON batch (day);

-- (sid, seq) earns it by making a retried beacon harmless. sendBeacon can
-- genuinely deliver the same payload twice, and a duplicate inflates every
-- count derived from it. The collector inserts with OR IGNORE, so the second
-- copy is dropped at the storage layer rather than needing a read first.
CREATE UNIQUE INDEX IF NOT EXISTS batch_sid_seq ON batch (sid, seq);
