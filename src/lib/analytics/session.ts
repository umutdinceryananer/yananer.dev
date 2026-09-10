import type { Route, SessionContext } from './types'
import { OPTOUT_EVENT, type OptOutDetail } from './emit'

/**
 * Session identity, and the decision about whether to collect at all.
 *
 * There are two identities here, and they answer different questions.
 *
 * `ya_sid` is per-tab and dies with the tab. It is what holds one visit
 * together, so "how far down did this person read" has an answer.
 *
 * `ya_vid` is per-browser and outlives the visit. It is what makes "has this
 * person been here before" answerable -- and it is the one that actually
 * matters legally, because linking two visits to one browser is the thing
 * consent rules are about. An earlier version of this file did not have it, and
 * said in as many words that not having it was the trade this site wanted. That
 * was reversed deliberately: the returning-visitor question turned out to be
 * worth the cost. This comment records the reversal rather than quietly
 * describing the new state as though it were always the plan.
 *
 * What is still true, and worth keeping true: the id is opaque and random, it
 * is sent nowhere but this site's own collector, the collector never stores
 * anything derived from an IP, and nothing about it is shared. What is no
 * longer true is that two visits cannot be joined up. They can. src/data/
 * privacy.ts says so plainly, because a notice that describes the old design
 * would be worse than no notice at all.
 *
 * optedOut() runs before either id is read, and clears both when it fires.
 */

const SID_KEY = 'ya_sid'
const VID_KEY = 'ya_vid'
const OPTOUT_KEY = 'ya_optout'

/** Reads the endpoint from the build env. Unset — local dev, a fork, a preview
    someone spun up — and the whole tracker no-ops rather than 404ing in a loop. */
export const ENDPOINT: string | undefined = import.meta.env.VITE_ANALYTICS_ENDPOINT

/**
 * Every reason not to collect, in one place.
 *
 * Do Not Track has been formally retired by the spec and most browsers, but the
 * people who still set it are exactly the people who mean it, and honouring a
 * header costs us nothing. Global Privacy Control is the live successor and is
 * legally binding in some jurisdictions. `webdriver` catches headless Chrome,
 * which is most of what would otherwise look like traffic.
 */
export function optedOut(): boolean {
  try {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
    if (nav.globalPrivacyControl === true) return true
    if (nav.doNotTrack === '1' || nav.msDoNotTrack === '1') return true
    if (nav.webdriver) return true
    // The visitor's own refusal, set by setOptedOut() from the privacy dialog.
    if (localStorage.getItem(OPTOUT_KEY) === '1') {
      // Refusing has to remove what was already stored, or opting out leaves
      // the durable identifier sitting on the device doing nothing -- the worst
      // of both: still stored, no longer useful, and contradicting the notice.
      forget()
      return true
    }
  } catch {
    // Storage throws outright in some privacy modes. A visitor locked down
    // enough to hit that is a visitor to leave alone.
    return true
  }
  return false
}

/** `randomUUID` needs a secure context, which every real visit is; the fallback
    exists for `http://` on a LAN address during development. */
const newId = (): string =>
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/**
 * The id for this tab.
 *
 * Reused within the tab so a reload does not read as a second visitor, thrown
 * away with it.
 */
export function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SID_KEY)
    if (existing) return existing
    const id = newId()
    sessionStorage.setItem(SID_KEY, id)
    return id
  } catch {
    return `eph-${Math.random().toString(36).slice(2, 12)}`
  }
}

/**
 * Removes both identities from the device. Safe to call at any time.
 *
 * Used by the opt-out path, and worth having as an export: it is the honest
 * implementation of the sentence in the privacy notice that says the visitor
 * can make this stop.
 */
export function forget(): void {
  try {
    localStorage.removeItem(VID_KEY)
    sessionStorage.removeItem(SID_KEY)
  } catch {
    // Nothing to remove in an environment that will not let us look.
  }
}

