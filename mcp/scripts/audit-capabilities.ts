// Guard against capability keyword -> evidence drift.
//
// Every tech keyword in capabilities.ts is a claim that must be backed by the
// real project data (projects.ts: tech / keyFiles / descriptions). This script
// flags any keyword that is neither present verbatim in that corpus nor on a
// reviewed allowlist, and exits non-zero so `npm run deploy` (predeploy) aborts.
//
// To clear a new flag, either add real evidence that contains the term, or —
// if it is a legitimate synonym/abbreviation of something already in the
// evidence — add it to SYNONYM_ALLOWLIST below with the reviewer's blessing.
import { capabilities } from '../src/data/capabilities'
import { projects } from '../../src/data/projects'

const norm = (s: string) => ' ' + s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' '
const corpus = norm(JSON.stringify(projects))

// Role-title aliases: matching aids, not tech claims. Exempt from backing.
const ALIASES = new Set([
  'ai engineer', 'ai', 'ml engineer', 'data engineer', 'artificial intelligence',
])

// Reviewed synonyms/abbreviations that ARE backed by evidence but do not appear
// verbatim in the project corpus. Each was checked by hand against the repos.
const SYNONYM_ALLOWLIST = new Set([
  // agentic
  'agents', 'agentic', 'tool use', 'mcp',
  // rag
  'vector', 'embeddings', 'semantic search', 'grounding',
  // llm-integration (claude = Hisar/private, kept intentionally)
  'gpt', 'claude', 'prompt', 'generative ai', 'genai', 'inference',
  // workflow
  'event driven',
  // scheduling
  'cron', 'background job',
  // data-eng
  'etl', 'cohort',
  // ml
  'machine learning', 'sklearn', 'classification',
  // algorithms
  'algorithm', 'simulation', 'optimization',
  // testing-ci
  'testing', 'unit test', 'continuous integration',
  // quant (trading/market = FX risk domain, kept intentionally)
  'finance', 'trading', 'market',
  // oss
  'open source', 'large codebase',
  // cloud (AWS S3 + AWS Cloud Practitioner cert; 'aws' is in-corpus, 'cloud' is the synonym)
  'cloud',
])

const reviewed = new Set([...ALIASES, ...SYNONYM_ALLOWLIST])
const violations: string[] = []

for (const c of capabilities) {
  for (const k of c.keywords) {
    const key = k.toLowerCase()
    if (reviewed.has(key)) continue
    if (!corpus.includes(norm(k))) violations.push(`[${c.id}] "${k}"`)
  }
}

if (violations.length) {
  console.error('✘ capability audit: unbacked keyword(s) with no evidence in project data:')
  for (const v of violations) console.error('   ' + v)
  console.error('\nFix: add real evidence containing the term, or add it to SYNONYM_ALLOWLIST if it is a reviewed synonym.')
  process.exit(1)
}

console.log(`✓ capability audit: all ${capabilities.reduce((n, c) => n + c.keywords.length, 0)} keywords backed or reviewed.`)
