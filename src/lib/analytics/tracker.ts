/**
 * The tracker. Loaded only from components/Analytics.tsx, and only dynamically.
 *
 * Emits `view`, `leave`, `action`, `click`, `field` and `err`.
 *
 * Not `dead`. Detecting "a click happened and nothing followed" is a heuristic
 * with a real false-positive rate, and this site's three known dead-click sites
 * were found by reading it rather than by measuring it -- two of which have
 * since been fixed. It stays defined in the contract for when there is an
 * unknown one worth hunting. Not `layout` either: that is heatmap input, and a
 * heatmap needs hundreds of clicks per bucket before it stops inventing shapes.
 *
 * Three things in this file exist because of how *this* site is built, and all
 * three would silently produce plausible, wrong numbers if written the usual
 * way. They are marked THIS SITE below.
 */

import { PROTOCOL, type AnalyticsEvent, type Bands, type Batch, type ClickEvent, type Route } from './types'
import { ENDPOINT, context, optedOut, routeFromHash, sessionId, visitorId } from './session'
import { ACTION_EVENT, type ActionDetail } from './emit'

const BANDS = 10
const TICK_MS = 1000
/** After this long with no input, the visitor is no longer reading. */
const IDLE_MS = 15_000
const FLUSH_MS = 10_000
const MAX_QUEUE = 24
/** Below this, a scrollHeight change is a scrollbar or a font settling. */
const HEIGHT_EPS = 8
/** Per session. A render loop that throws can produce thousands; the first few
    say everything the rest would. */
const MAX_ERRORS = 5
/** Elements that look like they do something. An unnamed one is worth knowing
    about -- it means a data-ya was forgotten -- so it is reported as `?tag`
    rather than dropped. */
const INTERACTIVE = 'a, button, input, textarea, select, summary, [role="button"]'

/**
 * THIS SITE (1 of 3): the page does not scroll.
 *
 * index.css sets `overflow: hidden` on html, body and #root; the element that
 * actually scrolls is the `fixed inset-0 overflow-auto` shell in App.tsx. So
 * `window.scrollY` is permanently 0 and a scroll listener on `window` never
 * fires. Every depth, band and page coordinate in this file is measured against
 * this element instead. useScrollLock.ts already reaches for it the same way.
 */
const scroller = () => document.querySelector('.app-scroll')

/**
 * The route the visitor is actually looking at.
 *
 * App.tsx puts `rendered` on <main data-ya-route>, which lags the hash by
 * PAGE_EXIT_MS during a swap -- and does not lag at all for a reduced-motion
 * visitor. Reading the DOM rather than the hash is what keeps a click made
 * during that window from being filed against a page that is not on screen yet,
 * and keeps the bug from being one that only some visitors can reproduce.
 */
function renderedRoute(fallback: Route): Route {
  const r = document.querySelector('[data-ya-route]')?.getAttribute('data-ya-route')
  return r === 'work' || r === 'about' ? r : fallback
}

/**
 * The name of the thing that was clicked, and the element it was named on.
 *
 * `data-ya` plus an optional `data-ya-key` for the instance -- the project id,
 * the tab, the form field. Never a generated CSS selector: Tailwind emits class
 * names verbatim, so one would be stable within a deploy and would silently
 * detach every historical row the first time a padding changed.
 */
function named(target: Element): { s: string; box: Element } | null {
  const el = target.closest('[data-ya]')
  if (el) {
    const base = el.getAttribute('data-ya') ?? ''
    const key = el.getAttribute('data-ya-key')
    return base ? { s: key ? `${base}:${key.slice(0, 48)}` : base, box: el } : null
  }
  // Unnamed but interactive: report the tag alone. Enough to notice that
  // something is being clicked and has no name yet, and it cannot rot, because
  // there is nothing in it to rot.
  const hit = target.closest(INTERACTIVE)
  return hit ? { s: `?${hit.tagName.toLowerCase()}`, box: hit } : null
}

/** Outbound destination, host + path, query dropped. */
function href(el: Element): string | undefined {
  const a = el.closest('a')
  if (!a?.href) return undefined
  try {
    const u = new URL(a.href)
    if (u.origin === location.origin && !u.pathname.startsWith('/')) return undefined
    return `${u.host}${u.pathname}`.slice(0, 160)
  } catch {
    return undefined
  }
}

interface View {
  r: Route
  /** performance.now() at entry. */
  at: number
  ams: number
  sd: number
  bands: Bands
  hc: number
}

const zeroBands = (): Bands => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

