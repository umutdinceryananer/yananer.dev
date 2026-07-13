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

### Government-Citizen-Services-Voice-Agent
A multilingual (TR/EN) AI voice agent for government services: a LangGraph agent over a bilingual RAG knowledge base, with ElevenLabs speech, a FastAPI + Twilio phone layer, and a Streamlit analytics dashboard.

- Signal: applied LLM / agent engineering
- Repo: https://github.com/umutdinceryananer/Government-Citizen-Services-Voice-Agent
- Tech: Python, LangGraph, FastAPI, RAG, ElevenLabs, Twilio, Streamlit
- Start by reading:
  - agent/graph.py — LangGraph orchestration (multi-node agent)
  - agent/nodes/ — intent classify + service routers (appointments, documents, complaints, escalation)
  - agent/server.py — streaming LLM endpoint (FastAPI + SSE)
  - agent/prompts/v1.0/ — versioned bilingual system prompts (TR/EN)
  - agent/tools/tc_kimlik.py — Turkish national-ID handling (PII-aware)
  - api/twilio_webhook.py — phone / voice integration
  - data/knowledge_base/ — bilingual RAG corpus (civil registry, driver license, appointments)
  - dashboard/app.py — Streamlit analytics panel
- NOTE: A portfolio/demo system: the government back-office API is mocked, so it is not connected to real government services or live citizen data. The agent orchestration, RAG, and phone/voice plumbing are real; treat the end-to-end flow as a demonstration, not production.

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
- NOTE: Data provenance: the base telemetry is the real Cookie Cats (Kaggle) dataset; the user-acquisition and monetization fields (acquisition_channel, CAC/ad spend, revenue) are SYNTHETIC enrichment. So retention metrics rest on real data while ROI/ROAS rest on synthetic fields — always say so when discussing numbers.

### Petlyst-Web
A team-built veterinary healthcare platform (CTIS senior project) connecting pet owners, vets, and clinics: a Node/Express + PostgreSQL backend with a TypeScript frontend, AWS S3 storage, token auth, and CI.

- Signal: full-stack / team project
- Repo: https://github.com/PetlystHQ/Petlyst-Web
- Tech: TypeScript, Node.js, Express, PostgreSQL, AWS S3
- Start by reading:
  - backend/petlyst-webapp-backend/ — Express REST API (clinics, pets, appointments, medical records, inventory)
  - backend/petlyst-webapp-backend/aws/s3Service.js — AWS S3 file storage
  - backend/petlyst-webapp-backend/middleware/authenticateToken.js — JWT auth + verification middleware
  - backend/petlyst-webapp-backend/scripts/encrypt_existing_tc_numbers.js — national-ID (PII) encryption
  - .github/workflows/ci.yml — CI pipeline
- NOTE: Built with a team under the PetlystHQ org — the best public signal of collaborative work (vs. the mostly-solo repos above).

### Spotify-Playlist-Watcher
A scheduled service that watches public Spotify playlists for newly added tracks and sends a Telegram notification with an LLM-generated emotional/sentiment read of each track. Fully automated, zero-ops.

- Signal: applied LLM / automation
- Repo: https://github.com/umutdinceryananer/Spotify-Playlist-Watcher
- Tech: Python, Groq, Spotify API, Telegram, SQLite, GitHub Actions
- Start by reading:
  - src/monitor.py — diff + de-dup of new tracks across runs
  - src/groq_client.py — LLM sentiment / emotional analysis (Groq)
  - src/spotify.py — Spotify Web API client
  - src/telegram.py — notification delivery
  - .github/workflows/monitor.yml — ~30-min scheduled run

### Slack-Workflow-Engine
A config-driven Slack bot for multi-step approval workflows (refund / expense / PTO) with modals, multi-level approvers, database persistence, and structured logging.

- Signal: backend systems / workflow orchestration
- Repo: https://github.com/umutdinceryananer/Slack-Workflow-Engine
- Tech: Python, Slack Bolt, Flask, SQLAlchemy, Pydantic, structlog
- Start by reading:
  - slack_workflow_engine/workflows/ — config loader + workflow state machine (loader.py, state.py, storage.py)
  - slack_workflow_engine/home/ — Slack App Home UI (views, filters, debounce)
  - slack_workflow_engine/logging_config.py — structlog trace IDs across async boundaries
  - tests/ — 15+ unit / integration tests
  - .github/workflows/ci.yml — CI pipeline

