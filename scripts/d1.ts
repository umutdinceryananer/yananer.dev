// Running the shared queries against D1 from a terminal.
//
// The queries themselves live in analytics/src/queries.ts, imported rather than
// parsed out of a .sql file, so the dashboard Worker and this script cannot end
// up asking different questions. `wrangler d1 execute --file` is not usable for
// the file form anyway: given six statements it reported "2 commands executed
// successfully" and skipped the rest without a word.

import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { QUERIES, type Row, type Section } from '../analytics/src/queries'

/**
 * npx, as something this Node can execute directly.
 *
 * On Windows npx is npx.cmd, and since Node 20 execFileSync refuses to run a
 * .cmd without a shell. A shell is the one thing that must not be involved
 * here: the SQL travels across as an argument, and handing it to cmd.exe means
 * trusting cmd.exe's quoting rules with a string full of quotes and asterisks.
 * What npx.cmd runs is plain JavaScript sitting beside the node binary, so this
 * runs that instead, and the same path works on every platform.
 *
 * Until this was fixed, every query here failed with ENOENT on Windows -- so
 * `npm run stats` and `npm run dashboard` had only ever worked on a Mac.
 */
function wranglerCli(): string[] {
  // An installed copy, if there is one. mcp/ already depends on wrangler to
  // deploy itself, so on a machine that has run `npm ci` there it is right
  // here -- one process instead of npx's two, and no download on first use.
  const local = join('mcp', 'node_modules', 'wrangler', 'bin', 'wrangler.js')
  if (existsSync(local)) return [local]

  // Otherwise npx fetches it. Not npx.cmd: since Node 20, execFileSync refuses
  // to run a .cmd without a shell, and a shell must not be involved here --
  // the SQL travels as an argument and cmd.exe would have to be trusted to
  // quote it. What npx.cmd runs is plain JavaScript beside the node binary.
  const dir = dirname(process.execPath)
  const npx = [
    join(dir, 'node_modules', 'npm', 'bin', 'npx-cli.js'),              // Windows
    join(dir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js'), // Unix
  ].find((p) => existsSync(p))
  if (!npx) throw new Error(`could not find npx-cli.js beside ${process.execPath}`)
  return [npx, '--yes', 'wrangler@4']
}

const CONFIG = 'analytics/wrangler.toml'

/**
 * Arguments passed through to wrangler, defaulting to --remote.
 *
 * Production is the default because that is where the data anyone wants to read
 * lives; `-- --local --persist-to <dir>` reaches a development database.
 */
export function wranglerArgs(argv: string[]): string[] {
  const explicit = argv.some((a) => a === '--local' || a === '--remote')
  return [...(explicit ? [] : ['--remote']), ...argv]
}

export function query(sql: string, args: string[]): Row[] {
  // npx rather than a devDependency: the site's build never needs wrangler, and
  // installing it would add weight to every Cloudflare Pages build for the sake
  // of two commands run by hand. Pinned to a major so a future release cannot
  // change the flags underneath this.
  const raw = execFileSync(
    process.execPath,
    [...wranglerCli(), 'd1', 'execute', 'ANALYTICS_DB', '--config', CONFIG, ...args, '--json', '--command', sql],
    {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      // Not inherited. Handing this child the parent's stdin crashed Node on
      // Windows -- "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)",
      // thrown by libuv itself, once per query. Nothing here reads stdin.
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  // wrangler prints a banner before the JSON on some paths; take from the first
  // bracket rather than assuming the whole of stdout parses.
  const start = raw.indexOf('[')
  if (start < 0) throw new Error(`no JSON in wrangler output: ${raw.slice(0, 200)}`)
  return (JSON.parse(raw.slice(start)) as { results?: Row[] }[]).flatMap((r) => r.results ?? [])
}

/**
 * Why a query failed, in wrangler's own words.
 *
 * execFileSync's message is the command line and nothing else, so taking its
 * first line reported every failure as "Command failed: node ... --command
 * SELECT" -- the flags, truncated at the SQL, with the reason nowhere in it.
 * Wrangler writes the reason to stderr, which is right here on the error.
 */
/** Terminal colour codes. Built from the char code, and with [[] for the bracket,
    because a literal escape in a regex is what no-control-regex exists to catch. */
const ANSI = new RegExp(`${String.fromCharCode(27)}[[][0-9;]*m`, 'g')

function reason(err: unknown): string {
  const e = err as { stderr?: Buffer | string; message?: string }
  const text = typeof e.stderr === 'string' ? e.stderr : (e.stderr?.toString('utf8') ?? '')
  const lines = text
    .split('\n')
    .map((l) => l.replace(ANSI, '').trim())
    .filter((l) => l && !/^[^\w]*(ERROR|WARNING)\]?$/i.test(l))
  return lines.slice(0, 3).join(' / ') || e.message?.split('\n')[0] || String(err)
}

/** Runs every query. A failure is recorded rather than thrown, so one bad query
    cannot hide the rest -- the caller surfaces it. */
export function runAll(args: string[]): Section[] {
  return QUERIES.map((q) => {
    try {
      return { ...q, rows: query(q.sql, args) }
    } catch (err) {
      return { ...q, rows: [], error: reason(err) }
    }
  })
}
