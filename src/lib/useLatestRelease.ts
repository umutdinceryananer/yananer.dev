import { useEffect, useState } from 'react'

// Latest-release lookup for actively-released repos.
//
// Why this exists: nightlightd ships often, and hardcoding a version in
// src/data went stale between deploys. The prose no longer quotes a version;
// the number is fetched here instead, so the site is current without a rebuild.
//
// Deliberately unauthenticated (the endpoint is public, and GitHub's 60 req/hr
// limit is per visitor IP). Failures are silent: callers render nothing rather
// than showing a stale or wrong version.

const cache = new Map<string, string>()
const inflight = new Map<string, Promise<string | null>>()

function fetchLatest(repo: string): Promise<string | null> {
  const existing = inflight.get(repo)
  if (existing) return existing

  const p = fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { tag_name?: string } | null) => d?.tag_name ?? null)
    .catch(() => null)

  inflight.set(repo, p)
  return p
}

/** Latest release tag for "owner/repo" (e.g. "v0.1.2"), or null while loading / on failure. */
export function useLatestRelease(repo?: string): string | null {
  const [tag, setTag] = useState<string | null>(() => (repo ? cache.get(repo) ?? null : null))

  useEffect(() => {
    if (!repo) return
    const cached = cache.get(repo)
    if (cached) {
      setTag(cached)
      return
    }
    let alive = true
    fetchLatest(repo).then((t) => {
      if (t) cache.set(repo, t)
      if (alive && t) setTag(t)
    })
    return () => {
      alive = false
    }
  }, [repo])

  return tag
}
