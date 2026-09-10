/**
 * The wire contract between the tracker in this bundle and the collector.
 *
 * The collector imports this file directly rather than mirroring it.
 *
 * An earlier version of this comment promised a hand-maintained copy in
 * analytics/src/payload.ts, which was the right call when the collector was
 * going to be a separately deployed package with its own tsconfig. It is a
 * Pages Function in this repo instead (functions/api/collect.ts), built by the
 * same command, so it can read the definition — and one definition beats a copy
 * plus a check that notices the copy has drifted.
 *
 * Keys are short on purpose. Every batch has to fit in the 64KB a
 * `navigator.sendBeacon` is allowed, and the last batch of a session — the one
 * carrying the exit route and the final scroll depth — is exactly the batch
 * that gets sent under unload pressure. Verbosity here is paid for in dropped
 * end-of-session data.
 */

/** Bump on any breaking shape change; the collector rejects payloads it predates. */
export const PROTOCOL = 4

/** Hash routes, normalised to the two the site actually has. */
export type Route = 'about' | 'work'

/**
 * Sent once per session, on the first batch only.
 *
 * Everything here is stable for the life of a tab, so repeating it on every
 * batch would be pure payload. Anything that can change mid-session (viewport
 * on rotate, theme on toggle) is re-reported as an event instead.
 */
export interface SessionContext {
  /** Screen, then the viewport at session start. */
  sw: number
  sh: number
  vw: number
  vh: number
  dpr: number
  /** IANA zone. Coarser than an IP and enough to tell a timezone-shifted visit. */
  tz: string
  lang: string
  /** Full referrer URL. The collector keeps only host + path — never the query,
      which is where search engines and ad networks put identifiers. */
  ref: string
  /** UTM tags off the landing URL, if any. */
  utm?: Record<string, string>
  theme: 'light' | 'dark'
  /** prefers-reduced-motion. Worth knowing before judging animation-heavy cards. */
  rm: boolean
}

interface Base {
  /** Milliseconds since session start, not a wall clock. Clock skew between a
      visitor's machine and the edge is routinely minutes; an offset from a
      server-stamped session start is immune to it. */
  ts: number
  r: Route
}

/**
 * Ten entries, one per 10% band of the page.
 *
 * A tuple rather than `number[]`: the comment used to promise ten and the type
 * allowed any length, which made the collector's range check something a human
 * had to remember. Now the shape is the check, on both sides of the wire.
 */
export type Bands = [number, number, number, number, number, number, number, number, number, number]

/** A route was entered — on load, and on every route swap after. */
export interface ViewEvent extends Base {
  t: 'view'
}

/**
 * A route was left, or the tab went away. Carries the whole per-view summary,
 * because this is the only event that knows how the view ended.
 */
export interface LeaveEvent extends Base {
  t: 'leave'
  /** Wall time on the route. */
  ms: number
  /** Of which, time the tab was actually visible and the visitor was moving,
      typing or scrolling — and no dialog was open. The honest engagement
      number. See tracker.ts for why the dialog exclusion is not optional. */
  ams: number
  /** Deepest scroll reached, 0–100. */
  sd: number
  /** Milliseconds of visible time spent with each 10% band of the page on
      screen. This is the scroll heatmap. */
  bands: Bands
  /**
   * How many times the document height changed during this view.
   *
   * ShowMore expands mid-session — on phones only, which is precisely where
   * scroll depth is the metric worth having. When it does, the ten bands are
   * measured against a moving denominator and everything accumulated before
   * the change describes different content than everything after. Rather than
   * try to rescale it, say how many times it happened and let the dashboard
   * discount the sessions that carry a non-zero count.
   */
  hc?: number
  /**
   * Milliseconds from the view opening to the visitor's first deliberate move.
   *
   * Present on one leave event per session -- the view during which it happened
   * -- and absent on the rest, because there is only one first time. A page that
   * is looked at for four seconds before anyone touches it is being read; one
   * touched instantly is being navigated through. Nothing here identifies the
   * move, only when it came.
   */
  tti?: number
  /** Document height at leave time, not at load time: see hc. */
  dh: number
  vw: number
  vh: number
}