/**
 * Thirteen months, and it is not an arbitrary number.
 *
 * CNIL's audience-measurement exemption (Délibération 2020-092) is the closest
 * thing in the EU to a rule that lets a site like this one measure returning
 * visitors without a consent banner, and it caps the identifier's life at
 * thirteen months with no renewal on each visit. Data derived from it is capped
 * at twenty-five; the retention job here deletes at ninety days, so that half
 * is not close.
 *
 * localStorage has no expiry of its own -- it is forever until someone clears
 * their browser -- so the expiry is stored beside the id and enforced on read.
 * Forever was the wrong answer whatever the law said.
 */
const VID_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000

interface StoredVid {
  id: string
  /** Set once, at creation. Deliberately never extended -- renewing it on each
      visit is the specific thing the exemption rules out, and it is also how a
      thirteen-month identifier quietly becomes a permanent one. */
  exp: number
}

/**
 * The id for this browser, across visits.
 *
 * Deliberately the only thing kept: no first-seen date, no visit counter, no
 * last-seen timestamp. The collector can derive every one of those from the
 * rows it already has, and each one stored here would be another fact sitting
 * on someone else's device for no gain.
 *
 * Returns undefined rather than throwing when storage is unavailable -- a
 * locked-down browser still gets measured within the visit, it just does not
 * get counted as returning. That is the right way round: the durable identifier
 * is the optional part.
 */
export function visitorId(): string | undefined {
  try {
    const raw = localStorage.getItem(VID_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as Partial<StoredVid>
      // A live id inside its window is returned untouched: reading must not
      // extend it.
      if (stored?.id && typeof stored.exp === 'number' && Date.now() < stored.exp) {
        return stored.id
      }
      // Expired, or written by an older version of this code that stored a bare
      // string with no expiry. Either way it is replaced rather than migrated --
      // an id with no end date is the thing being fixed.
    }
    const fresh: StoredVid = { id: newId(), exp: Date.now() + VID_MAX_AGE_MS }
    localStorage.setItem(VID_KEY, JSON.stringify(fresh))
    return fresh.id
  } catch {
    return undefined
  }
}

/** Whether measuring is currently refused on this device. */
export function isOptedOut(): boolean {
  try {
    return localStorage.getItem(OPTOUT_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Refuse, or withdraw the refusal.
 *
 * A real control rather than a console incantation. CNIL's exemption is
 * conditional on a mechanism the visitor can actually use to object, and
 * "open the developer tools and type this" is not one. PrivacyModal renders it.
 */
export function setOptedOut(on: boolean): void {
  try {
    if (on) {
      localStorage.setItem(OPTOUT_KEY, '1')
      forget()
    } else {
      localStorage.removeItem(OPTOUT_KEY)
    }
  } catch {
    // Nothing to record the choice in. The tracker treats an unreadable store
    // as a refusal anyway, so the visitor gets the outcome they asked for.
  }
  // Storage governs the next page load. This governs this one.
  try {
    window.dispatchEvent(new CustomEvent<OptOutDetail>(OPTOUT_EVENT, { detail: { on } }))
  } catch {
    /* no DOM: the build-time prerender, where there is nothing running to tell */
  }
}

/** Which of the two views the hash is currently pointing at. */
export const routeFromHash = (): Route =>
  window.location.hash.replace('#', '') === 'work' ? 'work' : 'about'

/** UTM tags off the landing URL. Read once, before any hash navigation. */
function utmTags(): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  try {
    const params = new URLSearchParams(window.location.search)
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const value = params.get(key)
      // Capped: a UTM tag is a label, and anything longer than this is either a
      // mistake or someone using the query string as a side channel.
      if (value) out[key.slice(4)] = value.slice(0, 64)
    }
  } catch {
    return undefined
  }
  return Object.keys(out).length ? out : undefined
}

/** The once-per-session snapshot. */
export function context(): SessionContext {
  const doc = document.documentElement
  return {
    sw: screen.width,
    sh: screen.height,
    vw: doc.clientWidth,
    vh: doc.clientHeight,
    dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    lang: navigator.language ?? '',
    ref: document.referrer,
    utm: utmTags(),
    theme: doc.dataset.theme === 'light' ? 'light' : 'dark',
    rm: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}
