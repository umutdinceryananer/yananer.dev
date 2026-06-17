import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listView } from '../lib/projectsView'

export function registerListProjects(server: McpServer) {
  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description:
        "Umut's public repos, open-source contributions, and a clearly-marked private section — one-line summaries + links. Read-only. Prefer reading the real code over these summaries.",
      inputSchema: {},
    },
    async () => {
      const view = listView()
      return {
        content: [{ type: 'text', text: JSON.stringify(view, null, 2) }],
        structuredContent: view,
      }
    },
  )
}
