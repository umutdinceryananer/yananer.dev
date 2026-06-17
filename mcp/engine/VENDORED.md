# Vendored engine

Pure-TS Iterated Prisoner's Dilemma engine copied from the public repo
**umutdinceryananer/My-Game-Theory-Lab** so the MCP `run_tournament` tool can run real
tournaments headlessly (no browser/DOM, zero npm deps).

- **Source:** https://github.com/umutdinceryananer/My-Game-Theory-Lab
- **Commit:** `7bc82f3305fb22459bf9f0b3d8af1ab09da454e9`
- **Copied, then trimmed to the tournament path only:** `src/core/{tournament,game,types,random}.ts`,
  `src/strategies/*.ts` (the 12 classic strategies + `index.ts`), `src/lib/rating/elo.ts`.

## Modifications
1. **Alias rewrite** — the source uses Vite's `@/` alias; rewritten to relative:
   - `core/tournament.ts`: `@/lib/rating/elo` → `../lib/rating/elo`
2. **Trimmed** — removed the evolution + genetic subset (`core/evolution.ts`,
   `core/evolutionEngine.ts`, `strategies/genetic/**`) since `run_tournament` doesn't use it;
   `strategies/index.ts` now exports only `baseStrategies` (the 12 classic strategies — no
   `introductoryGenetic` / `defaultStrategies`). This also drops the genetic/evolution `@/`
   imports entirely.

## Refreshing
Re-copy `core/{tournament,game,types,random}.ts`, `strategies/*.ts`, `lib/rating/elo.ts` at a
newer commit; re-apply the single `@/lib/rating/elo` rewrite in `tournament.ts`; and re-trim
`strategies/index.ts` to `baseStrategies`. Zero npm deps, so a refresh is mechanical.
