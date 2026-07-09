# yananer.dev

My personal portfolio — a single-page, bento-grid site with a dark theme, live GitHub
contributions graph, and an EmailJS-powered contact form. Built with React, TypeScript,
Vite, and Tailwind CSS v4, and deployed to Cloudflare Pages.

🔗 **Live:** [yananer.dev](https://yananer.dev)

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 6
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **GitHub graph:** [`react-github-calendar`](https://github.com/grubersjoe/react-github-calendar)
- **Contact form:** [EmailJS](https://www.emailjs.com/) (`@emailjs/browser`)
- **Icons:** Heroicons + inline SVG
- **Hosting:** Cloudflare Pages (Git integration — auto-builds on push to `main`)

There is no router and no blog — the whole site renders as one page composed of grid cards.

## Project Structure

```
yananer.dev/
├── public/
│   ├── robots.txt
│   └── _redirects                  # Cloudflare Pages SPA fallback (/* -> index.html)
├── src/
│   ├── main.tsx                    # Entry point (mounts <App/> in StrictMode)
│   ├── App.tsx                     # Full-screen dark shell, renders <Home/>
│   ├── index.css                   # Global resets + Tailwind import
│   ├── pages/
│   │   └── Home.tsx                # Responsive bento grid layout
│   ├── components/
│   │   ├── EmailPopup.tsx          # Contact form modal (EmailJS)
│   │   ├── Footer.tsx
│   │   └── grids/
│   │       ├── AboutMe.tsx         # Photo, animated status badge, social links
│   │       ├── Education.tsx
│   │       ├── WorkExperience.tsx  # Timeline of roles with scroll-fade edges
│   │       ├── TechStack.tsx       # Skill cards
│   │       └── GitHubContributions.tsx  # Contribution calendar + page-peel link
│   └── assets/                     # Profile photo, résumé PDF
├── index.html                      # HTML shell + SEO/Open Graph meta tags
├── vite.config.ts
└── tailwind.config.js
```

Site content (work experience, education, skills, links) is hard-coded directly in the
grid components — there is no CMS or content layer.

## Getting Started

### Prerequisites

- Node.js 18+
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
npm run build        # Type-check (tsc -b) and build to dist/
npm run preview      # Preview the production build
npm run lint         # Run ESLint
```

## Deployment

Hosted on **Cloudflare Pages** with Git integration: pushing to `main` triggers a build
(`npm run build`, output `dist/`) with the EmailJS env vars injected from the Pages
project settings. SPA routing is handled by `public/_redirects` (`/* -> /index.html`).
Custom domains `yananer.dev` and `www.yananer.dev` (www 301-redirects to the apex) are
managed in Cloudflare. The remote MCP server is a separate Cloudflare Worker — see
[`mcp/`](mcp/).

## License

See [LICENSE](LICENSE).

---

Made by [Umut Dinçer Yananer](https://yananer.dev)
