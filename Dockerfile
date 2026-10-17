# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install --legacy-peer-deps

# Build dependent mcp-server workspace so dist files are generated
RUN npm run build --workspace=packages/mcp-server || true

EXPOSE 3001

# Execute web server directly
CMD ["npx", "tsx", "apps/web/src/server.ts"]