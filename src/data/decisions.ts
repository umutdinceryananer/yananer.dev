// Single source of truth for architecture decisions ("how I think").
//
// PURE DATA — no React/JSX imports (same constraint as profile.ts / projects.ts).
// Consumed BOTH by the React site (the "Design Decisions" section) AND, via a
// relative re-import, by the MCP server's explain_decision tool (mcp/src/data/
// decisions.ts), so the two never drift.
//
// These are STERILIZED ADRs for Hisar — a PRIVATE, in-development project with no
// public code. They are self-reported and NOT independently verifiable, and must
// always be rendered in a bucket separate from the verifiable public repos.
// The MCP layer adds its own public-repo decisions (code-grounded) on top.

export interface Decision {
  id: string
  title: string
  /** One-line human summary for the site card (shorter than `decision`). */
  summary?: string
  /** Extra search keys for fuzzy topic matching (besides the title). */
  topics: string[]
  /** Project name (matches Project.name) or 'portfolio' / 'hisar'. */
  repo: string
  /** The decision made. */
  decision: string
  /** WHY — the forces behind it. */
  rationale: string
  /** What it costs / known downsides. */
  tradeoffs: string[]
  /** Options considered and why they were rejected. */
  alternatives?: string[]
  /**
   * For 'public-repo': real file paths backing the WHAT (verify these).
   * For 'sterilized-adr': high-level component names only (no public code to check).
   */
  evidence: string[]
  /**
   * Honest build-state for PRIVATE ('sterilized-adr') decisions:
   *   'implemented' — built and running in the private system
   *   'partial'     — built but not validated / not delivered (in development)
   *   'design'      — designed, not yet built
   * Omitted for public-repo decisions (the repo itself is the proof).
   */
  maturity?: 'implemented' | 'partial' | 'design'
  /** Surface this one prominently on the site (the rest stay in the background). */
  featured?: boolean
  source: 'public-repo' | 'sterilized-adr'
}

