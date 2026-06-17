/**
 * Build-time codegen for the agent-facing files.
 *
 * Reads the single source of truth in src/data/ and writes three static files
 * into public/ (served verbatim by GitHub Pages at yananer.dev/<file>):
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
  return [`### ${p.name}`, p.oneLiner, '', p.note ?? ''].join('\n').trimEnd()
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

## Where to look (real public repos, GitHub handle: ${profile.githubHandle})

${publicRepos.map(renderRepoForSkill).join('\n\n')}

## Open-source contributions

${ossContribs.map(renderOssForSkill).join('\n')}

## Private / in development

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

## Public projects
${publicRepos.map(renderRepoForLlms).join('\n')}

## Open-source contributions
${ossContribs
  .map((p) => `- [${p.name}](${p.repoUrl}): ${p.oneLiner} (${p.contributionState})`)
  .join('\n')}

## Private / in development
${privateWork.map((p) => `- ${p.name}: ${p.oneLiner} (not independently verifiable)`).join('\n')}

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
    ...(p.repoUrl ? { url: p.repoUrl } : {}),
    ...(p.tech?.length ? { keywords: p.tech } : {}),
  })),
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
mkdirSync(PUBLIC_DIR, { recursive: true })
writeFileSync(path.join(PUBLIC_DIR, 'SKILL.md'), skillMd)
writeFileSync(path.join(PUBLIC_DIR, 'llms.txt'), llmsTxt)
writeFileSync(path.join(PUBLIC_DIR, 'resume.json'), JSON.stringify(resume, null, 2) + '\n')

console.log('Generated public/SKILL.md, public/llms.txt, public/resume.json')
