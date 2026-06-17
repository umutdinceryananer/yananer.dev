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

## Run locally
```bash
npm install
npm start                      # http://localhost:8787/mcp  (+ /healthz)
npm run typecheck
```
Inspect with the MCP Inspector → Streamable HTTP, URL `http://localhost:8787/mcp`:
```bash
npx @modelcontextprotocol/inspector
```

## Env
| Var | Default | Notes |
| --- | --- | --- |
| `PORT` | `8787` | listen port |
| `ALLOWED_HOSTS` | `mcp.yananer.dev,localhost,127.0.0.1` | DNS-rebinding allowlist (Host header); include `host:port` forms when testing locally |

## Docker
```bash
# build from the REPO ROOT (needs src/data in context)
docker build -f mcp/Dockerfile -t yananer-mcp .
docker run --rm -p 8787:8787 yananer-mcp
```

## Deployment
Runs in **Zone A** of the homelab, exposed at `mcp.yananer.dev` via Cloudflare Tunnel
(no open ports). See the [My-AI-Homelab](https://github.com/umutdinceryananer/My-AI-Homelab)
repo for the host/network/ingress setup.
