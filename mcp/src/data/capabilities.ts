// Capability → evidence map for the assess_fit tool. MCP-only.
// Evidence references real repos/files (or clearly-marked private work).

export interface Capability {
  id: string
  label: string
  /** Keywords for matching a role / job description. */
  keywords: string[]
  /** "Repo — file/why" evidence; verify the public ones. */
  evidence: string[]
}

export const capabilities: Capability[] = [
  {
    id: 'agentic',
    label: 'Agentic orchestration (LangGraph)',
    keywords: ['agent', 'agents', 'agentic', 'langgraph', 'orchestration', 'multi step', 'tool use', 'llm agent', 'mcp', 'ai engineer', 'ai'],
    evidence: ['government-citizen-services-voice-agent — agent/graph.py, agent/nodes/', 'yananer.dev — this MCP server (mcp/)'],
  },
  {
    id: 'rag',
    label: 'RAG / retrieval',
    keywords: ['rag', 'retrieval', 'vector', 'embeddings', 'semantic search', 'grounding', 'knowledge base', 'ai engineer', 'ai'],
    evidence: ['government-citizen-services-voice-agent — rag/retriever.py, rag/embed.py'],
  },
  {
    id: 'llm-integration',
    label: 'LLM application integration',
    keywords: ['llm', 'gpt', 'claude', 'openai', 'anthropic', 'groq', 'prompt', 'generative ai', 'genai', 'inference', 'ai engineer', 'ai', 'artificial intelligence'],
    evidence: ['government-citizen-services-voice-agent — OpenAI', 'spotify-playlist-watcher — src/groq_client.py (Groq)'],
  },
  {
    id: 'backend',
    label: 'Async backend & API design',
    keywords: ['backend', 'api', 'rest', 'flask', 'fastapi', 'python', 'server', 'endpoint', 'sqlalchemy'],
    evidence: [
      'government-citizen-services-voice-agent — agent/server.py (FastAPI streaming/SSE endpoint)',
      'fx-risk-engine — app/__init__.py (Flask app-factory), Flask-Smorest blueprints',
    ],
  },
  {
    id: 'workflow',
    label: 'Event-driven workflows / state machines',
    keywords: ['workflow', 'state machine', 'event driven', 'approval', 'slack', 'orchestration'],
    evidence: ['slack-workflow-engine — slack_workflow_engine/workflows/state.py'],
  },
  {
    id: 'scheduling',
    label: 'Scheduling / automation',
    keywords: ['scheduler', 'cron', 'apscheduler', 'background job', 'automation', 'github actions'],
    evidence: ['fx-risk-engine — app/services/scheduler.py (APScheduler)', 'spotify-playlist-watcher — GitHub Actions cron'],
  },
  {
    id: 'data-eng',
    label: 'Data engineering / analytics',
    keywords: ['data engineering', 'data engineer', 'analytics', 'sql', 'duckdb', 'etl', 'cohort', 'funnel', 'kpi', 'dashboard', 'tableau'],
    evidence: ['mobile-game-analytics-pipeline — DuckDB, references/sql/, notebooks/'],
  },
  {
    id: 'ml',
    label: 'ML modeling',
    keywords: ['machine learning', 'ml', 'model', 'xgboost', 'scikit', 'sklearn', 'classification', 'churn', 'regression', 'ai engineer', 'ml engineer', 'ai', 'artificial intelligence'],
    evidence: ['mobile-game-analytics-pipeline — mobile_game_analytics_pipeline/modeling/ (LogReg + XGBoost)'],
  },
  {
    id: 'algorithms',
    label: 'Algorithms / simulation',
    keywords: ['algorithm', 'algorithms', 'simulation', 'game theory', 'optimization'],
    evidence: ['my-game-theory-lab — src/core/ (tournament engine)'],
  },
  {
    id: 'systems',
    label: 'Linux systems / daemons & D-Bus IPC',
    // NOTE: 'rust' is deliberately NOT a keyword here. The Linux/daemon/IPC work is
    // evidenced by nightlightd, but Rust proficiency itself is still self-declared as
    // early — it stays in profile.growth so `assess_fit("Rust")` returns that honest
    // gap (with nightlightd cited in the note) rather than a flat "covered".
    keywords: ['linux', 'daemon', 'systemd', 'd bus', 'dbus', 'ipc', 'x11', 'xrandr', 'systems programming', 'cli', 'tui'],
    evidence: [
      'nightlightd — cli/src/main.rs (daemon event loop), cli/src/dbus.rs (D-Bus service), cli/src/suspend.rs (logind suspend/resume)',
      'nightlightd — cli/src/x11.rs (X11 / XRandR gamma ramps), dist/ (systemd units, Debian packaging)',
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend (React / TypeScript)',
    keywords: ['frontend', 'react', 'typescript', 'vite', 'tailwind', 'ui', 'spa', 'web'],
    evidence: ['my-game-theory-lab — React/Vite', 'yananer.dev — this site'],
  },
  {
    id: 'testing-ci',
    label: 'Testing & CI',
    keywords: ['testing', 'tests', 'unit test', 'ci', 'continuous integration', 'pytest', 'vitest'],
    evidence: ['slack-workflow-engine — tests/ (15+), .github/workflows/ci.yml', 'my-game-theory-lab — Vitest'],
  },
  {
    id: 'quant',
    label: 'Quant / finance domain',
    keywords: ['quant', 'finance', 'fx', 'trading', 'risk', 'portfolio', 'market', 'sec filings'],
    evidence: ['fx-risk-engine — multi-currency risk, P&L, exposure'],
  },
  {
    id: 'cloud',
    label: 'Cloud / AWS',
    keywords: ['cloud', 'aws', 's3'],
    evidence: ['petlyst-web — AWS S3', 'AWS Cloud Practitioner certified'],
  },
  {
    id: 'mobile',
    label: 'Mobile (iOS / SwiftUI)',
    keywords: ['mobile', 'ios', 'swift', 'swiftui'],
    evidence: ['themis — live on the App Store (closed-source): offline-first SwiftUI iOS client + StoreKit'],
  },
  {
    id: 'oss',
    label: 'Open-source contribution in large codebases',
    keywords: ['open source', 'oss', 'contribution', 'pull request', 'large codebase'],
    evidence: ['elastic/kibana — merged PR #268326'],
  },
]
