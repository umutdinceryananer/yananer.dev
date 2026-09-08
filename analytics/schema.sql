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
  -- Per-browser, survives the visit, and the only durable identifier here.
  -- Nullable on purpose: it is sent on a session's first batch only, and is
  -- absent entirely when the visitor's browser will not store it or they have
  -- opted out. Most rows in this table have no vid and that is correct.
  vid    TEXT,
  seq    INTEGER NOT NULL,          -- batch counter; (sid, seq) dedupes a retried beacon
  ctx    TEXT,                      -- JSON, first batch of a session only
  events TEXT    NOT NULL           -- JSON array, already validated by the collector
);

-- Three indexes, and the third costs almost nothing.
--
-- D1 counts an index write as an extra row written on every insert that touches
-- the indexed column, so each one here is a standing tax on ingest. The first
-- two apply to every batch: three rows written instead of one, about 7k of the
-- free plan's 100k daily writes. The third is partial and applies to roughly one
-- batch per session. Indexing `rcv` as well, the reflex, would pay the full tax
-- again to speed up a query nothing runs.
--
-- `day` earns it twice over: it is what the nightly rollup groups by and what
-- the retention DELETE ranges over, and both would otherwise scan the table.
CREATE INDEX IF NOT EXISTS batch_day ON batch (day);

-- (sid, seq) earns it by making a retried beacon harmless. sendBeacon can
-- genuinely deliver the same payload twice, and a duplicate inflates every
-- count derived from it. The collector inserts with OR IGNORE, so the second
-- copy is dropped at the storage layer rather than needing a read first.
CREATE UNIQUE INDEX IF NOT EXISTS batch_sid_seq ON batch (sid, seq);

-- Partial, and that is what makes it nearly free.
--
-- `vid` is set on one row per session and NULL on every other, so a plain index
-- would tax every insert to index a column that is usually empty. SQLite leaves
-- rows failing the WHERE clause out of the index entirely, so this costs a write
-- only on the batches that actually carry an id -- while still making
-- "how many visits does this browser have" a lookup rather than a scan.
CREATE INDEX IF NOT EXISTS batch_vid ON batch (vid) WHERE vid IS NOT NULL;
