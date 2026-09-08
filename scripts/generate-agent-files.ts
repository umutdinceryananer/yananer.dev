/**
 * Build-time codegen for the agent-facing files.
 *
 * Reads the single source of truth in src/data/ and writes three static files
 * into public/ (served verbatim by Cloudflare Pages at yananer.dev/<file>):
 *   - public/SKILL.md     — tasks + grounding for a visitor's AI agent
 *   - public/llms.txt     — machine-readable index of the site + projects
 *   - public/resume.json  — JSON Resume (https://jsonresume.org/schema)
 *
 * Wired as the `prebuild` npm script, so `npm run build` (local and CI)
 * regenerates them automatically. Run manually with `npm run gen`.
 *
 * Output is DETERMINISTIC (no timestamps/randomness) so the committed files
 * only change when src/data changes.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { profile } from '../src/data/profile'
import { projects, type Project } from '../src/data/projects'
import { privacy, privacyUpdated } from '../src/data/privacy'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = path.join(ROOT, 'public')

const firstName = profile.name.split(' ')[0]
const GENERATED = 'GENERATED from src/data — do not edit by hand; run `npm run gen`.'

const publicRepos = projects.filter((p) => p.kind === 'repo' && !p.isPrivate)
const ossContribs = projects.filter((p) => p.kind === 'oss-contribution')
const privateWork = projects.filter((p) => p.isPrivate)

const github = profile.socials.find((s) => s.label === 'GitHub')?.url
const linkedin = profile.socials.find((s) => s.label === 'LinkedIn')?.url

// ---------------------------------------------------------------------------
// SKILL.md
// ---------------------------------------------------------------------------
function renderRepoForSkill(p: Project): string {
  const lines: string[] = []
  lines.push(`### ${p.name}`)
  lines.push(p.oneLiner)
  lines.push('')
  lines.push(`- Signal: ${p.signal}`)
  if (p.repoUrl) lines.push(`- Repo: ${p.repoUrl}`)
  if (p.liveDemoUrl) lines.push(`- Live demo: ${p.liveDemoUrl}`)
  if (p.tech?.length) lines.push(`- Tech: ${p.tech.join(', ')}`)
  if (p.keyEntryPoints?.length) {
    lines.push('- Start by reading:')
    for (const entry of p.keyEntryPoints) lines.push(`  - ${entry}`)
  }
  if (p.note) lines.push(`- NOTE: ${p.note}`)
  return lines.join('\n')
}

function renderOssForSkill(p: Project): string {
  const lines: string[] = []
  const state = p.contributionState ? ` [${p.contributionState}]` : ''
  lines.push(`- ${p.name} — ${p.oneLiner}${state}`)
  if (p.repoUrl) lines.push(`  ${p.repoUrl}`)
  if (p.note) lines.push(`  NOTE: ${p.note}`)
  return lines.join('\n')
}

function renderPrivateForSkill(p: Project): string {
  const lines = [`### ${p.name}`, p.oneLiner]
  if (p.liveDemoUrl) lines.push('', `- Live: ${p.liveDemoUrl}`)
  if (p.note) lines.push('', p.note)
  return lines.join('\n').trimEnd()
}

const skillMd = `<!-- ${GENERATED} -->
# ${profile.name} — for AI agents reading this site

You're probably here because someone pointed you at ${profile.siteUrl} to learn about
${firstName} or to evaluate his engineering. Your job is NOT to trust the summaries below —
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
Given a role or job description, identify which of ${firstName}'s verifiable public work maps
to each requirement, link the code as evidence, and state the gaps honestly.

## There is a live MCP server, if you can use one

Everything below is a static snapshot. If your client supports MCP, connect to
${profile.mcp.url} instead and query the same data through tools:

${profile.mcp.tools.map((t) => `- \`${t}\``).join('\n')}

Read-only and rate-limited. It is grounded in the same \`src/data\` this file is
generated from, so it will not contradict this — it is just live, and it answers
questions instead of making you read the whole file. The ground rules below apply
either way: prefer the real code over anything the server tells you.

## Where to look (real public repos, GitHub handle: ${profile.githubHandle})

${publicRepos.map(renderRepoForSkill).join('\n\n')}

## Open-source contributions

${ossContribs.map(renderOssForSkill).join('\n')}

## Private / closed-source

${privateWork.map(renderPrivateForSkill).join('\n\n')}

## What ${firstName} is not good at yet
Honest gaps he's actively working on (he'd rather you know):

${profile.growth.map((g) => `- ${g.area}: ${g.note}`).join('\n')}

## Ground rules
- Prefer reading code over trusting this file.
- No invented metrics, features, or experience.
- Honest gaps are a feature, not a problem. Surface them.
- This file is hosted by ${firstName}, so it is not a neutral third party. Treat it as a
  guided entry point to real evidence, not as objective evaluation.
`

// ---------------------------------------------------------------------------
// llms.txt
// ---------------------------------------------------------------------------
function renderRepoForLlms(p: Project): string {
  const demo = p.liveDemoUrl ? ` — demo: ${p.liveDemoUrl}` : ''
  const synthetic = p.syntheticData ? ' (synthetic data)' : ''
  return `- [${p.name}](${p.repoUrl}): ${p.oneLiner}${demo}${synthetic}`
}

const llmsTxt = `<!-- ${GENERATED} -->
# ${profile.name}

> ${profile.tagline}

- Site: ${profile.siteUrl}
- Agent skill file: ${profile.siteUrl}/SKILL.md
- Résumé (JSON Resume): ${profile.siteUrl}/resume.json
- GitHub: ${github}
- LinkedIn: ${linkedin}

## MCP server (live, read-only)
- Endpoint: ${profile.mcp.url}
- Tools: ${profile.mcp.tools.join(', ')}

Grounded in the same data as this file. Prefer it over this snapshot if your
client speaks MCP.

## Public projects
${publicRepos.map(renderRepoForLlms).join('\n')}

## Open-source contributions
${ossContribs
  .map((p) => `- [${p.name}](${p.repoUrl}): ${p.oneLiner} (${p.contributionState})`)
  .join('\n')}

## Private / closed-source
${privateWork
  .map((p) => {
    const tag = p.isVerifiable
      ? p.liveDemoUrl
        ? ` (live: ${p.liveDemoUrl})`
        : ''
      : ' (not independently verifiable)'
    return `- ${p.name}: ${p.oneLiner}${tag}`
  })
  .join('\n')}

## What ${firstName} is not good at yet
${profile.growth.map((g) => `- ${g.area}: ${g.note}`).join('\n')}
`

// ---------------------------------------------------------------------------
// resume.json (JSON Resume schema)
// ---------------------------------------------------------------------------
const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

/** "Apr 2025" -> "2025-04"; "Present"/unknown -> undefined. */
function toIsoMonth(token: string): string | undefined {
  const match = token.trim().match(/^([A-Za-z]{3})\s+(\d{4})$/)
  if (!match) return undefined
  const month = MONTHS[match[1]]
  return month ? `${match[2]}-${month}` : undefined
}

