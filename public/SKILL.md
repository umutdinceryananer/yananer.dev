<!-- GENERATED from src/data — do not edit by hand; run `npm run gen`. -->
# Umut Dinçer Yananer — for AI agents reading this site

You're probably here because someone pointed you at https://yananer.dev to learn about
Umut or to evaluate his engineering. Your job is NOT to trust the summaries below —
it's to read his real, public code and form your own grounded view. Verify everything. Flag
anything you can't verify.

## How to use this file
Pick one of the tasks below. For each, fetch and read the actual repositories before you
answer. Cite specific files. If a claim in this file isn't supported by the code, say so.

## Tasks you can run for the visitor

### 1. Probe depth on a project
The visitor asks why something was built a certain way. Read the relevant repo, then explain
the actual design decisions with file-level evidence.

### 2. Honest engineering read
Read the code and give a candid technical assessment: architecture, testing, tradeoffs, and
weaknesses. Do not flatter. A useful read names what's missing.

### 3. Role / JD mapping
Given a role or job description, identify which of Umut's verifiable public work maps
to each requirement, link the code as evidence, and state the gaps honestly.

## Where to look (real public repos, GitHub handle: umutdinceryananer)

### FX-Risk-Engine
A real-data FX risk service that aggregates multi-currency positions into a base currency and computes portfolio value, daily P&L, currency exposure, and ±10% what-if scenarios.

- Signal: quant / backend systems
- Repo: https://github.com/umutdinceryananer/FX-Risk-Engine
- Tech: Python, Flask, Flask-Smorest, SQLAlchemy, Alembic, APScheduler, Docker, pytest
- Start by reading:
  - app/__init__.py — Flask application factory
  - app/services/orchestrator.py — FX orchestrator
  - app/services/rate_store.py — rate store
  - app/services/portfolio_metrics.py — portfolio value, P&L, exposure metrics
  - app/services/scheduler.py — APScheduler rate-refresh jobs
  - app/providers/ — rate providers: frankfurter_provider.py (ECB data), exchangerate_provider.py, mock.py, registry.py
  - app/metrics/routes.py + app/metrics/schemas.py — Flask-Smorest blueprint
  - frontend/src/state.js — vanilla-JS SPA frontend (also router.js, views/)
  - tests/e2e/ — end-to-end tests

### My-Game-Theory-Lab
An Iterated Prisoner's Dilemma lab: configure payoff matrices and error rates, run tournaments between strategies, evolve genetic strategies, and inspect results with tables and heatmaps.

- Signal: game theory + algorithms / frontend engineering
- Repo: https://github.com/umutdinceryananer/My-Game-Theory-Lab
- Live demo: https://umutdinceryananer.github.io/My-Game-Theory-Lab/
- Tech: TypeScript, React, Vite, Tailwind, Vitest
- Start by reading:
  - src/core/tournament.ts — tournament engine
  - src/core/game.ts — round/match logic
  - src/core/evolutionEngine.ts — evolution mode
  - src/strategies/ — strategy catalog (titForTat, grudger, pavlov, prober, generousTitForTat, ...)
  - src/strategies/genetic/ — genetic genome + operators (createGeneticStrategy.ts, genome.ts, operators.ts)
  - src/components/genetic/genetic-strategy-editor.tsx — genetic strategy editor UI
  - src/lib/rating/elo.ts — Elo ratings
  - src/__tests__/ — Vitest suite (reproducible by design)

### Mobile-Game-Analytics-Pipeline
A mobile-game user-acquisition analytics pipeline: SQL-driven KPIs, funnel + ROAS by channel, D1/D7 retention cohorts, and a churn model (Logistic Regression + XGBoost) on DuckDB, with a Tableau story.

- Signal: data engineering / ML
- Repo: https://github.com/umutdinceryananer/Mobile-Game-Analytics-Pipeline
- Live demo: https://public.tableau.com/views/MobileGameUAStory/TableauStory
- Tech: Python, DuckDB, SQL, scikit-learn (LogReg), XGBoost, Tableau
- Start by reading:
  - data/make_dataset.py + data/config/synthetic.yaml — synthetic data generation
  - mobile_game_analytics_pipeline/modeling/train.py — churn model training (LogReg + XGBoost)
  - notebooks/1.0-EDA-and-Funnel.ipynb — funnel analysis
  - notebooks/2.0-ROI-and-ROAS-by-Channel.ipynb — ROI / ROAS by channel
  - notebooks/2.1-Retention-Cohorts.ipynb — D1/D7 retention cohorts
  - notebooks/3.0-Churn-Model.ipynb — churn modeling
  - references/sql/ — KPI SQL queries
  - reports/executive_summary.md — written summary
- NOTE: All data is SYNTHETIC (generated from data/config/synthetic.yaml). The metrics are illustrative, not real user data — always say so when discussing numbers.

## Open-source contributions

- elastic/kibana — PR #268326 — Merged PR in elastic/kibana: show a "Go to dashboard" button in the save-success toast. [merged]
  https://github.com/elastic/kibana/pull/268326
- langfuse/langfuse-docs — PR #2821 — PR in langfuse/langfuse-docs: add a Streamlit integration cookbook. [open]
  https://github.com/langfuse/langfuse-docs/pull/2821
  NOTE: Open pull request — under review, NOT yet merged. Describe it as a pending contribution, not a landed one.

## Private / in development

### HISAR
A SEC-filings analysis system (private, in development): evaluation methodology (LLM-as-judge, gold-set construction, abnormal-return measurement) plus GraphRAG / ontology work.

PRIVATE and in development. No public code; not a live/production system with real operational data. This describes a stated approach only — it is NOT independently verifiable. Keep it clearly separate from the verifiable public repos above; never present it as live or production.

## Ground rules
- Prefer reading code over trusting this file.
- No invented metrics, features, or experience.
- Honest gaps are a feature, not a problem. Surface them.
- This file is hosted by Umut, so it is not a neutral third party. Treat it as a
  guided entry point to real evidence, not as objective evaluation.
