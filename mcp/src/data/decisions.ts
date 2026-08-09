// Curated architecture decisions for the explain_decision MCP tool.
// MCP-only — NOT rendered on the site.
//
// Two provenance kinds:
//   - 'public-repo'    : code-grounded analysis of a PUBLIC repo. The `evidence`
//                        paths let an agent verify the WHAT against real files.
//                        Defined locally below.
//   - 'sterilized-adr' : author's own (sterilized) ADR for a PRIVATE project
//                        (hisar). Self-reported, NOT independently verifiable.
//                        Imported from the repo's single source of truth
//                        (../../../src/data/decisions) — the same data the site
//                        renders — so the two never drift.

import { hisarDecisions, type Decision } from '../../../src/data/decisions'

export type { Decision }

const publicRepoDecisions: Decision[] = [
  {
    id: 'fx-provider-fallback',
    title: 'fx-risk-engine: multi-provider rate fetching with fallback',
    topics: ['fx rate provider', 'fallback', 'ecb frankfurter', 'exchange rate', 'mock provider', 'resilience'],
    repo: 'fx-risk-engine',
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
    title: 'fx-risk-engine: APScheduler background rate refresh',
    topics: ['apscheduler', 'background job', 'rate refresh', 'scheduler', 'cron'],
    repo: 'fx-risk-engine',
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
    title: 'fx-risk-engine: Flask app-factory + Flask-Smorest blueprints',
    topics: ['flask', 'app factory', 'flask-smorest', 'blueprints', 'api structure', 'openapi'],
    repo: 'fx-risk-engine',
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
    title: 'my-game-theory-lab: seedable PRNG for reproducible tournaments',
    topics: ['reproducibility', 'seed', 'prng random', 'deterministic tournament', 'noise error rate'],
    repo: 'my-game-theory-lab',
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
    title: 'mobile-game-analytics-pipeline: real base data vs synthetic enrichment',
    topics: ['synthetic data', 'kaggle cookie cats', 'roas roi', 'data provenance', 'monetization fields'],
    repo: 'mobile-game-analytics-pipeline',
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
    title: 'government-citizen-services-voice-agent: LangGraph routing + RAG grounding',
    topics: ['langgraph', 'agent graph', 'intent routing', 'rag', 'retrieval', 'voice agent', 'service router'],
    repo: 'government-citizen-services-voice-agent',
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
    id: 'nightlightd-dbus-single-instance',
    title: 'nightlightd: the D-Bus well-known name IS the single-instance lock',
    topics: ['single instance', 'refuses to run twice', 'd bus name', 'donotqueue', 'duplicate daemons', 'autostart'],
    repo: 'nightlightd',
    decision:
      'The daemon claims a well-known D-Bus name with the DoNotQueue flag at startup. Losing the race means another instance already owns it, so the process logs "already running" and exits cleanly instead of queueing or fighting over the screen.',
    rationale:
      'Colour-temperature tools get started by several autostart mechanisms that do not know about each other. On a stock Mint Xfce install four redshift instances had accumulated from three such mechanisms, each fighting over the same gamma ramp. Reusing the D-Bus name the daemon already needs for its control interface makes the lock free: no PID file to go stale, and no lock left behind by a crash.',
    tradeoffs: [
      'Ties the single-instance guarantee to a working D-Bus session bus; without one, the guard cannot arbitrate.',
      'The name must be claimed before the screen is touched, which constrains startup ordering.',
    ],
    evidence: ['cli/src/dbus.rs', 'cli/src/main.rs'],
    source: 'public-repo',
  },
  {
    id: 'nightlightd-loop-owns-screen',
    title: 'nightlightd: one poll loop owns the screen; D-Bus handlers only mutate state',
    topics: ['shared state', 'concurrency', 'screen ownership', 'poll loop', 'thread safety', 'gamma ramp'],
    repo: 'nightlightd',
    decision:
      'D-Bus handlers never touch the screen. They write to a small shared state struct and wake the poll loop, which stays the single owner of all gamma-ramp writes.',
    rationale:
      'The gamma ramp is a single piece of global hardware state that is also reset externally on resume, resolution change, or monitor hotplug. Funnelling every write through one loop keeps "what should the screen look like now" in one place, so external resets and user commands cannot race each other into a half-applied ramp.',
    tradeoffs: [
      'Commands are not applied synchronously in the handler; they take effect when the loop wakes.',
      'The shared state is the one place needing a mutex, so it must stay small and lock-free of I/O.',
    ],
    evidence: ['cli/src/state.rs', 'cli/src/dbus.rs', 'cli/src/main.rs'],
    source: 'public-repo',
  },
  {
    id: 'nightlightd-tray-async-io',
    title: 'nightlightd: the tray uses ksni on async-io, deliberately keeping tokio out',
    topics: ['tray icon', 'ksni', 'tokio', 'async io', 'nested runtime', 'statusnotifieritem'],
    repo: 'nightlightd',
    decision:
      "The tray depends on ksni with default features off, selecting the blocking API driven by async-io rather than ksni's default tokio backend.",
    rationale:
      'The default tokio feature drives ksni\'s blocking spawn from inside a nested tokio runtime, which panics with "Cannot start a runtime from within a runtime". The two backends are mutually exclusive, and async-io is the one that works with the blocking API, so choosing it both fixes the panic and keeps a whole async runtime out of a tray icon that does almost nothing.',
    tradeoffs: [
      'Diverges from the library default, so the reason has to be documented or a future dependency bump silently reintroduces the panic.',
      'Mixing this crate with a tokio-based one later would mean reconciling two async ecosystems.',
    ],
    evidence: ['tray/Cargo.toml', 'tray/src/main.rs', 'tray/src/daemon.rs'],
    source: 'public-repo',
  },
  {
    id: 'nightlightd-x11rb-pure-rust',
    title: 'nightlightd: pure-Rust X11 bindings (x11rb) instead of C libxcb',
    topics: ['x11rb', 'libxcb', 'xrandr', 'build dependency', 'static musl', 'gamma ramp'],
    repo: 'nightlightd',
    decision:
      'Screen access goes through x11rb with the randr feature, rather than binding the C libxcb library.',
    rationale:
      'Pure-Rust bindings remove the C build dependency, which is what makes the fully static musl builds shipped in the release possible on any x86_64 Linux. The randr feature supplies exactly the CRTC and gamma-ramp APIs the backend needs, so nothing wider is pulled in.',
    tradeoffs: [
      'Bound by what x11rb exposes rather than the full C API surface.',
      'X11 only: this path has no Wayland equivalent, which is an accepted scope limit for the project.',
    ],
    evidence: ['cli/Cargo.toml', 'cli/src/x11.rs'],
    source: 'public-repo',
  },
  {
    id: 'portfolio-single-source',
    title: 'yananer.dev: one data source feeds the site, SKILL.md, and this MCP',
    topics: ['single source of truth', 'codegen', 'skill.md', 'llms.txt', 'agent files', 'projects.ts'],
    repo: 'portfolio',
    decision:
      'Project/profile/decision data lives once in src/data/*.ts; a build-time codegen emits SKILL.md / llms.txt / resume.json, and this MCP server imports the same modules at runtime.',
    rationale:
      'Avoids drift between the human site, the agent-readable files, and the MCP tools — edit the data once and every surface stays consistent.',
    tradeoffs: ['The data modules must stay pure (no React) so Node/tsx and the MCP can import them.'],
    evidence: ['src/data/projects.ts', 'src/data/profile.ts', 'src/data/decisions.ts', 'scripts/generate-agent-files.ts', 'mcp/src/lib/projectsView.ts'],
    source: 'public-repo',
  },
]

// Public-repo (verifiable) decisions first, then the sterilized private hisar ADRs.
// The hisar entries carry maturity + a "not independently verifiable" caveat in the
// tool output, keeping them clearly separate from the verifiable public work.
export const decisions: Decision[] = [...publicRepoDecisions, ...hisarDecisions]
