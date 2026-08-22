import { useEffect, useMemo, useState } from 'react'
import type { Activity } from 'react-activity-calendar'

// GitHub contribution data, fetched here rather than by react-github-calendar.
//
// Why this exists: that wrapper owns its own fetch, and while the request is in
// flight it renders a skeleton built from generateEmptyData() -- a full calendar
// year, ~53 columns. The card is nowhere near that wide, and the calendar's own
// scroll container is overflow-x:auto, so a horizontal scrollbar appeared on
// every load and vanished again once the real (much narrower) data arrived.
// Owning the request means the grid is only ever drawn at its real size.
//
// Same shape as useLatestRelease: public endpoint, unauthenticated, module-level
// cache, in-flight de-duplication, and silent failure -- a dead API leaves the
// empty grid in place rather than showing an error where a chart should be.

const API = 'https://github-contributions-api.jogruber.de/v4'

/** Columns drawn. The card is sized for this; changing it changes the layout. */
export const WEEKS = 21

const cache = new Map<string, Activity[]>()
const inflight = new Map<string, Promise<Activity[] | null>>()

function fetchContributions(username: string): Promise<Activity[] | null> {
  const existing = inflight.get(username)
  if (existing) return existing

  const p = fetch(`${API}/${username}?y=last`)
    .then((r) => (r.ok ? r.json() : null))
    // Shape-check rather than trust: a payload with `contributions` as
    // anything but an array would sail through to render and throw there.
    .then((d: { contributions?: unknown } | null) =>
      Array.isArray(d?.contributions) ? (d.contributions as Activity[]) : null,
    )
    .catch(() => null)

  inflight.set(username, p)
  return p
}

/** Local-time YYYY-MM-DD. Not toISOString(), which would shift across midnight UTC. */
function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * Every date the grid covers: today back to the start of the week WEEKS-1 weeks
 * ago.
 *
 * Anchoring on a week boundary is what keeps the grid exactly WEEKS columns wide
 * every day of the week. Cutting at "today minus WEEKS*7 days" lands mid-week and
 * produces one extra partial column on six days out of seven, which is why the
 * card used to change width between reloads.
 */
function gridDates(): string[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cursor = new Date(today)
  cursor.setDate(cursor.getDate() - cursor.getDay() - (WEEKS - 1) * 7)

  const dates: string[] = []
  while (cursor <= today) {
    dates.push(isoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

/**
 * Contribution activity for the grid.
 *
 * `activities` covers the same dates whether or not the request has landed, so
 * the calendar has identical dimensions in both states and nothing can shift
 * when the data arrives. `loaded` says which of the two you are looking at.
 */
export function useContributions(username: string) {
  const [data, setData] = useState<Activity[] | null>(() => cache.get(username) ?? null)

  useEffect(() => {
    const cached = cache.get(username)
    if (cached) {
      setData(cached)
      return
    }
    let alive = true
    fetchContributions(username).then((c) => {
      if (c) cache.set(username, c)
      if (alive && c) setData(c)
    })
    return () => {
      alive = false
    }
  }, [username])

  const activities = useMemo(() => {
    const dates = gridDates()
    if (!data) return dates.map((date) => ({ date, count: 0, level: 0 }))
    const byDate = new Map(data.map((c) => [c.date, c]))
    return dates.map((date) => byDate.get(date) ?? { date, count: 0, level: 0 })
  }, [data])

  return { activities, loaded: data !== null }
}
