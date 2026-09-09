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
      'Which of the two views you open, how long each was actually on screen, how far down you scrolled, and the names of things you click -- "the contact button", not where on the screen your cursor was.',
      'Once per visit: screen and window size, timezone, browser language, colour theme, and the site that linked you here (its address only, never the search terms or tracking tags on the end of it).',
      'Whether you have been here before, and roughly how long ago. See below for how.',
    ],
  },
  {
    heading: 'What is not',
    body: [
      'No advertising, and no third-party analytics of any kind. Nothing here is shared with anyone.',
      'Your IP address is never stored. The server has to see it to answer the request; nothing is written down from it.',
      'If you use the contact form, the names of the fields you touched are recorded -- never what you typed into them.',
      'Nothing here has your name, your address, or anything you could be looked up by.',
    ],
  },
  {
    heading: 'What is stored on your device',
    body: [
      'Two random identifiers, and nothing else. Neither is a cookie, and neither is sent anywhere except this site.',
      'The first lasts until you close the tab. It keeps one visit together, so "how far down did this person read" has an answer.',
      'The second lasts thirteen months and then a new one replaces it. Its clock is set once, when it is created, and visiting again does not push it back. It is what lets this site tell that two visits came from the same browser -- so I can see whether people come back, rather than only how many arrive. It cannot tell who you are, and it is not joined to anything outside this site. But it is a durable identifier, and that is a real thing to store on someone else\'s device, so it is named here rather than buried.',
    ],
  },
  {
    heading: 'Turning it off',
    body: [
      'If your browser sends Global Privacy Control or Do Not Track, nothing is collected at all and neither identifier is created -- no setting needed here.',
      'Otherwise, use the switch at the bottom of this page. Measuring stops on this browser, and both identifiers are deleted straight away.',
      'Clearing your site data for this domain also removes them.',
    ],
  },
  {
    heading: 'The contact form',
    body: [
      `Sending a message passes your address, subject and message through EmailJS, which delivers it to ${profile.email}. That is the only time anything you type leaves your browser, and it only happens when you press send.`,
    ],
  },
]