/** A click, located well enough to be re-drawn on any viewport. */
export interface ClickEvent extends Base {
  t: 'click'
  /** The element's `data-ya` name, or a bounded structural fallback. Never a
      class-based selector — see tracker.ts. */
  s: string
  /** Where inside that element's box, 0–1. Survives every reflow the element
      survives, which raw page coordinates do not. */
  ox: number
  oy: number
  /** Fallback page-space coordinates for elements we could not name: x as a
      fraction of document width, y in absolute pixels. Both omitted inside a
      dialog, which is position:fixed and outside the scroll container — adding
      the scroller's offset there fabricates a coordinate. */
  nx?: number
  py?: number
  vw: number
  dh: number
  tag: string
  /** aria-label or short visible text — never from a field, never from a
      redacted subtree. */
  lbl?: string
  /**
   * Outbound destination, host + path only, query stripped.
   *
   * Without this the site's highest-value question is unanswerable: `lbl` is
   * the literal string "Repo" on all eleven project cards, so a click count
   * keyed on it says how many people clicked "a repo" and never which one.
   * `s` answers it too once the data-ya names land, but this also covers the
   * links that will never be named individually.
   */
  h?: string
}

/**
 * A click on something that looked clickable and did nothing at all.
 *
 * This one genuinely earns its place on the wire, where `rage` did not: rage is
 * three clicks on one selector inside a second, which the collector can derive
 * from the click stream it already has. Whether anything *happened* after a
 * click is only knowable in the page.
 */
export interface DeadEvent extends Base {
  t: 'dead'
  s: string
  lbl?: string
}

/** An uncaught error or rejected promise the visitor was actually exposed to. */
export interface ErrEvent extends Base {
  t: 'err'
  /** Message, truncated. Never the stack: it carries file paths and, in a
      bundled build, occasionally fragments of the values that broke. */
  m: string
  /** Source file, basename only. */
  src?: string
  ln?: number
}

/**
 * Contact-form funnel, field by field. Names only — never values, never
 * lengths, never a hash of the content. Enough to see which field people stall
 * on and where they walk away, and nothing that could reconstruct a message.
 */
export interface FieldEvent extends Base {
  t: 'field'
  /** Read off `data-ya-key`, not the <label> text, so renaming the visible
      label does not orphan the funnel. */
  f: string
  a: 'focus' | 'filled' | 'abandon' | 'submit' | 'error'
  /** Time spent in the field, for focus-ending actions. */
  ms?: number
}

/** A named thing happened — a modal opened, the theme flipped, a demo loaded. */
export interface ActionEvent extends Base {
  t: 'action'
  n: string
  s?: string
  /**
   * How long the thing lasted, where that is the interesting part.
   *
   * A demo is the case this exists for: knowing the Enter Lab button was pressed
   * says someone was curious, and says nothing about whether they watched. Three
   * seconds and three minutes are different answers to the only question the
   * button was ever asked.
   */
  ms?: number
}

/**
 * A wireframe of the route as it was actually laid out.
 *
 * Defined but NOT in the union below, and not emitted by the tracker: this is
 * the input to a click heatmap, and a heatmap needs 350–500 clicks per bucket
 * before it stops inventing structure that is not in the data. At this site's
 * traffic that is months away. The type stays because the shape is the hard
 * part and it was already worked out; turning it on later is one line here and
 * one collector branch.
 *
 * It exists in this form — boxes we redraw — rather than as an overlay on the
 * live site, because the site's own CSP forbids being framed
 * (`frame-ancestors 'none'`), and because redrawn boxes keep working for
 * historical data after the layout changes.
 */
export interface LayoutEvent extends Base {
  t: 'layout'
  vw: number
  dh: number
  boxes: { s: string; l?: string; x: number; y: number; w: number; h: number }[]
}

export type AnalyticsEvent =
  | ViewEvent
  | LeaveEvent
  | ClickEvent
  | DeadEvent
  | ErrEvent
  | FieldEvent
  | ActionEvent

export interface Batch {
  v: typeof PROTOCOL
  /** Per-tab. Dies with the tab, and is what holds one visit together. */
  sid: string
  /**
   * Per-browser, and the one thing here that outlives the visit.
   *
   * Sent on the first batch of a session only -- it is stable, so repeating it
   * would be pure payload. The collector counts visits per vid; the client
   * stores nothing but the id itself, so "is this a returning visitor" is a
   * question answered in SQL rather than one the page has to track.
   *
   * This is a real change in what the site holds, and it was not the original
   * design: an earlier version of this contract had no such field and said so
   * in as many words. Linking two visits to one browser is the thing consent
   * rules are actually about, which is why it is optional here -- it is absent
   * whenever storage is unavailable or the visitor has refused, and the tracker
   * still works without it.
   */
  vid?: string
  /** Batch counter. Lets the collector drop a beacon the browser retried. */
  seq: number
  ctx?: SessionContext
  events: AnalyticsEvent[]
}
