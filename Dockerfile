# syntax=docker/dockerfile:1
# ==============================================================================
# ORCHESTRA — Production Dockerfile
# Multi-stage build for Node.js 22+ with native node:sqlite support
# ==============================================================================

# 1. BUILD STAGE
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache python3 make g++

# Copy package manifests across all workspaces
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/mcp-server/package.json ./packages/mcp-server/
COPY packages/mcp-client/package.json ./packages/mcp-client/
COPY packages/orchestrator/package.json ./packages/orchestrator/
COPY apps/web/package.json ./apps/web/

# Clean install all dependencies (including devDependencies for build)
RUN npm ci

# Copy all source code & configs
COPY packages/mcp-server/ ./packages/mcp-server/
COPY packages/mcp-client/ ./packages/mcp-client/
COPY packages/orchestrator/ ./packages/orchestrator/
COPY apps/web/ ./apps/web/

# Compile TypeScript across all workspaces
RUN npm run build

# Prune devDependencies for production
RUN npm prune --omit=dev

# 2. RUNTIME STAGE
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for container health checks
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV MCP_SERVER_HOST=0.0.0.0
ENV MCP_SERVER_PORT=3001
ENV MCP_SERVER_ENDPOINT=/mcp
ENV MCP_SERVER_URL=http://127.0.0.1:3001/mcp
ENV DB_PATH=/data/orchestra.db

# Create persistent data directory and assign permissions to non-root node user
RUN mkdir -p /data && chown -R node:node /data /app

# Copy root manifests and pruned node_modules
COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Copy built workspace packages
COPY --from=builder --chown=node:node /app/packages/mcp-server/package.json /app/packages/mcp-server/package.json
COPY --from=builder --chown=node:node /app/packages/mcp-server/dist /app/packages/mcp-server/dist

COPY --from=builder --chown=node:node /app/packages/mcp-client/package.json /app/packages/mcp-client/package.json
COPY --from=builder --chown=node:node /app/packages/mcp-client/dist /app/packages/mcp-client/dist

COPY --from=builder --chown=node:node /app/packages/orchestrator/package.json /app/packages/orchestrator/package.json
COPY --from=builder --chown=node:node /app/packages/orchestrator/dist /app/packages/orchestrator/dist

COPY --from=builder --chown=node:node /app/apps/web/package.json /app/apps/web/package.json
COPY --from=builder --chown=node:node /app/apps/web/dist /app/apps/web/dist
COPY --from=builder --chown=node:node /app/apps/web/public /app/apps/web/public

USER node

EXPOSE 3000 3001

# Default startup: runs Web Mission Control application
CMD ["npm", "run", "start:web"]
