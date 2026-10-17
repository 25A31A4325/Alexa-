# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install --legacy-peer-deps

# Build mcp-server first so its dist/ files exist for apps/web
RUN npm run build --workspace=packages/mcp-server || true

EXPOSE 3001

# Start web app directly using tsx
CMD ["npx", "tsx", "apps/web/src/server.ts"]