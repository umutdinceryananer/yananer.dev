/**
 * Turning stored keys into something a person can read.
 *
 * The keys themselves are permanent -- they are what click rows are written
 * against, and renaming one detaches its history. So the translation lives here,
 * in the presentation layer, where it is free to change as often as the wording
 * deserves. `work.card.demo:my-game-theory-lab` in the database, "My Game Theory
 * Lab — Enter Lab" on the page.
 *
 * Project names come from src/data/projects.ts rather than being copied, so a
 * project renamed there is renamed here too while its key, and therefore its
 * history, stays put. That is the whole reason the id was made permanent.
 */

import { projects } from '../../src/data/projects'

/** A key is `name` or `name:instance`. */
function split(key: string): [string, string | undefined] {
  const i = key.indexOf(':')
  return i < 0 ? [key, undefined] : [key.slice(0, i), key.slice(i + 1)]
}

/** Prettifies an id nobody wrote for human eyes: fx-risk-engine -> Fx Risk Engine. */
const titleCase = (s: string) =>
  s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const projectName = (id: string) =>
  projects.find((p) => p.id === id)?.name ?? titleCase(id)

/** Names with no instance. */
const PLAIN: Record<string, string> = {
  'nav.theme': 'Theme toggle',
  'about.contact': 'Contact button',
  'about.mcp': '"Connect your AI" button',
  'about.tech.tooltip': 'Skills — "used here" dot',
  'footer.source': 'Footer — source code',
  'footer.privacy': 'Footer — privacy',
  'work.demo.newtab': 'Demo — open in new tab',
  'work.demo.close': 'Demo — close',
  'work.decision.row': 'Decisions — expand a row',
  'work.decisions.close': 'Decisions — close',
  'mcp.close': 'AI dialog — close',
  'mail.close': 'Contact form — close',
  'mail.copy': 'Contact form — copy the address',
  'mail.cancel': 'Contact form — cancel',
  'mail.submit': 'Contact form — send',
  'privacy.close': 'Privacy — close',
  'privacy.optout': 'Privacy — the opt-out switch',
}

/** Names whose instance is a project id. */
const PER_PROJECT: Record<string, string> = {
  'work.card.repo': 'repo',
  'work.card.demo': 'Enter Lab',
  'work.card.live': 'live',
  'work.card.decisions': 'decisions',
}

/** Names whose instance is a small fixed set. */
const PER_INSTANCE: Record<string, Record<string, string>> = {
  'nav.tab': { about: 'Nav — About tab', work: 'Nav — Work tab' },
  'about.social': { linkedin: 'LinkedIn link', github: 'GitHub link' },
  'about.tech.view': { skills: 'Skills — Skills tab', growth: 'Skills — Not Yet tab' },
  'mcp.copy': {
    'skill-prompt': 'AI dialog — copy the SKILL.md prompt',
    endpoint: 'AI dialog — copy the MCP endpoint',
  },
  'mcp.link': {
    'skill-md': 'AI dialog — SKILL.md link',
    'llms-txt': 'AI dialog — llms.txt link',
    'resume-json': 'AI dialog — resume.json link',
  },
  showmore: {
    'work-experience': '"Show more" — work experience',
    'tech-stack': '"Show more" — skills',
  },
  'mail.field': { from: 'Contact — your address', subject: 'Contact — subject', message: 'Contact — message' },
}

/**
 * A readable name for a stored key.
 *
 * Falls back to the key itself rather than to something invented: an unknown key
 * means either a target added without a label here, or the `?tag` the tracker
 * emits for an element with no data-ya at all. Both are worth seeing as they
 * are, and dressing them up would hide the second one.
 */
export function label(key: string): string {
  const [name, instance] = split(key)

  if (instance !== undefined) {
    const perInstance = PER_INSTANCE[name]?.[instance]
    if (perInstance) return perInstance

    const what = PER_PROJECT[name]
    if (what) return `${projectName(instance)} — ${what}`

    if (name === 'work.now') return `"Now" card — ${instance}`
  }

  return PLAIN[name] ?? key
}
