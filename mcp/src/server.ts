import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { registerListProjects } from './tools/listProjects'
import { registerGetProject } from './tools/getProject'
import { registerExplainDecision } from './tools/explainDecision'
import { registerRunTournament } from './tools/runTournament'
import { registerGetProfile } from './tools/getProfile'
import { registerAssessFit } from './tools/assessFit'
import { registerRecommendProject } from './tools/recommendProject'
import { registerContact } from './tools/contact'

const PORT = Number(process.env.PORT ?? 8787)
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS ?? 'mcp.yananer.dev,localhost,127.0.0.1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function buildServer(): McpServer {
  const server = new McpServer({ name: 'yananer-dev', version: '0.1.0' })
  registerGetProfile(server)
  registerListProjects(server)
  registerGetProject(server)
  registerRecommendProject(server)
  registerExplainDecision(server)
  registerAssessFit(server)
  registerRunTournament(server)
  registerContact(server)
  return server
}

const app = express()
app.set('trust proxy', true) // behind Cloudflare Tunnel — honour forwarded client IP
app.use(express.json({ limit: '64kb' }))
app.use(
  cors({
    origin: true, // public, read-only server
    allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'MCP-Protocol-Version', 'Accept'],
    exposedHeaders: ['Mcp-Session-Id'],
  }),
)

// Abuse backstop. run_tournament's own input bounds are the heavy-path cap.
app.use(
  '/mcp',
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.headers['cf-connecting-ip'] as string) || req.ip || 'unknown',
  }),
)

// Stateless Streamable HTTP: a fresh server + transport per request.
app.post('/mcp', async (req, res) => {
  const server = buildServer()
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    enableDnsRebindingProtection: true,
    allowedHosts: ALLOWED_HOSTS,
  })
  res.on('close', () => {
    transport.close()
    server.close()
  })
  try {
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal error' },
        id: null,
      })
    }
  }
})

// No sessions to resume/terminate in stateless mode.
const methodNotAllowed = (_req: express.Request, res: express.Response) =>
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed (stateless server).' },
    id: null,
  })
app.get('/mcp', methodNotAllowed)
app.delete('/mcp', methodNotAllowed)

app.get('/healthz', (_req, res) => res.json({ ok: true, name: 'yananer-mcp' }))

app.listen(PORT, () => {
  console.log(`yananer-mcp (Streamable HTTP) listening on :${PORT}/mcp`)
})