export function start(): () => void {
  if (optedOut() || !ENDPOINT) return () => {}

  const t0 = performance.now()
  const sid = sessionId()
  const queue: AnalyticsEvent[] = []
  let seq = 0
  let ctxSent = false

  /**
   * Nothing is sent until the visitor does something a document fetcher does
   * not: move a pointer, touch, type, scroll or resize.
   *
   * This is not a defence against a determined headless browser — CDP-dispatched
   * events carry isTrusted: true, and navigator.webdriver (checked in
   * optedOut) is trivially patched. Its job is the large, boring class of
   * clients that run the bundle and never simulate input at all: link
   * unfurlers, preview renderers, naive scrapers. Bot score on the collector
   * handles the rest. `pointermove` is in the list deliberately: About is laid
   * out to fit one screen, so a desktop visitor can genuinely read the whole
   * page without scrolling or clicking, and gating on clicks alone would throw
   * those real sessions away.
   */
  let human = false
  let lastInput = t0
  let view: View | null = null
  let lastTick = t0
  let lastHeight = 0
  let heightMoving = false
  let stopped = false
  let errors = 0
  /** Errors thrown by code that is not ours -- browser extensions, mostly.
      Dropped rather than recorded, but counted, so "no errors" and "plenty of
      errors, none of them mine" stay distinguishable. */
  let foreignErrors = 0
  let fieldAt = 0

  const now = () => performance.now()
  const ts = () => Math.round(now() - t0)

  function push(e: AnalyticsEvent) {
    queue.push(e)
    if (queue.length >= MAX_QUEUE) flush(false)
  }

  function flush(final: boolean) {
    if (!human || !queue.length || !ENDPOINT) return
    const batch: Batch = {
      v: PROTOCOL,
      sid,
      seq: seq++,
      events: queue.splice(0, queue.length),
    }
    if (!ctxSent) {
      batch.ctx = context()
      // Both ride the first batch and never again: they are stable for the
      // session, so repeating them would be payload spent on nothing. `vid` is
      // simply absent when storage is unavailable -- the visit is still
      // measured, it just does not join up with any other.
      const vid = visitorId()
      if (vid) batch.vid = vid
      ctxSent = true
    }
    const body = JSON.stringify(batch)

    // text/plain rather than application/json, even though this endpoint is
    // same-origin and would not preflight either way. If the endpoint ever
    // moves to another host, an application/json beacon starts triggering a
    // CORS preflight that routinely does not complete during pagehide — losing
    // exactly the final batch, the one carrying the exit route and the scroll
    // depth. Choosing the safe type now costs nothing; the collector reads the
    // body as JSON regardless of what the header claims.
    const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' })

    if (final) {
      // The page is going away: fetch, keepalive or not, is not guaranteed to
      // be scheduled. sendBeacon is the only primitive with a promise here.
      if (navigator.sendBeacon?.(ENDPOINT, blob)) return
    }
    // Deliberately not awaited and deliberately swallowed. A failed analytics
    // request must never surface to a visitor or hold up an unload.
    fetch(ENDPOINT, { method: 'POST', body: blob, keepalive: true, credentials: 'omit' }).catch(
      () => {},
    )
  }

  function enter(r: Route) {
    view = { r, at: now(), ams: 0, sd: 0, bands: zeroBands(), hc: 0 }
    const sc = scroller()
    lastHeight = sc ? sc.scrollHeight : 0
    heightMoving = false
    push({ t: 'view', ts: ts(), r })
  }

  function leave() {
    if (!view) return
    if (foreignErrors) {
      push({ t: 'action', ts: ts(), r: view.r, n: 'err.foreign', s: String(foreignErrors) })
      foreignErrors = 0
    }
    const sc = scroller()
    const v = view
    view = null
    push({
      t: 'leave',
      ts: ts(),
      r: v.r,
      ms: Math.round(now() - v.at),
      ams: Math.round(v.ams),
      sd: Math.round(v.sd),
      bands: v.bands.map(Math.round) as Bands,
      ...(v.hc ? { hc: v.hc } : {}),
      dh: sc ? sc.scrollHeight : 0,
      vw: document.documentElement.clientWidth,
      vh: document.documentElement.clientHeight,
    })
  }

  function tick() {
    const t = now()
    // Clamped: a backgrounded tab throttles this interval to roughly once a
    // minute, and the first tick after it comes forward would otherwise credit
    // the whole gap as reading time.
    const dt = Math.min(t - lastTick, TICK_MS * 2)
    lastTick = t
    const sc = scroller()
    if (!view || !sc) return

    const height = sc.scrollHeight
    if (Math.abs(height - lastHeight) > HEIGHT_EPS) {
      // Coalesced: ShowMore animates grid-template-rows over 300ms, so one
      // expansion crosses two or three ticks and would otherwise read as three
      // separate layout changes.
      if (!heightMoving) view.hc += 1
      heightMoving = true
      lastHeight = height
    } else {
      heightMoving = false
    }

    const top = sc.scrollTop
    const vh = sc.clientHeight
    const depth = height > 0 ? Math.min(100, ((top + vh) / height) * 100) : 0
    // Depth is recorded whatever the visitor is doing: reaching a point in the
    // page is a fact about the visit, not a claim about attention.
    if (depth > view.sd) view.sd = depth

    if (document.visibilityState !== 'visible') return
    /**
     * THIS SITE (2 of 3): pause while a dialog is open.
     *
     * useScrollLock puts `.is-locked` on this same element, which stops it
     * scrolling but preserves scrollTop. Without this check, ninety seconds
     * spent reading the Decisions modal is credited as ninety seconds of
     * intense attention on whichever band happened to be behind it. Watching
     * the class rather than counting open dialogs means it works for all four
     * of them and for any dialog added later.
     */
    if (sc.classList.contains('is-locked')) return
    if (t - lastInput > IDLE_MS) return

    view.ams += dt
    const first = Math.max(0, Math.min(BANDS - 1, Math.floor((top / height) * BANDS)))
    const last = Math.max(0, Math.min(BANDS - 1, Math.floor(((top + vh - 1) / height) * BANDS)))
    for (let i = first; i <= last; i++) view.bands[i] += dt
  }

  // ── wiring ────────────────────────────────────────────────────────────────

  const onInput = (e: Event) => {
    if (!e.isTrusted) return
    lastInput = now()
    human = true
  }

  const onHash = () => {
    /**
     * THIS SITE (3 of 3), noted rather than handled.
     *
     * useSwapTransition holds the outgoing page for 150ms, so for that window
     * the hash says one route while the DOM still shows the other — and the
     * window does not exist at all for prefers-reduced-motion visitors. For a
     * view boundary that does not matter: the visitor asked for the route at
     * this moment, and that is what a view is. It matters for clicks, which
     * land on the old DOM with the new hash, and the click pass has to take
     * its route from what is rendered rather than from here.
     */
    leave()
    enter(routeFromHash())
  }

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      // The end of a visible span, treated as the end of a view.
      //
      // pagehide is unreliable on mobile Safari, and a tab closed from the
      // background never fires it at all, so this is the last guaranteed
      // chance to get the leave out. A visitor who comes back opens a new
      // view; `ams` already excludes hidden time, so the parts still sum to
      // the truth. Reach is counted as distinct (sid, route) pairs, not as raw
      // view rows, precisely because of this.
      leave()
      flush(true)
    } else if (!stopped) {
      lastInput = now()
      enter(routeFromHash())
    }
  }

  const onPageHide = () => {
    leave()
    flush(true)
  }

  const onAction = (e: Event) => {
    const d = (e as CustomEvent<ActionDetail>).detail
    if (!d?.n || !view) return
    push({ t: 'action', ts: ts(), r: view.r, n: d.n.slice(0, 48), ...(d.s ? { s: d.s.slice(0, 64) } : {}) })
  }

  const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

  const onClick = (e: Event) => {
    if (!e.isTrusted || !view) return
    const target = e.target as Element | null
    if (!target?.closest) return
    const hit = named(target)
    if (!hit) return

    const me = e as MouseEvent
    const box = hit.box.getBoundingClientRect()
    const sc = scroller()
    const tag = hit.box.tagName.toLowerCase()

    const ev: ClickEvent = {
      t: 'click',
      ts: ts(),
      r: renderedRoute(view.r),
      s: hit.s,
      // Where inside the element's own box. Survives every reflow the element
      // survives, which a page coordinate does not.
      ox: box.width ? clamp01((me.clientX - box.left) / box.width) : 0,
      oy: box.height ? clamp01((me.clientY - box.top) / box.height) : 0,
      vw: document.documentElement.clientWidth,
      dh: sc ? sc.scrollHeight : 0,
      tag: tag.slice(0, 16),
    }

    /**
     * Page coordinates only outside a dialog.
     *
     * The four dialogs are portalled to <body> and are position:fixed, so they
     * sit outside the scroll container entirely. Adding the scroller's offset to
     * a click inside one produces a page coordinate that describes nowhere, and
     * it would smear across any map drawn from this later.
     */
    if (sc && !target.closest('[role="dialog"]')) {
      ev.nx = clamp01(me.clientX / Math.max(1, sc.clientWidth))
      ev.py = Math.round(me.clientY + sc.scrollTop)
    }

    // Never text from a field: that is the visitor's own writing.
    if (tag !== 'input' && tag !== 'textarea') {
      const label = hit.box.getAttribute('aria-label') ?? hit.box.textContent?.trim() ?? ''
      if (label) ev.lbl = label.replace(/\s+/g, ' ').slice(0, 64)
    }
    const h = href(hit.box)
    if (h) ev.h = h

    push(ev)
  }

  const fieldOf = (e: Event): Element | null =>
    (e.target as Element | null)?.closest?.('[data-ya="mail.field"]') ?? null

  const onFocusIn = (e: Event) => {
    const el = fieldOf(e)
    if (!el || !view) return
    fieldAt = now()
    push({ t: 'field', ts: ts(), r: renderedRoute(view.r), f: el.getAttribute('data-ya-key') ?? '?', a: 'focus' })
  }

  const onFocusOut = (e: Event) => {
    const el = fieldOf(e)
    if (!el || !view) return
    /**
     * The only thing read from the field is whether it is empty, and only that
     * boolean ever leaves the page -- never the value, never its length, never
     * a hash of it. It is the minimum that answers "which field do people stop
     * at", and there is no version of this question that needs more.
     */
    const filled = !!(el as HTMLInputElement).value?.trim()
    push({
      t: 'field',
      ts: ts(),
      r: renderedRoute(view.r),
      f: el.getAttribute('data-ya-key') ?? '?',
      a: filled ? 'filled' : 'abandon',
      ms: Math.round(now() - fieldAt),
    })
  }

  const onSubmit = (e: Event) => {
    if (!e.isTrusted || !view) return
    if (!(e.target as Element | null)?.querySelector?.('[data-ya="mail.field"]')) return
    push({ t: 'field', ts: ts(), r: renderedRoute(view.r), f: 'form', a: 'submit' })
  }

  const onError = (e: ErrorEvent) => {
    if (!view || errors >= MAX_ERRORS) return
    // Extensions run in the page and throw into it constantly. An error from a
    // file that is not ours is not something this site can act on, and left
    // unfiltered it would be most of the list.
    const src = e.filename ?? ''
    if (!src.startsWith(location.origin)) {
      foreignErrors += 1
      return
    }
    errors += 1
    push({
      t: 'err',
      ts: ts(),
      r: renderedRoute(view.r),
      // The message only. Never the stack: it carries paths, and in a bundled
      // build occasionally fragments of the values that broke.
      m: (e.message || 'error').slice(0, 200),
      src: src.split('/').pop()?.slice(0, 80),
      ...(typeof e.lineno === 'number' ? { ln: e.lineno } : {}),
    })
  }

  const onRejection = (e: PromiseRejectionEvent) => {
    if (!view || errors >= MAX_ERRORS) return
    // No filename on a rejection, so the origin filter cannot run. Kept anyway:
    // they are rare, and the ones this site produces (a failed fetch) are worth
    // seeing.
    errors += 1
    const reason = e.reason
    const m = reason instanceof Error ? reason.message : String(reason ?? 'rejection')
    push({ t: 'err', ts: ts(), r: renderedRoute(view.r), m: m.slice(0, 200), src: 'promise' })
  }

  const inputs = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'] as const
  for (const type of inputs) addEventListener(type, onInput, { passive: true, capture: true })
  const sc = scroller()
  sc?.addEventListener('scroll', onInput, { passive: true })
  addEventListener('hashchange', onHash)
  addEventListener('visibilitychange', onVisibility)
  addEventListener('pagehide', onPageHide)
  addEventListener(ACTION_EVENT, onAction)
  // Capture phase: a handler that stops propagation (the dialogs all do, to keep
  // a click off the backdrop) would otherwise hide the click from this entirely.
  addEventListener('click', onClick, { capture: true })
  addEventListener('focusin', onFocusIn)
  addEventListener('focusout', onFocusOut)
  addEventListener('submit', onSubmit, { capture: true })
  addEventListener('error', onError)
  addEventListener('unhandledrejection', onRejection)

  const ticker = setInterval(tick, TICK_MS)
  const flusher = setInterval(() => flush(false), FLUSH_MS)

  enter(routeFromHash())

  return () => {
    stopped = true
    leave()
    flush(true)
    clearInterval(ticker)
    clearInterval(flusher)
    for (const type of inputs) removeEventListener(type, onInput, { capture: true })
    sc?.removeEventListener('scroll', onInput)
    removeEventListener('hashchange', onHash)
    removeEventListener('visibilitychange', onVisibility)
    removeEventListener('pagehide', onPageHide)
    removeEventListener(ACTION_EVENT, onAction)
    removeEventListener('click', onClick, { capture: true })
    removeEventListener('focusin', onFocusIn)
    removeEventListener('focusout', onFocusOut)
    removeEventListener('submit', onSubmit, { capture: true })
    removeEventListener('error', onError)
    removeEventListener('unhandledrejection', onRejection)
  }
}
