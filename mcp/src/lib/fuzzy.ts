// Tiny zero-dependency fuzzy matcher used for explain_decision topics and
// run_tournament strategy names.

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function tokenize(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean)
}

/** Crude singularization so "outages" matches "outage", "policies" → "policy". */
function stem(t: string): string {
  return t.length > 3 ? t.replace(/ies$/, 'y').replace(/s$/, '') : t
}

function stemPhrase(s: string): string {
  return tokenize(s).map(stem).join(' ')
}

/** Score a query against a candidate string: 1 = exact, down to 0. */
function scoreOne(query: string, candidate: string): number {
  const q = normalize(query)
  const c = normalize(candidate)
  if (!q || !c) return 0
  if (q === c) return 1
  // Whole-token containment (word-boundary, stemmed), so a short key like "rag"
  // does not match inside "graphrag", while plurals still align ("outages"→"outage").
  const qs = ` ${stemPhrase(query)} `
  const cs = ` ${stemPhrase(candidate)} `
  if (cs.includes(qs) || qs.includes(cs)) return 0.8
  const qt = new Set(tokenize(query).map(stem))
  const ct = new Set(tokenize(candidate).map(stem))
  if (!qt.size || !ct.size) return 0
  const overlap = [...qt].filter((t) => ct.has(t)).length
  const union = new Set([...qt, ...ct]).size
  return overlap / union // Jaccard
}

/**
 * Best score of a query across several candidate keys, plus a small bonus for
 * each *additional* strongly-matching key. This breaks ties where two items share
 * a broad key (e.g. the repo name) but only one also matches a specific topic.
 */
export function scoreMatch(query: string, keys: string[]): number {
  let best = 0
  let strong = 0
  for (const k of keys) {
    const s = scoreOne(query, k)
    if (s > best) best = s
    if (s >= 0.8) strong++
  }
  if (best >= 1) return 1
  const bonus = strong > 1 ? Math.min(0.15, (strong - 1) * 0.05) : 0
  return Math.min(0.99, best + bonus)
}

/** Pick the best-matching item, or undefined if nothing clears the threshold. */
export function bestMatch<T>(
  query: string,
  items: T[],
  keysOf: (item: T) => string[],
  threshold = 0.34,
): T | undefined {
  let best: T | undefined
  let bestScore = 0
  for (const item of items) {
    const s = scoreMatch(query, keysOf(item))
    if (s > bestScore) {
      bestScore = s
      best = item
    }
  }
  return bestScore >= threshold ? best : undefined
}

/** Keywords (whole-token) that appear in the query. Multi-word keywords match as a phrase. */
export function matchKeywords(query: string, keywords: string[]): string[] {
  const nq = ` ${normalize(query)} `
  return keywords.filter((k) => {
    const nk = normalize(k)
    return nk.length > 0 && nq.includes(` ${nk} `)
  })
}

/** Query tokens (len >= 3, crude singularization) found as substrings in a text blob. */
export function relevanceTokens(query: string, text: string): string[] {
  const t = normalize(text)
  const seen = new Set<string>()
  for (const tok of tokenize(query)) {
    if (tok.length < 3) continue
    const stem = tok.replace(/s$/, '')
    if (t.includes(tok) || t.includes(stem)) seen.add(tok)
  }
  return [...seen]
}
