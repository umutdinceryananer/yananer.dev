// Stub for the optional `ai` (Vercel AI SDK) peer dependency of `agents`.
//
// `agents` lazily does `await import("ai")` inside its MCP *client* code path
// (schema conversion). This Worker only uses the server side (McpAgent.serve),
// so that path never runs. We alias `ai` to this stub in wrangler.toml to keep
// the real SDK out of the bundle. The passthrough export keeps things safe if
// the module is ever evaluated.
export const jsonSchema = (schema) => schema
