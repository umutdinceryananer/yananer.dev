// Curated architecture decisions for the explain_decision MCP tool.
// MCP-only — NOT rendered on the site.
//
// Two provenance kinds:
//   - 'public-repo'    : code-grounded analysis of a PUBLIC repo. The `evidence`
//                        paths let an agent verify the WHAT against real files.
//   - 'sterilized-adr' : author's own (sterilized) ADR for a PRIVATE project
//                        (e.g. Hisar). Self-reported, NOT independently verifiable.

export interface Decision {
  id: string
  title: string
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
  source: 'public-repo' | 'sterilized-adr'
}

export const decisions: Decision[] = [
  {
    id: 'fx-provider-fallback',
    title: 'FX-Risk-Engine: multi-provider rate fetching with fallback',
    topics: ['fx rate provider', 'fallback', 'ecb frankfurter', 'exchange rate', 'mock provider', 'resilience'],
    repo: 'FX-Risk-Engine',
    decision:
      'Rates are fetched through a provider registry with a fallback chain — ECB via Frankfurter and ExchangeRate.host as real sources, plus a mock provider — behind a single FX orchestrator and a rate store.',
    rationale:
      'Decouples the app from any one upstream and keeps it working when a source is down or rate-limited; the mock provider makes the system runnable/testable offline and in CI without hitting live APIs.',
    tradeoffs: [
      'Multiple provider adapters to maintain and keep consistent.',
      'Fallback can silently serve a less-preferred source unless surfaced.',
    ],
    evidence: [
      'app/providers/registry.py',
      'app/providers/frankfurter_provider.py',
      'app/providers/exchangerate_provider.py',
      'app/providers/mock.py',
      'app/services/orchestrator.py',
      'app/services/rate_store.py',
    ],
    source: 'public-repo',
  },
  {
    id: 'fx-scheduled-refresh',
    title: 'FX-Risk-Engine: APScheduler background rate refresh',
    topics: ['apscheduler', 'background job', 'rate refresh', 'scheduler', 'cron'],
    repo: 'FX-Risk-Engine',
    decision:
      'Rates are refreshed by APScheduler background jobs (BackgroundScheduler + CronTrigger) rather than on the request path.',
    rationale:
      'Keeps request latency independent of upstream API calls and gives a single, observable place that controls refresh cadence; pairs with the rate store so requests read cached values.',
    tradeoffs: [
      'Served rates are as fresh as the last refresh, not real-time.',
      'A scheduler adds a stateful component to run and monitor.',
    ],
    evidence: ['app/services/scheduler.py', 'app/services/rate_store.py'],
    source: 'public-repo',
  },
  {
    id: 'fx-app-factory-blueprints',
    title: 'FX-Risk-Engine: Flask app-factory + Flask-Smorest blueprints',
    topics: ['flask', 'app factory', 'flask-smorest', 'blueprints', 'api structure', 'openapi'],
    repo: 'FX-Risk-Engine',
    decision:
      'The API uses a Flask application factory (create_app) and Flask-Smorest blueprints split per domain (rates, portfolios, positions, metrics).',
    rationale:
      'The factory makes configuration/testing explicit (build isolated app instances), and Flask-Smorest gives schema-validated routes + generated OpenAPI for free, with clean per-domain separation.',
    tradeoffs: ['More boilerplate/indirection than a single-module Flask app.'],
    evidence: ['app/__init__.py', 'app/rates/routes.py', 'app/metrics/routes.py', 'app/metrics/schemas.py'],
    source: 'public-repo',
  },
  {
    id: 'gtl-seedable-rng',
    title: 'My-Game-Theory-Lab: seedable PRNG for reproducible tournaments',
    topics: ['reproducibility', 'seed', 'prng random', 'deterministic tournament', 'noise error rate'],
    repo: 'My-Game-Theory-Lab',
    decision:
      'Match noise (the error rate) is driven by a seedable PRNG threaded through the tournament, so a given seed reproduces identical results.',
    rationale:
      'Stochastic noise makes tournaments non-deterministic; a seedable source makes experiments repeatable and comparable — essential for a research/experimentation tool.',
    tradeoffs: ['The seed must be threaded everywhere randomness is used, or reproducibility breaks.'],
    evidence: ['src/core/random.ts', 'src/core/tournament.ts', 'src/core/game.ts'],
    source: 'public-repo',
  },
  {
    id: 'pipeline-synthetic-separation',
    title: 'Mobile-Game-Analytics-Pipeline: real base data vs synthetic enrichment',
    topics: ['synthetic data', 'kaggle cookie cats', 'roas roi', 'data provenance', 'monetization fields'],
    repo: 'Mobile-Game-Analytics-Pipeline',
    decision:
      'The pipeline keeps a real base dataset (Cookie Cats / Kaggle telemetry) separate from synthetically generated user-acquisition & monetization fields (channel, CAC, revenue).',
    rationale:
      'Retention can be computed on real behavioural data while ROI/ROAS analysis needs monetization fields the public dataset lacks; generating those synthetically (from a documented config) keeps the analysis runnable and honest about which numbers are real.',
    tradeoffs: [
      'ROI/ROAS metrics rest on synthetic fields, so they are illustrative, not real-world.',
      'Readers must be told which columns are synthetic (it is labelled throughout).',
    ],
    evidence: ['data/config/synthetic.yaml', 'data/make_dataset.py', 'references/sql/roi_by_channel.sql'],
    source: 'public-repo',
  },
  {
    id: 'voice-agent-langgraph-rag',
    title: 'Government-Citizen-Services-Voice-Agent: LangGraph routing + RAG grounding',
    topics: ['langgraph', 'agent graph', 'intent routing', 'rag', 'retrieval', 'voice agent', 'service router'],
    repo: 'Government-Citizen-Services-Voice-Agent',
    decision:
      'A LangGraph multi-node agent classifies intent then routes to per-service nodes (appointments, documents, complaints, escalation); answers are grounded by RAG retrieval over a bilingual knowledge base.',
    rationale:
      'Explicit graph nodes make the conversation flow inspectable and testable per service, and RAG grounding keeps answers tied to source documents rather than free-form generation.',
    tradeoffs: [
      'A graph + retrieval layer is heavier than a single prompt.',
      'Demo system: the back-office API is mocked, so the end-to-end flow is a demonstration, not production.',
    ],
    evidence: ['agent/graph.py', 'agent/nodes/intent_classify.py', 'agent/nodes/service_router.py', 'rag/retriever.py'],
    source: 'public-repo',
  },
  {
    id: 'portfolio-single-source',
    title: 'yananer.dev: one data source feeds the site, SKILL.md, and this MCP',
    topics: ['single source of truth', 'codegen', 'skill.md', 'llms.txt', 'agent files', 'projects.ts'],
    repo: 'portfolio',
    decision:
      'Project/profile data lives once in src/data/*.ts; a build-time codegen emits SKILL.md / llms.txt / resume.json, and this MCP server imports the same modules at runtime.',
    rationale:
      'Avoids drift between the human site, the agent-readable files, and the MCP tools — edit the data once and every surface stays consistent.',
    tradeoffs: ['The data modules must stay pure (no React) so Node/tsx and the MCP can import them.'],
    evidence: ['src/data/projects.ts', 'src/data/profile.ts', 'scripts/generate-agent-files.ts', 'mcp/src/lib/projectsView.ts'],
    source: 'public-repo',
  },
  // Hisar (private) — sterilized ADRs. Self-reported, NOT independently verifiable
  // (no public code); each carries that caveat in the tool output. Evidence entries
  // are high-level component names only, never internal paths or business-critical data.
  {
    id: 'hisar-gatekeeper',
    title: 'Hisar: deterministic rule-based gatekeeper before any LLM scoring',
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
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-cross-provider-fallback',
    title: 'Hisar: LLM resilience via cross-provider fallback, not same-provider downgrade',
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
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-defer-ontology',
    title: 'Hisar: interim flat relational model, ontology/graph deferred behind triggers',
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
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-no-lookahead-alignment',
    title: 'Hisar: no-look-ahead alignment and prompt leakage isolation in evaluation',
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
      'This is research-stage methodology validated on a small sample, not a production-proven result.',
    ],
    alternatives: [
      'Align to the contemporaneous interval — rejected: introduces look-ahead bias.',
      'Include price/volatility context in the prompt for richer reasoning — rejected: leaks the outcome the evaluation is trying to predict.',
    ],
    evidence: ['price-alignment module', 'market-hours helper', 'prompt leakage-check module'],
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-silence-first-dry-run',
    title: 'Hisar: silence-first notifications, delivery deferred to a dry-run log',
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
    source: 'sterilized-adr',
  },
  {
    id: 'hisar-cross-model-judge',
    title: 'Hisar: independent cross-model judge for rare-event and unsupervised patterns',
    topics: [
      'llm-as-judge', 'evaluation', 'self-validation', 'circularity', 'rare events',
      'label agreement', 'cross-model', 'judge', 'unsupervised', 'validation methodology',
    ],
    repo: 'hisar',
    decision:
      'Patterns that fire too rarely for statistical accuracy gates, or that have no objective ground truth, are validated by a separate more-capable model acting as an independent judge that agrees or disagrees with the production model, rather than by a single accuracy metric.',
    rationale:
      'The model that produces a signal cannot credibly grade itself — using the same model on both ends measures self-consistency, not correctness. Some patterns also fire too infrequently for precision/recall to be meaningful, and some are inherently subjective. An independent judge from a different model family reduces correlated errors and gives a defensible, honestly-framed validation signal for these cases.',
    tradeoffs: [
      'The judge is a proxy for ground truth, not ground truth itself; agreement is not the same as predictive accuracy.',
      'Running multiple validation templates instead of one metric increases evaluation-pipeline complexity.',
      'It adds dependence on a second, more expensive model and on monitoring its usage.',
    ],
    alternatives: [
      'Apply one accuracy-gate framework to all patterns — rejected: rare-event patterns cannot support it, forcing either fake confidence or indefinite deferral.',
      'Have the production model judge itself with a different prompt — rejected: still self-validation, since the priors are shared.',
    ],
    evidence: ['evaluation/judge harness', 'pattern detection modules', 'gold-set labeling process'],
    source: 'sterilized-adr',
  },
]
