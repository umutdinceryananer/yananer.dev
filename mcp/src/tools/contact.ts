import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { profile } from '../lib/projectsView'

export function registerContact(server: McpServer) {
  server.registerTool(
    'contact',
    {
      title: 'Contact',
      description: 'How to reach Umut — email and social links.',
      inputSchema: {},
    },
    async () => {
      const out = {
        email: profile.email,
        socials: profile.socials,
        site: profile.siteUrl,
        note: 'Email is best for direct contact; the site also has a one-click "Mail to" composer.',
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
        structuredContent: out,
      }
    },
  )
}