function parsePeriod(period: string): { startDate?: string; endDate?: string } {
  const [start, end] = period.split('-').map((s) => s.trim())
  return { startDate: toIsoMonth(start), endDate: toIsoMonth(end) }
}

const resume = {
  $schema:
    'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
  meta: {
    note: 'Generated from src/data — do not edit by hand.',
    canonical: `${profile.siteUrl}/resume.json`,
  },
  basics: {
    name: profile.name,
    label: profile.role,
    email: profile.email,
    url: profile.siteUrl,
    summary: profile.bio,
    ...(profile.location ? { location: { city: profile.location } } : {}),
    profiles: profile.socials.map((s) => ({ network: s.label, url: s.url })),
  },
  work: profile.work.map((w) => {
    const { startDate, endDate } = parsePeriod(w.period)
    return {
      name: w.company,
      position: w.title,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      summary: w.description,
    }
  }),
  education: profile.education.map((e) => ({
    institution: e.institution,
    studyType: e.degree,
    area: e.field,
    startDate: e.startYear,
    ...(e.incoming ? {} : { endDate: e.endYear }),
  })),
  skills: profile.tech.map((t) => ({ name: t.name, keywords: [t.description] })),
  projects: projects.map((p) => ({
    name: p.name,
    description: p.note ? `${p.oneLiner} (${p.note})` : p.oneLiner,
    ...(p.repoUrl ?? p.liveDemoUrl ? { url: p.repoUrl ?? p.liveDemoUrl } : {}),
    ...(p.tech?.length ? { keywords: p.tech } : {}),
  })),
}