export const hisarDecisions: Decision[] = [
  {
    id: 'hisar-gatekeeper',
    title: 'Deterministic gatekeeper before any LLM scoring',
    summary:
      'A rule-based gatekeeper filters routine filings before any LLM call — so cost scales with signal, not noise.',
    topics: [
      'gatekeeper', 'rule-based', 'classifier', 'routing', 'compound ai',
      'llm cost', 'pre-filter', 'triage', 'routine vs material', 'noise filtering',
    ],
    repo: 'hisar',
    decision:
      'A deterministic rule-based classifier inspects every incoming filing first and routes it as routine, material, or unknown. Routine filings receive a fixed low score with no LLM call at all; only material and unknown filings are sent to the LLM.',
    rationale:
      'The large majority of regulatory filings are routine noise, and paying an LLM to read each one is slow and wasteful. A cheap deterministic pass removes the bulk of traffic, makes the common case fast and predictable, and concentrates expensive reasoning where it can actually change an outcome. The gatekeeper also becomes the primary cost lever: tightening rules routes more events to the no-LLM path.',
    tradeoffs: [
      'Rules must be maintained by hand and can drift as filing patterns change.',
      'A misclassified material event sent to the routine path is silently under-scored.',
      'The deterministic layer encodes domain assumptions that need periodic review.',
    ],
    alternatives: [
      'Send every filing to the LLM — rejected: cost and latency scale with noise, not signal.',
      'Insert a cheaper LLM tier as the shortcut for low-stakes filings — rejected: the rule-based gatekeeper already captures that case at zero LLM cost, with no added routing complexity.',
    ],
    evidence: ['gatekeeper classifier', 'scoring pipeline', 'per-source classifier modules'],
    maturity: 'implemented',
    featured: true,
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-cross-provider-fallback',
    title: 'LLM resilience via cross-provider fallback',
    summary:
      'Failover crosses a provider boundary, because a same-vendor downgrade does not survive a provider-wide outage.',
    topics: [
      'llm fallback', 'failover', 'resilience', 'provider outage', 'retry',
      'rate limit', 'multi-provider', 'redundancy', 'high availability',
    ],
    repo: 'hisar',
    decision:
      'Scoring calls a primary commercial LLM provider with a bounded number of retries; on persistent failure it fails over to a different provider using the same prompt template, with response-shape differences absorbed by a per-provider parser.',
    rationale:
      'The fallback exists for outage resilience, and resilience must cross a provider boundary to be real. A cheaper model from the same vendor shares the same API surface, auth, and infrastructure, so it does not survive the provider-wide failures that matter. Bounded retries handle transient blips; a genuinely different provider handles sustained outages.',
    tradeoffs: [
      'The prompt template and output contract must be kept in parity across two providers.',
      'The fallback provider has different latency and parsing behavior, so failover degrades consistency even when it preserves availability.',
      'Two integrated providers is more surface area to test and monitor than one.',
    ],
    alternatives: [
      'Fall back to a cheaper model on the same provider — rejected: does not survive a provider-wide outage, which is the failure the fallback is for.',
      'Per-call cheapest-available provider router — rejected: adds per-call selection and multi-schema handling with no current cost pressure to justify it.',
    ],
    evidence: ['scoring worker', 'provider abstraction layer', 'message queue with dead-letter routing'],
    maturity: 'implemented',
    featured: false,
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-defer-ontology',
    title: 'Interim flat model, ontology/GraphRAG deferred behind triggers',
    summary:
      'Flat relational model now; the ontology / GraphRAG layer is deferred behind explicit re-activation triggers, not built early.',
    topics: [
      'ontology', 'graphrag', 'knowledge graph', 'entity model', 'relational',
      'yagni', 'data modeling', 'graph database', 'deferral', 'premature abstraction',
    ],
    repo: 'hisar',
    decision:
      'Entities and their context are modeled as flat relational tables for now. A full entity-and-relationship ontology (and any graph or GraphRAG layer) is explicitly deferred, kept open behind concrete re-activation triggers rather than either built early or rejected forever.',
    rationale:
      'The context the system actually injects today is satisfied by flat tables, and a graph layer would add modeling, storage, and reasoning complexity that current needs do not justify. Writing down explicit triggers for revisiting the decision avoids both premature abstraction and a permanent foreclosure of structural reasoning.',
    tradeoffs: [
      'Multi-hop and structural relationship reasoning is limited until the ontology is activated.',
      'If the triggers are met later, there is a migration cost from flat tables to a richer model.',
      'Capabilities that assume a graph cannot be claimed as present — this is a deliberately unbuilt path.',
    ],
    alternatives: [
      'Build the full ontology/graph layer now — rejected: complexity unjustified by current requirements.',
      'Reject ontology permanently — rejected: would foreclose a plausible future need; the decision is deferral, not denial.',
    ],
    evidence: ['entity/context relational tables', 'prompt-context assembly'],
    maturity: 'implemented',
    featured: false,
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-no-lookahead-alignment',
    title: 'No-look-ahead alignment + prompt-leakage isolation in eval',
    summary:
      'Evaluation aligns each filing to the next market interval and strips price/outcome from the prompt — leakage is checked, not assumed. Research-stage, not yet validated on real LLM outputs.',
    topics: [
      'look-ahead bias', 'leakage', 'evaluation', 'backtest', 'price alignment',
      'data leakage', 'no peeking', 'eval methodology', 'temporal integrity', 'next candle',
    ],
    repo: 'hisar',
    decision:
      'In the research/evaluation pipeline, each filing is aligned to the next market interval after it becomes public (after-hours filings map to the next session open), and no price or outcome data is allowed into the scoring prompt — a separate check scans prompts for forbidden fields.',
    rationale:
      'To honestly relate a model score to subsequent price movement, the score must be formed only from information available at filing time. Aligning to the next interval prevents the model from being implicitly credited with same-interval movement, and stripping price/outcome fields from the prompt prevents the model from grading its own future. The explicit leakage check turns "no peeking" from an assumption into something testable.',
    tradeoffs: [
      'Aligning to a whole next interval discards finer intraday precision.',
      'Correctness depends on the market-calendar handling for holidays and partial sessions.',
      'This is research-stage methodology: the method is built but has NOT been validated on real LLM outputs, so it is not a production-proven result.',
    ],
    alternatives: [
      'Align to the contemporaneous interval — rejected: introduces look-ahead bias.',
      'Include price/volatility context in the prompt for richer reasoning — rejected: leaks the outcome the evaluation is trying to predict.',
    ],
    evidence: ['price-alignment module', 'market-hours helper', 'prompt leakage-check module'],
    maturity: 'partial',
    featured: true,
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-silence-first-dry-run',
    title: 'Silence-first notifications, delivery deferred to a dry-run log',
    summary:
      'Notifications optimize for suppression over engagement; delivery runs dry-run to a log first, so quality is proven before anyone is interrupted. No live delivery yet.',
    topics: [
      'silence-first', 'notifications', 'dry run', 'anti-engagement', 'alert fatigue',
      'false positive cost', 'suppression', 'signal-to-noise', 'notification log',
    ],
    repo: 'hisar',
    decision:
      'The product optimizes for suppressing low-signal alerts rather than maximizing engagement, and notification decisions are currently computed and written to a log instead of being delivered to real recipients.',
    rationale:
      'The promise is that a user can ignore the app and trust that anything sent was worth the interruption, so a needless alert costs far more trust than a missed marginal one. Recording decisions to a log first lets the decision logic and thresholds be exercised and reviewed before any real delivery channel exists, so quality is proven before anyone can be annoyed.',
    tradeoffs: [
      'No live delivery yet — the end-to-end notification experience is unproven with real recipients.',
      'Whether a user genuinely valued an alert cannot be measured without real delivery and feedback.',
      'Judging suppression quality requires a dedicated evaluation; an empty inbox is not self-evidently correct.',
    ],
    alternatives: [
      'Ship live notifications immediately — rejected: unvalidated alert quality erodes trust fastest in an anti-engagement product.',
      'Offer a scrollable feed to browse — rejected: contradicts the silence-first promise of not requiring time in the app.',
    ],
    evidence: ['notification worker', 'notification log table', 'per-user threshold settings'],
    maturity: 'partial',
    featured: true,
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-cross-model-judge',
    title: 'Independent cross-model judge for rare-event / unlabeled patterns',
    summary:
      'Rare-event and unlabeled patterns would be validated by an independent cross-model judge rather than self-grading — a designed eval gate, NOT yet built.',
    topics: [
      'llm-as-judge', 'evaluation', 'self-validation', 'circularity', 'rare events',
      'label agreement', 'cross-model', 'judge', 'unsupervised', 'validation methodology',
    ],
    repo: 'hisar',
    decision:
      'For patterns that fire too rarely for statistical accuracy gates, or that have no objective ground truth, the designed validation approach is an independent, more-capable model acting as a judge that agrees or disagrees with the production model — rather than a single accuracy metric. This eval gate is designed but NOT yet built.',
    rationale:
      'The model that produces a signal cannot credibly grade itself — using the same model on both ends measures self-consistency, not correctness. Some patterns also fire too infrequently for precision/recall to be meaningful, and some are inherently subjective. An independent judge from a different model family reduces correlated errors and gives a defensible, honestly-framed validation signal for these cases.',
    tradeoffs: [
      'Designed but not yet built — no results from it exist yet, so its value is currently a hypothesis, not a measured outcome.',
      'A judge is a proxy for ground truth, not ground truth itself; agreement is not the same as predictive accuracy.',
      'Running multiple validation templates instead of one metric would increase evaluation-pipeline complexity and add a dependence on a second, more expensive model.',
    ],
    alternatives: [
      'Apply one accuracy-gate framework to all patterns — rejected: rare-event patterns cannot support it, forcing either fake confidence or indefinite deferral.',
      'Have the production model judge itself with a different prompt — rejected: still self-validation, since the priors are shared.',
    ],
    evidence: ['evaluation/judge harness (designed)', 'pattern detection modules', 'gold-set labeling process (designed)'],
    maturity: 'design',
    featured: true,
    source: 'sterilized-adr',
  },
]
