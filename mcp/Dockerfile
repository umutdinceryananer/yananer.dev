# Build from the REPO ROOT so the single source of truth (src/data) is in context:
#   docker build -f mcp/Dockerfile -t yananer-mcp .
#   docker run --rm -p 8787:8787 yananer-mcp
FROM node:20-alpine

WORKDIR /app/mcp

# Install runtime deps first (layer cache). tsx is a runtime dep here.
COPY mcp/package.json mcp/package-lock.json ./
RUN npm ci --omit=dev

# App code
COPY mcp/ ./

# Single source of truth — imported via ../../../src/data (resolves to /app/src/data)
COPY src/data /app/src/data

ENV PORT=8787 NODE_ENV=production
EXPOSE 8787
# Public, read-only server. ALLOWED_HOSTS should include the public hostname in prod.
CMD ["npx", "tsx", "src/server.ts"]
