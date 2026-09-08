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
│   ├── resume.json                 # GENERATED
│   └── privacy/index.html          # GENERATED — what the site measures
├── scripts/
│   ├── generate-agent-files.ts     # Codegen for the generated files above
│   ├── prerender.ts                # Puts the rendered app inside <div id="root">
│   └── audit-analytics.ts          # Build-time checks; throws on silent failures
├── functions/
│   └── api/collect.ts              # Analytics collector (Cloudflare Pages Function)
├── analytics/
│   ├── schema.sql                  # D1 tables — `npm run db:init`
│   └── stats.sql                   # The dashboard, for now — `npm run stats`
├── mcp/                            # Remote MCP server (separate Cloudflare Worker)
├── src/
│   ├── main.tsx                    # Entry point (mounts <App/> and <Analytics/>)
│   ├── App.tsx                     # Shell: hash routing, nav, footer, route cross-fade
│   ├── index.css                   # Design tokens (@theme), global resets, keyframes
│   ├── data/
│   │   ├── profile.ts              # Bio, work, education, skills, socials
│   │   ├── projects.ts             # Public repos, OSS work, private projects
│   │   ├── decisions.ts            # Architecture decisions behind the private work
│   │   └── privacy.ts              # The privacy notice, rendered in two places
│   ├── lib/
│   │   ├── analytics/              # Wire contract, session identity, tracker
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
│   │   ├── PrivacyModal.tsx        # What the site measures, from the footer
│   │   ├── Analytics.tsx           # Boots the tracker; renders nothing
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

`VITE_ANALYTICS_ENDPOINT` turns the first-party tracker on. Leave it unset — locally, on a
fork, on a preview — and the tracker no-ops and folds out of the bundle entirely
(`npm run build` prints which of the two happened). In production it is `/api/collect`.

In production these are set as environment variables in the Cloudflare Pages project
settings (Production + Preview), so the build injects them at deploy time.

## Scripts

```bash
npm run dev          # Start the dev server (port 3000)
npm run gen          # Regenerate public/SKILL.md, llms.txt, resume.json from src/data
npm run build        # prebuild (gen) → type-check (tsc -b) → build to dist/
npm run preview      # Preview the production build
npm run lint         # Run ESLint
npm run db:init      # Apply analytics/schema.sql to the D1 database
npm run stats        # Run analytics/stats.sql and print the numbers
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

## Analytics

First-party, written here rather than bought: a tracker in the bundle
(`src/lib/analytics/`), a collector as a Pages Function (`functions/api/collect.ts`), and
D1 behind it. No cookies, no third-party script, and nothing stored that is derived from
an IP. What it collects is written out for visitors in `src/data/privacy.ts`, shown from
the footer and generated to `/privacy/`.

There are two identities. `ya_sid` is per-tab and dies with the tab; it holds one visit
together. `ya_vid` is per-browser and outlives the visit, which is what makes *does anyone
come back* answerable — and it is the one with real consent weight, since joining two
visits to one browser is what those rules are actually about. The first version of this
system deliberately had no such identifier; that was reversed on purpose, and both
`session.ts` and the privacy notice say so rather than describing the newer design as if
it had always been the plan. Opting out deletes both.

`ya_vid` expires after thirteen months and is **not** renewed on each visit. That number
comes from CNIL's audience-measurement exemption (Délibération 2020-092), the closest
thing in the EU to a rule permitting returning-visitor measurement without a consent
banner: first party only, purely statistical, no cross-site linkage, no third parties,
identifier capped at 13 months without renewal, derived data at 25 (the retention job
deletes at 90 days), the visitor informed, and a usable way to object. The privacy dialog
carries that last one as a switch — a console command is not a mechanism anyone can use.

None of which makes this settled. ePrivacy Art. 5(3) is technology-neutral, and EDPB
Guidelines 2/2023 put `localStorage` squarely inside it, so "not a cookie" is not a
defence. The CNIL exemption is French; the ICO requires consent for analytics regardless,
and Turkey's KVKK guidance treats analytics as needing explicit consent with no
equivalent carve-out. The Digital Omnibus would have added an EU-wide exemption for
first-party *aggregated* measurement, but as of September 2026 the Data Omnibus is still
in negotiation and the Council's text drops the cookie provisions. Whether this site
needs a consent banner is an open question, not a closed one — the design above is the
most defensible shape available without one.

It exists for one number Cloudflare Web Analytics cannot give: that product counts
document loads, and moving between `#about` and `#work` is a `hashchange`, so *does
anyone reach the Work tab* has never been answerable for this site.

The collector is same-origin on purpose. `connect-src 'self'` in `public/_headers`
already allows it, so no CSP edit was needed — and a CSP mistake here is the worst
failure this system has: `sendBeacon` returns `true` as soon as the payload is queued and
the policy check happens afterwards, so a blocked beacon produces no error and no data,
which looks exactly like a site nobody visits. `scripts/audit-analytics.ts` fails the
build if the endpoint ever names an origin the CSP does not list, along with five other
checks whose failure modes are all silent.

### One-time setup

Neither step is in this repo, and skipping either leaves a site that collects nothing
without saying so:

```bash
npx wrangler d1 create yananer-analytics    # note the database id it prints
npm run db:init                             # apply analytics/schema.sql
```

Then, in the Pages project settings: bind the database as **`ANALYTICS_DB`**, and set
**`VITE_ANALYTICS_ENDPOINT=/api/collect`** for Production. A rate-limiting WAF rule on
`/api/collect` is the abuse backstop — Pages Functions cannot carry the rate-limiter
binding that [`mcp/`](mcp/) uses.

### Reading the numbers

`npm run stats` runs `analytics/stats.sql`. There is no web dashboard yet, deliberately:
one built before any data exists is one designed around guesses. Two things the queries
say out loud and worth repeating — at this traffic a day-over-day change smaller than
about a third is Poisson noise, and a percentage whose denominator is under a hundred
sessions is reporting precision the data does not have.

## License

See [LICENSE](LICENSE).

---

Made by [Umut Dinçer Yananer](https://yananer.dev)