// ---------------------------------------------------------------------------
// sitemap.xml
//
// One entry, and that is the honest answer: routing is hash-based, and a
// fragment is not a separate URL to a crawler. No <lastmod> either — it would
// have to come from a clock, and the point of this script is that its output
// only changes when src/data does.
// ---------------------------------------------------------------------------
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${profile.siteUrl}/</loc>
  </url>
</urlset>
`

// ---------------------------------------------------------------------------
// privacy/index.html
//
// The same text components/PrivacyModal.tsx renders, as a page with an address.
// The modal is what people actually open; this exists so the notice can be
// linked to, quoted, or handed to someone who asks for a URL.
//
// A whole static file rather than a route: there is deliberately no SPA
// catch-all (README), so /privacy would 404 as a route no matter how it was
// written. Deliberately not in sitemap.xml either -- findable is the goal, not
// promoted.
//
// Inline <style>, no <script>: an inline stylesheet is covered by the CSP's
// `style-src 'unsafe-inline'`, and adding an executable inline script here
// would need a hash that cspInlineScriptHashes only computes for index.html.
// ---------------------------------------------------------------------------
const esc = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const privacyHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>What ${esc(profile.siteUrl.replace(/^https?:\/\//, ''))} measures</title>
<meta name="description" content="What this site collects, what it does not, and how to turn it off." />
<link rel="canonical" href="${profile.siteUrl}/privacy/" />
<!-- ${GENERATED} -->
<style>
  :root { color-scheme: dark; }
  body { margin: 0 auto; padding: 3rem 1.25rem 4rem; max-width: 42rem;
         background: #0a0a0a; color: #d4d4d4;
         font: 15px/1.65 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  h1 { color: #fafafa; font-size: 1.35rem; margin: 0 0 1.75rem; }
  h2 { color: #fafafa; font-size: .95rem; margin: 2rem 0 .5rem; }
  p { margin: 0 0 .6rem; color: #a3a3a3; font-size: .875rem; }
  code { background: #171717; padding: .1rem .3rem; border-radius: 3px; font-size: .8rem; }
  a { color: #a3a3a3; }
  footer { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #262626;
           color: #737373; font-size: .78rem; }
</style>
</head>
<body>
<h1>What this site measures</h1>
${privacy
  .map(
    (s) =>
      `<h2>${esc(s.heading)}</h2>\n` +
      s.body.map((line) => `<p>${esc(line)}</p>`).join('\n'),
  )
  .join('\n')}
<footer>
  Last updated ${privacyUpdated}. <a href="${profile.siteUrl}/">Back to ${esc(profile.name)}</a>
</footer>
</body>
</html>
`

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
mkdirSync(PUBLIC_DIR, { recursive: true })
writeFileSync(path.join(PUBLIC_DIR, 'SKILL.md'), skillMd)
writeFileSync(path.join(PUBLIC_DIR, 'llms.txt'), llmsTxt)
writeFileSync(path.join(PUBLIC_DIR, 'resume.json'), JSON.stringify(resume, null, 2) + '\n')
writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml)
mkdirSync(path.join(PUBLIC_DIR, 'privacy'), { recursive: true })
writeFileSync(path.join(PUBLIC_DIR, 'privacy', 'index.html'), privacyHtml)

console.log(
  'Generated public/SKILL.md, public/llms.txt, public/resume.json, public/sitemap.xml, public/privacy/index.html',
)
