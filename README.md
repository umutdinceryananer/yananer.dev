# yananer.dev

My personal portfolio — a single-page, bento-grid site with a dark theme, live GitHub
contributions graph, and an EmailJS-powered contact form. Built with React, TypeScript,
Vite, and Tailwind CSS v4, and deployed to GitHub Pages.

🔗 **Live:** [yananer.dev](https://yananer.dev)

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 6
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **GitHub graph:** [`react-github-calendar`](https://github.com/grubersjoe/react-github-calendar)
- **Contact form:** [EmailJS](https://www.emailjs.com/) (`@emailjs/browser`)
- **Icons:** Heroicons + inline SVG
- **Hosting:** GitHub Pages via GitHub Actions (custom domain through `CNAME`)

There is no router and no blog — the whole site renders as one page composed of grid cards.

## Project Structure

```
yananer.dev/
├── .github/workflows/
│   └── deploy.yml                  # Build + deploy to GitHub Pages on push to main
├── public/
│   └── robots.txt
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
├── tailwind.config.js
└── CNAME                           # Custom domain (yananer.dev)
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

In CI/production these are provided as GitHub Actions secrets (see `deploy.yml`).

## Scripts

```bash
npm run dev          # Start the dev server (port 3000)
npm run build        # Type-check (tsc -b) and build to dist/
npm run preview      # Preview the production build
npm run lint         # Run ESLint
npm run deploy       # Manual deploy to GitHub Pages (gh-pages -d dist)
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which installs deps, builds
the site (injecting the EmailJS secrets), copies `index.html` to `404.html` for SPA
fallback, writes the `CNAME`, and publishes the `dist/` folder to GitHub Pages.

## License

See [LICENSE](LICENSE).

---

Made by [Umut Dinçer Yananer](https://yananer.dev)
