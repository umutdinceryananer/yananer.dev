/**
 * The wire contract between the tracker in this bundle and the collector Worker.
 *
 * Mirrored, deliberately by hand, in analytics/src/payload.ts. The two live in
 * separate packages with separate tsconfigs and separate deploys, so a shared
 * import would either drag the site's types into a Worker bundle or force a
 * build step between them. Copying ~60 lines is the cheaper trade — the same
 * one mcp/src/data/decisions.ts already makes. If you change a key here, change
 * it there, and bump PROTOCOL.
 *
 * Keys are short on purpose. Every batch has to fit in the 64KB a
 * `navigator.sendBeacon` is allowed, and the last batch of a session — the one
 * carrying the exit route and the final scroll depth — is exactly the batch
 * that gets sent under unload pressure. Verbosity here is paid for in dropped
 * end-of-session data.
 */

/** Bump on any breaking shape change; the Worker rejects payloads it predates. */
export const PROTOCOL = 1

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
  /** Full referrer URL. The Worker keeps only host + path — never the query,
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

/** A route was entered — on load, and on every hashchange after. */
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
      typing or scrolling. The honest engagement number. */
  ams: number
  /** Deepest scroll reached, 0–100. */
  sd: number
  /** Milliseconds of visible time spent with each 10% band of the page on
      screen. Ten entries. This is the scroll heatmap. */
  bands: number[]
  dh: number
  vw: number
  vh: number
}

/** A click, located well enough to be re-drawn on any viewport. */
export interface ClickEvent extends Base {
  t: 'click'
  /** Stable-ish selector for the element hit. */
  s: string
  /** Where inside that element's box, 0–1. Survives every reflow the element
      survives, which raw page coordinates do not. */
  ox: number
  oy: number
  /** Fallback page-space coordinates for elements we could not name: x as a
      fraction of document width, y in absolute pixels. */
  nx: number
  py: number
  vw: number
  dh: number
  tag: string
  /** aria-label or short visible text — never from a field, never from a
      redacted subtree. */
  lbl?: string
}

/** Three or more clicks on the same spot in under a second. Frustration. */
export interface RageEvent extends Base {
  t: 'rage'
  s: string
  n: number
  lbl?: string
}

/** A click on something that looked clickable and did nothing at all. */
export interface DeadEvent extends Base {
  t: 'dead'
  s: string
  lbl?: string
}

/**
 * Where the pointer rested, as dwell milliseconds per 5%×5% cell of the page.
 *
 * A grid rather than the usual sampled polyline: the polyline is 10× the bytes
 * and every consumer of it immediately bins it into a grid anyway. Binning on
 * the client also means a 40-second visit costs the same payload as a
 * 4-second one.
 */
export interface AttentionEvent extends Base {
  t: 'attn'
  vw: number
  dh: number
  /** [cellX, cellY, ms] triples, cells 0–19. */
  cells: [number, number, number][]
}

/**
 * A wireframe of the route as it was actually laid out.
 *
 * This is what makes the heatmap readable without iframing the live site —
 * which the site's own CSP forbids (`frame-ancestors 'none'`). The dashboard
 * redraws these boxes and paints the heat on top, per viewport bucket, and it
 * keeps working for historical data after the layout changes.
 *
 * Sampled: one visitor in five, once per route.
 */
export interface LayoutEvent extends Base {
  t: 'layout'
  vw: number
  dh: number
  boxes: { s: string; l?: string; x: number; y: number; w: number; h: number }[]
}

/**
 * Contact-form funnel, field by field. Names only — never values, never
 * lengths, never a hash of the content. Enough to see which field people stall
 * on and where they walk away, and nothing that could reconstruct a message.
 */
export interface FieldEvent extends Base {
  t: 'field'
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
}

export type AnalyticsEvent =
  | ViewEvent
  | LeaveEvent
  | ClickEvent
  | RageEvent
  | DeadEvent
  | AttentionEvent
  | LayoutEvent
  | FieldEvent
  | ActionEvent

export interface Batch {
  v: typeof PROTOCOL
  /** Anonymous, per-tab, regenerated on every new tab. Never persisted past
      the tab's life, so it cannot link two visits to the same person. */
  sid: string
  /** Batch counter. Lets the Worker drop a beacon the browser retried. */
  seq: number
  ctx?: SessionContext
  events: AnalyticsEvent[]
}
