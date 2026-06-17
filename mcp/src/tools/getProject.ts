import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { findProject, projectDetail, projectNames } from '../lib/projectsView'

export function registerGetProject(server: McpServer) {
  server.registerTool(
    'get_project',
    {
      title: 'Get project',
      description:
        'Structured detail for one project — signal, tech, links, and the key files to read first. Read-only.',
      inputSchema: {
        name: z
          .string()
          .describe('Project name, e.g. "FX-Risk-Engine" (fuzzy / case-insensitive).'),
      },
    },
    async ({ name }) => {
      const p = findProject(name)
      if (!p) {
        return {
          content: [
            {
              type: 'text',
              text: `No project matches "${name}".\nAvailable: ${projectNames.join(', ')}`,
            },
          ],
          isError: true,
        }
      }
      const detail = projectDetail(p)
      return {
        content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }],
        structuredContent: detail,
      }
    },
  )
}
