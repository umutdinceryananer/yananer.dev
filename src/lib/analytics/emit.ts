/**
 * The one part of analytics that components are allowed to import.
 *
 * The tracker itself is dynamically imported and must stay out of the main
 * bundle (see components/Analytics.tsx). A component that imported it directly
 * to report "the contact modal opened" would drag the whole thing back in, and
 * the byte-budget assertion in scripts/audit-analytics.ts would fail the build
 * — correctly, but after the fact and for a reason that reads as unrelated.
 *
 * So the coupling goes through a DOM event instead. This module is three lines
 * and no imports, it is safe to call before the tracker has loaded or when it
 * never loads at all (opted out, endpoint unset, a fork), and the tracker
 * subscribes to it the same way it subscribes to a click.
 */

/** Detail carried on the `ya:action` event. Mirrors ActionEvent's n/s. */
export interface ActionDetail {
  n: string
  s?: string
  /** For actions where the duration is the point -- how long a demo was open. */
  ms?: number
}

export const ACTION_EVENT = 'ya:action'

/**
 * Fired when the visitor uses the switch in the privacy dialog.
 *
 * The stored flag only governs the *next* page load -- the tracker reads it once
 * when it starts and never again -- and the switch promises to stop recording
 * now. This is how "now" reaches a tracker that is already running.
 */
export const OPTOUT_EVENT = 'ya:optout'

export interface OptOutDetail {
  on: boolean
}

/** Report a named thing happening. A no-op unless the tracker is listening. */
export function action(n: string, s?: string, ms?: number): void {
  try {
    window.dispatchEvent(new CustomEvent<ActionDetail>(ACTION_EVENT, { detail: { n, s, ms } }))
  } catch {
    // A CustomEvent constructor that throws means an environment with no DOM,
    // which is the build-time prerender. Nothing to report there.
  }
}
