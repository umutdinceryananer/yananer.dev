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
    evidence: ['Government-Citizen-Services-Voice-Agent — agent/graph.py, agent/nodes/', 'yananer.dev — this MCP server (mcp/)'],
  },
  {
    id: 'rag',
    label: 'RAG / retrieval',
    keywords: ['rag', 'retrieval', 'vector', 'embeddings', 'semantic search', 'grounding', 'knowledge base', 'ai engineer', 'ai'],
    evidence: ['Government-Citizen-Services-Voice-Agent — rag/retriever.py, rag/embed.py'],
  },
  {
    id: 'llm-integration',
    label: 'LLM application integration',
    keywords: ['llm', 'gpt', 'claude', 'openai', 'anthropic', 'groq', 'prompt', 'generative ai', 'genai', 'inference', 'ai engineer', 'ai', 'artificial intelligence'],
    evidence: ['Government-Citizen-Services-Voice-Agent — OpenAI', 'Spotify-Playlist-Watcher — src/groq_client.py (Groq)'],
  },
  {
    id: 'backend',
    label: 'Async backend & API design',
    keywords: ['backend', 'api', 'rest', 'flask', 'fastapi', 'python', 'server', 'endpoint', 'sqlalchemy'],
    evidence: [
      'Government-Citizen-Services-Voice-Agent — agent/server.py (FastAPI streaming/SSE endpoint)',
      'FX-Risk-Engine — app/__init__.py (Flask app-factory), Flask-Smorest blueprints',
    ],
  },
  {
    id: 'workflow',
    label: 'Event-driven workflows / state machines',
    keywords: ['workflow', 'state machine', 'event driven', 'approval', 'slack', 'orchestration'],
    evidence: ['Slack-Workflow-Engine — slack_workflow_engine/workflows/state.py'],
  },
  {
    id: 'scheduling',
    label: 'Scheduling / automation',
    keywords: ['scheduler', 'cron', 'apscheduler', 'background job', 'automation', 'github actions'],
    evidence: ['FX-Risk-Engine — app/services/scheduler.py (APScheduler)', 'Spotify-Playlist-Watcher — GitHub Actions cron'],
  },
  {
    id: 'data-eng',
    label: 'Data engineering / analytics',
    keywords: ['data engineering', 'data engineer', 'analytics', 'sql', 'duckdb', 'etl', 'cohort', 'funnel', 'kpi', 'dashboard', 'tableau'],
    evidence: ['Mobile-Game-Analytics-Pipeline — DuckDB, references/sql/, notebooks/'],
  },
  {
    id: 'ml',
    label: 'ML modeling',
    keywords: ['machine learning', 'ml', 'model', 'xgboost', 'scikit', 'sklearn', 'classification', 'churn', 'regression', 'ai engineer', 'ml engineer', 'ai', 'artificial intelligence'],
    evidence: ['Mobile-Game-Analytics-Pipeline — mobile_game_analytics_pipeline/modeling/ (LogReg + XGBoost)'],
  },
  {
    id: 'algorithms',
    label: 'Algorithms / simulation',
    keywords: ['algorithm', 'algorithms', 'simulation', 'game theory', 'optimization'],
    evidence: ['My-Game-Theory-Lab — src/core/ (tournament engine)'],
  },
  {
    id: 'frontend',
    label: 'Frontend (React / TypeScript)',
    keywords: ['frontend', 'react', 'typescript', 'vite', 'tailwind', 'ui', 'spa', 'web'],
    evidence: ['My-Game-Theory-Lab — React/Vite', 'yananer.dev — this site'],
  },
  {
    id: 'testing-ci',
    label: 'Testing & CI',
    keywords: ['testing', 'tests', 'unit test', 'ci', 'continuous integration', 'pytest', 'vitest'],
    evidence: ['Slack-Workflow-Engine — tests/ (15+), .github/workflows/ci.yml', 'My-Game-Theory-Lab — Vitest'],
  },
  {
    id: 'quant',
    label: 'Quant / finance domain',
    keywords: ['quant', 'finance', 'fx', 'trading', 'risk', 'portfolio', 'market', 'sec filings'],
    evidence: ['FX-Risk-Engine — multi-currency risk, P&L, exposure'],
  },
  {
    id: 'cloud',
    label: 'Cloud / AWS',
    keywords: ['cloud', 'aws', 's3'],
    evidence: ['Petlyst-Web — AWS S3', 'AWS Cloud Practitioner certified'],
  },
  {
    id: 'mobile',
    label: 'Mobile (iOS / SwiftUI)',
    keywords: ['mobile', 'ios', 'swift', 'swiftui'],
    evidence: ['Themis — live on the App Store (closed-source): offline-first SwiftUI iOS client + StoreKit'],
  },
  {
    id: 'oss',
    label: 'Open-source contribution in large codebases',
    keywords: ['open source', 'oss', 'contribution', 'pull request', 'large codebase'],
    evidence: ['elastic/kibana — merged PR #268326'],
  },
]
