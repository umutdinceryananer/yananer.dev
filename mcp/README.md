# yananer-mcp

A small **remote MCP server** for [yananer.dev](https://yananer.dev). Visitors connect their
own Claude / ChatGPT and call read-only tools grounded in my real project data.

Transport: **Streamable HTTP** (stateless). Public, read-only, rate-limited.

## Tools
| Tool | What it does |
| --- | --- |
| `get_profile` | Who Umut is — bio, current focus, experience, education, skills, and an honest "not good at yet" list. |
| `list_projects` | Public repos + OSS contributions + a clearly-marked private section. |
| `get_project(name)` | Structured detail + the key files to read first, for one repo. |
| `recommend_project(interest)` | Given an interest/focus area, the best-matching projects + why + files to read first. |
| `explain_decision(topic)` | A grounded architecture decision — decision, rationale, tradeoffs, alternatives — fuzzy-matched by topic. Public-repo entries cite real evidence files; sterilized Hisar ADRs are flagged self-reported / not independently verifiable. |
| `assess_fit(role)` | Maps Umut's verifiable work to a role / job description (capability → evidence) + honest gaps. Self-hosted: a guided pointer, not a neutral evaluation. |
| `run_tournament(config)` | **Actually runs** an Iterated Prisoner's Dilemma tournament (vendored My-Game-Theory-Lab engine) and returns standings. Seedable → reproducible. |
| `contact` | How to reach Umut — email + social links. |

## Data source
Project/profile data is imported from the repo's single source of truth
(`../src/data/{projects,profile}.ts`) — the same modules the site and `SKILL.md` use, so
nothing drifts. `explain_decision` reads `src/data/decisions.ts` (MCP-only). The tournament
engine is vendored under `engine/` (see `engine/VENDORED.md`).

## Hosting: Cloudflare Workers
Deployed as a **Cloudflare Worker** (`src/worker.ts`), served through `McpAgent`
(Streamable HTTP over a SQLite-backed Durable Object). Free-plan friendly.
Config lives in `wrangler.toml`; the tools/data are shared verbatim with the
Node path, so nothing drifts.

> **Requires Node.js ≥ 22** for Wrangler 4 (`nvm install 22 && nvm use 22`).

```bash
npm install
npm run dev                    # local Workers runtime → http://localhost:8787/mcp (+ /healthz)
npm run typecheck
```
Inspect with the MCP Inspector → Streamable HTTP, URL `http://localhost:8787/mcp`:
```bash
npx @modelcontextprotocol/inspector
```

### Deploy
```bash
npx wrangler login             # once — opens a browser, authorizes the account with the yananer.dev zone
npm run deploy                 # wrangler deploy → live at https://mcp.yananer.dev/mcp
```
`wrangler.toml` binds the hostname via `routes = [{ pattern = "mcp.yananer.dev",
custom_domain = true }]`, so Wrangler creates the DNS record + custom domain
automatically on first deploy. No manual dashboard DNS entry needed.

## Legacy Node/Express path (optional)
The original standalone server (`src/server.ts`) still works for a plain Node
host or Docker, and is kept for reference:
```bash
npm start                                        # http://localhost:8787/mcp
docker build -f mcp/Dockerfile -t yananer-mcp .  # build from REPO ROOT (needs src/data)
docker run --rm -p 8787:8787 yananer-mcp
```
Its env: `PORT` (default `8787`), `ALLOWED_HOSTS` (default
`mcp.yananer.dev,localhost,127.0.0.1`, DNS-rebinding allowlist).
