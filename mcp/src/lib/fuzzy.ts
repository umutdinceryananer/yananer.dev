// Tiny zero-dependency fuzzy matcher used for explain_decision topics and
// run_tournament strategy names.

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function tokenize(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean)
}

/** Score a query against a candidate string: 1 = exact, down to 0. */
function scoreOne(query: string, candidate: string): number {
  const q = normalize(query)
  const c = normalize(candidate)
  if (!q || !c) return 0
  if (q === c) return 1
  if (c.includes(q) || q.includes(c)) return 0.8
  const qt = new Set(tokenize(query))
  const ct = new Set(tokenize(candidate))
  if (!qt.size || !ct.size) return 0
  const overlap = [...qt].filter((t) => ct.has(t)).length
  const union = new Set([...qt, ...ct]).size
  return overlap / union // Jaccard
}

/** Best score of a query across several candidate keys. */
export function scoreMatch(query: string, keys: string[]): number {
  return keys.reduce((best, k) => Math.max(best, scoreOne(query, k)), 0)
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
