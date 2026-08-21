# yananer.dev

My personal portfolio — a two-view, bento-grid site in a monochrome dark palette, with a
live GitHub contributions graph, an EmailJS-powered contact form, and a machine-readable
surface for AI agents. Built with React, TypeScript, Vite, and Tailwind CSS v4, and
deployed to Cloudflare Pages.

🔗 **Live:** [yananer.dev](https://yananer.dev)

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 6
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) — no `tailwind.config.js`; the theme
  lives in `@theme` inside `src/index.css`
- **Type:** DM Sans (Google Fonts, variable)
- **GitHub graph:** [`react-activity-calendar`](https://github.com/grubersjoe/react-activity-calendar),
  fed by our own fetch (`src/lib/useContributions.ts`)
- **Contact form:** [EmailJS](https://www.emailjs.com/) (`@emailjs/browser`)
- **Icons:** inline SVG only
- **Hosting:** Cloudflare Pages (Git integration — auto-builds on push to `main`)

There is no router and no blog. Two views — About Me and Work — swap on a hash change
(`#about` / `#work`), each composed of grid cards.

## Content lives in `src/data`

`src/data/{profile,projects,decisions}.ts` is the single source of truth. Nothing about
me is typed into a component, and three separate outputs are derived from it:

- the **site itself** — every grid card reads from it;
- the **`<head>`** — `vite.config.ts` has an `htmlHeadMeta` plugin that generates the
  SEO, Open Graph and JSON-LD tags at build time and substitutes them into the
  `<!--app-head-meta-->` placeholder in `index.html`. Do not hand-edit those tags;
- the **agent files** — see below.

## Agent-facing surface

The site is meant to be legible to an AI agent, not just a person. `npm run gen`
(wired as `prebuild`, so any build refreshes it) reads `src/data` and writes:

| File | What it is |
| --- | --- |
| [`public/SKILL.md`](public/SKILL.md) | Tasks and grounding for a visitor's agent — deliberately tells it to verify claims against the real code rather than trust the summaries |
| [`public/llms.txt`](public/llms.txt) | Machine-readable index of the site and its projects |
| [`public/resume.json`](public/resume.json) | [JSON Resume](https://jsonresume.org/schema) |

Output is deterministic — no timestamps — so the committed files only change when
`src/data` does.

Beyond the static files there is a **remote MCP server** in [`mcp/`](mcp/), deployed
separately as a Cloudflare Worker. Visitors point their own Claude or ChatGPT at it and
call read-only tools (`get_profile`, `list_projects`, `explain_decision`,
`run_tournament`, and others) grounded in the same data. The **MCP** button on the About
card explains how to connect.

## Design tokens

Everything the site paints reads a token declared in `@theme` in `src/index.css`, so the
whole look changes from one block:

| Token | Role |
| --- | --- |
| `surface-0` … `surface-4` | Stacked backgrounds, page through hover |
| `ink` | Brightest text |
| `accent-200` … `accent-700` | The accent scale (a neutral grey; the site has no hue) |
| `accent-fg` | Text sitting on a solid accent fill |
| `gray-*` | Tailwind's own scale, redefined pure-neutral and a shade deeper |

Status colours (green for live, red for private, amber for in-progress) and GitHub's own
contribution greens are the deliberate exceptions.

## Project Structure

```
yananer.dev/
├── public/
│   ├── robots.txt
│   ├── _headers                    # Cloudflare Pages response headers (incl. CSP)
│   ├── 404.html                    # Served for unknown paths
│   ├── SKILL.md                    # GENERATED — see `npm run gen`
│   ├── llms.txt                    # GENERATED
│   └── resume.json                 # GENERATED
├── scripts/
│   └── generate-agent-files.ts     # Codegen for the three files above
├── mcp/                            # Remote MCP server (separate Cloudflare Worker)
├── src/
│   ├── main.tsx                    # Entry point (mounts <App/> in StrictMode)
│   ├── App.tsx                     # Shell: hash routing, nav, footer, route cross-fade
│   ├── index.css                   # Design tokens (@theme), global resets, keyframes
│   ├── data/
│   │   ├── profile.ts              # Bio, work, education, skills, socials
│   │   ├── projects.ts             # Public repos, OSS work, private projects
│   │   └── decisions.ts            # Architecture decisions behind the private work
│   ├── lib/
│   │   ├── useContributions.ts     # GitHub contribution data
│   │   ├── useLatestRelease.ts     # Live release tag for actively-released repos
│   │   ├── useDialogTransition.ts  # Dialog enter/exit + shared dialog chrome
│   │   ├── useSwapTransition.ts    # View cross-fade + shared classes
│   │   └── usePrefersReducedMotion.ts
│   ├── pages/
│   │   ├── Home.tsx                # About Me — responsive bento grid
│   │   └── Projects.tsx            # Work — projects, demo overlay, decisions overlay
│   ├── components/
│   │   ├── TopNav.tsx              # Two tabs with a sliding highlight
│   │   ├── EmailPopup.tsx          # Contact form modal (EmailJS)
│   │   ├── McpModal.tsx            # How to connect an AI to this site
│   │   ├── Footer.tsx
│   │   └── grids/
│   │       ├── AboutMe.tsx         # Photo, animated status badge, social links
│   │       ├── Education.tsx
│   │       ├── WorkExperience.tsx  # Timeline of roles with scroll-fade edges
│   │       ├── TechStack.tsx       # Skills / Not Yet, cross-faded
│   │       └── GitHubContributions.tsx
│   └── assets/                     # Profile photo
├── index.html                      # HTML shell; <head> meta is generated at build time
└── vite.config.ts
```

Every modal is portalled to `<body>`, so no ancestor transform can shrink an overlay to
its own box.

## Getting Started

### Prerequisites

- Node.js 18+ (Vite 6 requires `^18 || ^20 || >=22`)
- npm

### Install & run

```bash
npm install
npm run dev          # http://localhost:3000
```

### Environment variables

The contact form needs EmailJS credentials. Copy `.env.example` to `.env` and fill in:

```bash
VITE_EMAILJS_PUBLIC_KEY="your_public_key_here"
VITE_EMAILJS_SERVICE_ID="your_service_id_here"
VITE_EMAILJS_TEMPLATE_ID="your_template_id_here"
```

In production these are set as environment variables in the Cloudflare Pages project
settings (Production + Preview), so the build injects them at deploy time.

## Scripts

```bash
npm run dev          # Start the dev server (port 3000)
npm run gen          # Regenerate public/SKILL.md, llms.txt, resume.json from src/data
npm run build        # prebuild (gen) → type-check (tsc -b) → build to dist/
npm run preview      # Preview the production build
npm run lint         # Run ESLint
```

## Deployment

Hosted on **Cloudflare Pages** with Git integration: pushing to `main` triggers a build
(`npm run build`, output `dist/`) with the EmailJS env vars injected from the Pages
project settings. Routing is hash-based (`#about` / `#work`), so there is deliberately
no SPA catch-all: unknown paths return a real 404 (`public/404.html`) instead of the app
shell, which keeps vulnerability-scanner noise out of the pageview stats.
Custom domains `yananer.dev` and `www.yananer.dev` (www 301-redirects to the apex) are
managed in Cloudflare. The remote MCP server is a separate Cloudflare Worker — see
[`mcp/`](mcp/).

## License

See [LICENSE](LICENSE).

---

Made by [Umut Dinçer Yananer](https://yananer.dev)
