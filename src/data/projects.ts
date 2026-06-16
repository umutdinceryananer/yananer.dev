// Single source of truth for project / repo data.
//
// PURE DATA — no React/JSX imports (same constraint as profile.ts): this is
// imported by the build-time codegen (scripts/generate-agent-files.ts) under
// Node/tsx, which feeds public/SKILL.md, public/llms.txt and public/resume.json.
//
// This batch: projects[] feeds ONLY the generated agent files. It is intentionally
// shaped so that LATER it can also drive:
//   - a visible "Projects" React section in the bento grid (Home.tsx), and
//   - an MCP server (homelab self-host, mcp.yananer.dev): list_projects(),
//     get_project(name), explain_decision(topic), run_tournament(config).
//
// All keyEntryPoints were verified against the live GitHub repos via `gh api`
// (recursive git tree) — do not edit paths by hand without re-verifying.

export interface Project {
  name: string
  kind: 'repo' | 'oss-contribution'
  /** Repo URL, or the PR URL for an oss-contribution. Omitted for private work. */
  repoUrl?: string
  oneLiner: string
  /** The "angle" this project demonstrates, e.g. "quant / backend systems". */
  signal: string
  tech?: string[]
  /** Verified file/dir paths an agent should read first, "path — why". */
  keyEntryPoints?: string[]
  liveDemoUrl?: string
  isPrivate: boolean
  /** False when there is no public code/PR to independently check (HISAR). */
  isVerifiable: boolean
  /** True when the repo's data is synthetic — must be surfaced wherever metrics appear. */
  syntheticData?: boolean
  /** For kind: 'oss-contribution' — whether the PR is merged or still open. */
  contributionState?: 'merged' | 'open'
  /** Honest caveat, surfaced everywhere this project is rendered. */
  note?: string
}

