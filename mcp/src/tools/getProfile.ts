import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { profile } from '../lib/projectsView'

export function registerGetProfile(server: McpServer) {
  server.registerTool(
    'get_profile',
    {
      title: 'Get profile',
      description:
        "Who Umut is: bio, current focus, experience, education, skills, and an honest list of what he's not good at yet. Read-only.",
      inputSchema: {},
    },
    async () => {
      const view = {
        name: profile.name,
        role: profile.role,
        headline: profile.headline,
        tagline: profile.tagline,
        bio: profile.bio,
        location: profile.location ?? null,
        now: profile.now.map((n) => ({
          title: n.title,
          status: n.badge ?? null,
          detail: n.description,
          ...(n.url ? { url: n.url } : {}),
        })),
        experience: profile.work
          .slice()
          .sort((a, b) => b.order - a.order)
          .map((w) => ({
            title: w.title,
            company: w.company,
            period: w.period,
            status: w.status ?? null,
            description: w.description,
          })),
        education: profile.education.map((e) => ({
          institution: e.institution,
          degree: e.degree,
          field: e.field,
          // An unfinished degree has to say so. Printed as a bare range, one in
          // progress reads exactly like one that was completed -- and a model
          // reading this has nothing else to go on.
          years:
            e.status === 'incoming'
              ? `${e.startYear}- (starting)`
              : e.status === 'in-progress'
                ? `${e.startYear}-${e.endYear} (expected, in progress)`
                : `${e.startYear}-${e.endYear}`,
        })),
        skills: profile.tech.map((t) => t.name),
        certifications: profile.tech.flatMap((t) => (t.certification ? [t.certification] : [])),
        notGoodAtYet: profile.growth.map((g) => ({ area: g.area, note: g.note })),
        links: {
          site: profile.siteUrl,
          email: profile.email,
          ...Object.fromEntries(profile.socials.map((s) => [s.label.toLowerCase(), s.url])),
        },
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(view, null, 2) }],
        structuredContent: view,
      }
    },
  )
}
