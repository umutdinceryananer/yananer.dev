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
        now: profile.now.map((n) => ({ title: n.title, status: n.badge ?? null, detail: n.description })),
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
          years: e.incoming ? `${e.startYear}- (incoming)` : `${e.startYear}-${e.endYear}`,
        })),
        skills: profile.tech.map((t) => t.name),
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
