// Cloudflare Workers entrypoint for yananer-mcp.
//
// Same tools as the Node/Express server (src/server.ts), but served through
// Cloudflare's McpAgent (Streamable HTTP over a Durable Object). All tool
// registration is shared and unchanged — only the transport/host differs.
//
// Free-plan friendly: the Durable Object is SQLite-backed (see wrangler.toml
// `new_sqlite_classes`), and Workers Free covers the request volume.

import { McpAgent } from 'agents/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerListProjects } from './tools/listProjects'
import { registerGetProject } from './tools/getProject'
import { registerExplainDecision } from './tools/explainDecision'
import { registerRunTournament } from './tools/runTournament'
import { registerGetProfile } from './tools/getProfile'
import { registerAssessFit } from './tools/assessFit'
import { registerRecommendProject } from './tools/recommendProject'
import { registerContact } from './tools/contact'

/** Cloudflare Rate Limiting binding (see wrangler.toml [[unsafe.bindings]]). */
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export interface Env {
  MCP_OBJECT: DurableObjectNamespace
  RATE_LIMITER: RateLimiter
}

export class YananerMCP extends McpAgent<Env> {
  server = new McpServer({ name: 'yananer-dev', version: '0.1.0' })

  async init() {
    registerGetProfile(this.server)
    registerListProjects(this.server)
    registerGetProject(this.server)
    registerRecommendProject(this.server)
    registerExplainDecision(this.server)
    registerAssessFit(this.server)
    registerRunTournament(this.server)
    registerContact(this.server)
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/healthz') {
      return Response.json({ ok: true, name: 'yananer-mcp' })
    }

    if (pathname === '/mcp') {
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
      const { success } = await env.RATE_LIMITER.limit({ key: ip })
      if (!success) {
        return Response.json(
          { jsonrpc: '2.0', error: { code: -32000, message: 'Rate limit exceeded' }, id: null },
          { status: 429 },
        )
      }
      // Stateless Streamable HTTP (JSON responses), same shape as the Node server.
      return YananerMCP.serve('/mcp').fetch(request, env, ctx)
    }

    return new Response('Not found', { status: 404 })
  },
}