export const projects: Project[] = [
  {
    name: 'FX-Risk-Engine',
    kind: 'repo',
    repoUrl: 'https://github.com/umutdinceryananer/FX-Risk-Engine',
    oneLiner:
      "A real-data FX risk service that aggregates multi-currency positions into a base currency and computes portfolio value, daily P&L, currency exposure, and ±10% what-if scenarios.",
    signal: 'quant / backend systems',
    tech: ['Python', 'Flask', 'Flask-Smorest', 'SQLAlchemy', 'Alembic', 'APScheduler', 'Docker', 'pytest'],
    keyEntryPoints: [
      'app/__init__.py — Flask application factory',
      'app/services/orchestrator.py — FX orchestrator',
      'app/services/rate_store.py — rate store',
      'app/services/portfolio_metrics.py — portfolio value, P&L, exposure metrics',
      'app/services/scheduler.py — APScheduler rate-refresh jobs',
      'app/providers/ — rate providers: frankfurter_provider.py (ECB data), exchangerate_provider.py, mock.py, registry.py',
      'app/metrics/routes.py + app/metrics/schemas.py — Flask-Smorest blueprint',
      'frontend/src/state.js — vanilla-JS SPA frontend (also router.js, views/)',
      'tests/e2e/ — end-to-end tests',
    ],
    isPrivate: false,
    isVerifiable: true,
  },
  {
    name: 'My-Game-Theory-Lab',
    kind: 'repo',
    repoUrl: 'https://github.com/umutdinceryananer/My-Game-Theory-Lab',
    oneLiner:
      "An Iterated Prisoner's Dilemma lab: configure payoff matrices and error rates, run tournaments between strategies, evolve genetic strategies, and inspect results with tables and heatmaps.",
    signal: 'game theory + algorithms / frontend engineering',
    tech: ['TypeScript', 'React', 'Vite', 'Tailwind', 'Vitest'],
    keyEntryPoints: [
      'src/core/tournament.ts — tournament engine',
      'src/core/game.ts — round/match logic',
      'src/core/evolutionEngine.ts — evolution mode',
      'src/strategies/ — strategy catalog (titForTat, grudger, pavlov, prober, generousTitForTat, ...)',
      'src/strategies/genetic/ — genetic genome + operators (createGeneticStrategy.ts, genome.ts, operators.ts)',
      'src/components/genetic/genetic-strategy-editor.tsx — genetic strategy editor UI',
      'src/lib/rating/elo.ts — Elo ratings',
      'src/__tests__/ — Vitest suite (reproducible by design)',
    ],
    liveDemoUrl: 'https://umutdinceryananer.github.io/My-Game-Theory-Lab/',
    isPrivate: false,
    isVerifiable: true,
  },
  {
    name: 'Mobile-Game-Analytics-Pipeline',
    kind: 'repo',
    repoUrl: 'https://github.com/umutdinceryananer/Mobile-Game-Analytics-Pipeline',
    oneLiner:
      'A mobile-game user-acquisition analytics pipeline: SQL-driven KPIs, funnel + ROAS by channel, D1/D7 retention cohorts, and a churn model (Logistic Regression + XGBoost) on DuckDB, with a Tableau story.',
    signal: 'data engineering / ML',
    tech: ['Python', 'DuckDB', 'SQL', 'scikit-learn (LogReg)', 'XGBoost', 'Tableau'],
    keyEntryPoints: [
      'data/make_dataset.py + data/config/synthetic.yaml — synthetic data generation',
      'mobile_game_analytics_pipeline/modeling/train.py — churn model training (LogReg + XGBoost)',
      'notebooks/1.0-EDA-and-Funnel.ipynb — funnel analysis',
      'notebooks/2.0-ROI-and-ROAS-by-Channel.ipynb — ROI / ROAS by channel',
      'notebooks/2.1-Retention-Cohorts.ipynb — D1/D7 retention cohorts',
      'notebooks/3.0-Churn-Model.ipynb — churn modeling',
      'references/sql/ — KPI SQL queries',
      'reports/executive_summary.md — written summary',
    ],
    liveDemoUrl: 'https://public.tableau.com/views/MobileGameUAStory/TableauStory',
    isPrivate: false,
    isVerifiable: true,
    syntheticData: true,
    note: 'All data is SYNTHETIC (generated from data/config/synthetic.yaml). The metrics are illustrative, not real user data — always say so when discussing numbers.',
  },
  {
    name: 'elastic/kibana — PR #268326',
    kind: 'oss-contribution',
    repoUrl: 'https://github.com/elastic/kibana/pull/268326',
    oneLiner:
      'Merged PR in elastic/kibana: show a "Go to dashboard" button in the save-success toast.',
    signal: 'real-world OSS (large production codebase)',
    contributionState: 'merged',
    isPrivate: false,
    isVerifiable: true,
  },
  {
    name: 'langfuse/langfuse-docs — PR #2821',
    kind: 'oss-contribution',
    repoUrl: 'https://github.com/langfuse/langfuse-docs/pull/2821',
    oneLiner:
      'PR in langfuse/langfuse-docs: add a Streamlit integration cookbook.',
    signal: 'real-world OSS / AI tooling docs',
    contributionState: 'open',
    isPrivate: false,
    isVerifiable: true,
    note: 'Open pull request — under review, NOT yet merged. Describe it as a pending contribution, not a landed one.',
  },
  {
    name: 'HISAR',
    kind: 'repo',
    oneLiner:
      'A SEC-filings analysis system (private, in development): evaluation methodology (LLM-as-judge, gold-set construction, abnormal-return measurement) plus GraphRAG / ontology work.',
    signal: 'applied LLM systems / evaluation / GraphRAG',
    isPrivate: true,
    isVerifiable: false,
    note: 'PRIVATE and in development. No public code; not a live/production system with real operational data. This describes a stated approach only — it is NOT independently verifiable. Keep it clearly separate from the verifiable public repos above; never present it as live or production.',
  },
]
