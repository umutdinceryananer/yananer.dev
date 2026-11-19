import { useEffect, useMemo, useState } from 'react'
import type { Activity } from 'react-activity-calendar'

// GitHub contribution data, fetched here rather than by react-github-calendar.
//
// Why this exists: that wrapper owns its own fetch, and while the request is in
// flight it renders a skeleton built from generateEmptyData() -- a full calendar
// year, ~53 columns. The card is often narrower than that, and the calendar's own
// scroll container is overflow-x:auto, so a horizontal scrollbar appeared on
// every load and vanished again once the real (much narrower) data arrived.
// Owning the request means the grid is only ever drawn at its real size.
//
// Same shape as useLatestRelease: public endpoint, unauthenticated, module-level
// cache, in-flight de-duplication, and silent failure -- a dead API leaves the
// empty grid in place rather than showing an error where a chart should be.

const API = 'https://github-contributions-api.jogruber.de/v4'

/**
 * Week columns in the prerendered page, before the card has been measured.
 * GitHubContributions then draws as many as the card's width holds.
 */
export const WEEKS = 21

/** The most week columns ever drawn, about five years. Only a very wide card gets near it. */
export const MAX_WEEKS = 260

const cache = new Map<string, Activity[]>()
const inflight = new Map<string, Promise<Activity[] | null>>()

/**
 * Levels 0 to 4 on one scale across every year fetched.
 *
 * The API reports GitHub's own level for each day, but GitHub scales each
 * calendar year on its own, so a grid that crosses New Year could change
 * brightness at 1 January for no reason in the data. This recomputes the
 * levels the way GitHub does within a year, from the quartiles of the days
 * with any contributions, over the whole history at once.
 */
function relevel(days: Activity[]): Activity[] {
  const counts = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b)
  if (counts.length === 0) return days
  const at = (p: number) => counts[Math.min(counts.length - 1, Math.floor(p * counts.length))]
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)]
  const level = (c: number) => (c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4)
  return days.map((d) => ({ ...d, level: level(d.count) }))
}

function fetchContributions(username: string): Promise<Activity[] | null> {
  const existing = inflight.get(username)
  if (existing) return existing

  // No `y` parameter, which the API documents as every year of the account.
  // A wide card shows well over a year, so `y=last` is no longer enough.
  const p = fetch(`${API}/${username}`)
    .then((r) => (r.ok ? r.json() : null))
    // Shape-check rather than trust: a payload with `contributions` as
    // anything but an array would sail through to render and throw there.
    .then((d: { contributions?: unknown } | null) =>
      Array.isArray(d?.contributions) ? relevel(d.contributions as Activity[]) : null,
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
 * Every date the grid can cover: today back to the start of the week MAX_WEEKS-1
 * weeks ago. GitHubContributions shows the newest part of it that fits.
 *
 * Anchoring on a week boundary is what keeps the grid a whole number of columns
 * every day of the week. Cutting at "today minus N*7 days" lands mid-week and
 * produces one extra partial column on six days out of seven, which is why the
 * card used to change width between reloads.
 */
function gridDates(): string[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cursor = new Date(today)
  cursor.setDate(cursor.getDate() - cursor.getDay() - (MAX_WEEKS - 1) * 7)

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
