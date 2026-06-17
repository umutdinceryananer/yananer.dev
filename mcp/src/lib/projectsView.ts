// Shaping helpers over the single source of truth (yananer.dev/src/data).
// Imported the same way scripts/generate-agent-files.ts does — pure data, no React.
import { projects, type Project } from '../../../src/data/projects'
import { profile } from '../../../src/data/profile'

export { projects, profile }
export type { Project }

export const publicRepos = projects.filter((p) => p.kind === 'repo' && !p.isPrivate)
export const ossContribs = projects.filter((p) => p.kind === 'oss-contribution')
export const privateWork = projects.filter((p) => p.isPrivate)

/** Compact index for list_projects. */
export function listView() {
  return {
    handle: profile.githubHandle,
    site: profile.siteUrl,
    note:
      'A read-only index of real public work. Prefer reading the actual code over trusting these summaries; cite files; flag anything you can’t verify.',
    publicRepos: publicRepos.map((p) => ({
      name: p.name,
      signal: p.signal,
      oneLiner: p.oneLiner,
      tech: p.tech ?? [],
      repoUrl: p.repoUrl,
      liveDemoUrl: p.liveDemoUrl,
      ...(p.syntheticData ? { syntheticData: true } : {}),
    })),
    openSource: ossContribs.map((p) => ({
      name: p.name,
      oneLiner: p.oneLiner,
      url: p.repoUrl,
      state: p.contributionState,
    })),
    private: privateWork.map((p) => ({
      name: p.name,
      oneLiner: p.oneLiner,
      caveat:
        'Private / in development — NOT independently verifiable; no public code to check.',
    })),
  }
}

/** Case-insensitive exact, then substring match. */
export function findProject(name: string): Project | undefined {
  const q = name.trim().toLowerCase()
  if (!q) return undefined
  return (
    projects.find((p) => p.name.toLowerCase() === q) ??
    projects.find(
      (p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()),
    )
  )
}

/** Full detail for get_project. */
export function projectDetail(p: Project) {
  return {
    name: p.name,
    kind: p.kind,
    signal: p.signal,
    oneLiner: p.oneLiner,
    tech: p.tech ?? [],
    repoUrl: p.repoUrl,
    liveDemoUrl: p.liveDemoUrl,
    keyEntryPoints: p.keyEntryPoints ?? [],
    note: p.note,
    isPrivate: p.isPrivate,
    isVerifiable: p.isVerifiable,
    ...(p.syntheticData ? { syntheticData: true } : {}),
    ...(p.contributionState ? { contributionState: p.contributionState } : {}),
  }
}

export const projectNames = projects.map((p) => p.name)