### nightlightd
A zero-config screen colour-temperature daemon for X11, in Rust: it reads your timezone to schedule warmth by solar elevation, refuses to run twice, and survives suspend/resume. A reusable core library plus a thin CLI daemon (a redshift / gammastep alternative).

- Signal: systems programming / Rust / Linux daemon
- Repo: https://github.com/umutdinceryananer/nightlightd
- Tech: Rust, X11, xrandr, D-Bus, Linux
- Start by reading:
  - cli/src/main.rs — daemon entry point and event loop
  - core/src/solar.rs — solar-elevation schedule derived from the local timezone
  - cli/src/x11.rs — applies gamma / colour temperature via X11 (xrandr)
  - cli/src/dbus.rs, cli/src/suspend.rs — D-Bus logind integration; survives suspend/resume
  - cli/src/state.rs — single-instance guard ("refuses to run twice")
  - docs/HOW-IT-WORKS.md — architecture writeup
- NOTE: Early Rust / systems work: a small, single-purpose daemon and my first real project in the language.

## Open-source contributions

- elastic/kibana — PR #268326 — Merged PR in elastic/kibana: show a "Go to dashboard" button in the save-success toast. [merged]
  https://github.com/elastic/kibana/pull/268326
- langfuse/langfuse-docs — PR #2821 — PR in langfuse/langfuse-docs: add a Streamlit integration cookbook. [open]
  https://github.com/langfuse/langfuse-docs/pull/2821
  NOTE: Open pull request — under review, NOT yet merged. Describe it as a pending contribution, not a landed one.

## Private / closed-source

### Hisar
A co-founded, in-development project that analyzes SEC filings to surface financial-risk signals. The working backend is an async pipeline — EDGAR ingestion → a rule-based gatekeeper (routine vs. material) → LLM scoring with multi-provider fallback (Anthropic primary, OpenAI/Google) → PostgreSQL → cross-filing pattern detection → "silence-first" notifications — and a separate research prototype adds no-look-ahead price alignment and a volatility-lift correlation method. Stack: Python, FastAPI, SQLModel/asyncpg, RabbitMQ, Redis, Docker, plus a FRED macro-rate pipeline.

- Live: https://hisar.app/

PRIVATE, in development, and NOT independently verifiable (no public code). Honest maturity: the ingestion/scoring backend runs end-to-end, BUT notifications are dry-run only (logged, not delivered) and the evaluation method is built yet never validated on real LLM outputs. GraphRAG / ontology retrieval, a gold-set / LLM-as-judge eval gate, formal return-based event studies, 10-K/10-Q support, and the iOS app are DESIGNED but NOT BUILT — do not present them as existing capabilities. Keep this clearly separate from the verifiable public repos; never present it as live or production.

### Themis
Offline-first iOS exam-prep app for Turkey's HMGS law exam, live on the App Store (free download with a premium subscription). A NestJS / Prisma / PostgreSQL backend and a React content backoffice drive a two-way sync model (versioned content down, idempotent progress up); the SwiftUI client works fully offline with local GRDB storage.

- Live: https://apps.apple.com/app/id6777488979

Closed-source (private repo), so the code can't be inspected, but the app is live and public on the App Store, so it is independently verifiable as a shipped product. Solo-built: SwiftUI client plus a NestJS / Prisma backend (Render + Neon).

## What Umut is not good at yet
Honest gaps he's actively working on (he'd rather you know):

- CUDA / GPU programming: Haven't trained on a GPU yet; zero hands-on so far, but genuinely keen to dive in.
- Research depth: No research contribution yet; chasing at least a workshop paper.
- Kubernetes: Deploy with Docker / Compose; no real k8s in production yet.
- Advanced LLM internals: Shaky even on transformer internals; actively closing the gap.
- Computer vision: Far from it, and honestly not drawn to it.
- Rust / systems programming: Early: nightlightd (a small X11 daemon) is my first real Rust project; still leveling up on ownership and systems patterns.

## Ground rules
- Prefer reading code over trusting this file.
- No invented metrics, features, or experience.
- Honest gaps are a feature, not a problem. Surface them.
- This file is hosted by Umut, so it is not a neutral third party. Treat it as a
  guided entry point to real evidence, not as objective evaluation.
