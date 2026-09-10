/**
 * What this site collects, as data rather than as markup.
 *
 * Single source, two renderings: components/PrivacyModal.tsx shows it in the
 * page, and scripts/generate-agent-files.ts emits public/privacy/index.html
 * from the same array so the text also has a real URL. That is the same pattern
 * profile.ts and projects.ts already carry -- the thing exists once, and the
 * two places it appears cannot drift.
 *
 * Deliberately short, and deliberately not shoved in anyone's face: one small
 * link in the footer. The obligation is that someone looking for this can find
 * it, not that everyone has to read it before seeing the page.
 *
 * Written to be read, not to be survived -- plain sentences, and it names the
 * durable identifier rather than describing it as a technical detail. That
 * identifier was added after the first version of this file, which promised the
 * opposite; a notice that quietly kept describing the older, cleaner design
 * would be worse than having none.
 */

import { profile } from './profile'

export interface PrivacySection {
  heading: string
  body: string[]
}

export const privacyUpdated = '2026-09'

export const privacy: PrivacySection[] = [
  {
    heading: 'What is measured',
    body: [
      'Which of the two views you open, how long each was on screen, how far you scroll, and the names of the things you click — "the contact button", not what you typed.',
      'Once per visit: screen size, timezone, browser language, colour theme, and the site that linked you here.',
    ],
  },
  {
    heading: 'What is not',
    body: [
      'No cookies, no advertising, no third-party analytics. Your IP address is never stored. If you use the contact form, the names of the fields you touched are recorded — never their contents.',
    ],
  },
  {
    heading: 'Stored on your device',
    body: [
      'Two random identifiers, and nothing else. One lasts until you close the tab. The other lasts thirteen months and is what tells this site you have been here before — a durable identifier, named here rather than buried.',
      'Nothing collected is kept longer than ninety days.',
    ],
  },
  {
    heading: 'Turning it off',
    body: [
      'Use the switch below. If your browser sends Do Not Track or Global Privacy Control, nothing is collected in the first place.',
    ],
  },
  {
    heading: 'The contact form',
    body: [
      `Sending a message passes it through EmailJS to reach ${profile.email}. That is the only time anything you type leaves your browser.`,
    ],
  },
]
