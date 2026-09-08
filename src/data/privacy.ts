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
    ],
  },
  {
    heading: 'What is not',
    body: [
      'No cookies, and no advertising or third-party analytics of any kind.',
      'Your IP address is never stored. The server has to see it to answer the request; nothing is written down from it.',
      'If you use the contact form, the names of the fields you touched are recorded -- never what you typed into them.',
      'There is no way to tell that two visits came from the same person. The identifier below is thrown away when you close the tab, and nothing else is kept that could join them up.',
    ],
  },
  {
    heading: 'The one thing stored on your device',
    body: [
      'A random identifier, held in your browser for as long as the tab is open and deleted when you close it. It is not a cookie and it is not sent anywhere except this site. Its only job is to keep one visit together so "how far down did this person read" has an answer.',
    ],
  },
  {
    heading: 'Turning it off',
    body: [
      'If your browser sends Global Privacy Control or Do Not Track, nothing is collected at all -- no setting needed here.',
      "Otherwise, run localStorage.ya_optout = '1' in the browser console and this site will stop measuring you.",
    ],
  },
  {
    heading: 'The contact form',
    body: [
      `Sending a message passes your address, subject and message through EmailJS, which delivers it to ${profile.email}. That is the only time anything you type leaves your browser, and it only happens when you press send.`,
    ],
  },
]
