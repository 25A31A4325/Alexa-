# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install --legacy-peer-deps

# Build all monorepo workspaces cleanly
RUN npm run build

EXPOSE 3000

# Execute web server from compiled dist
CMD ["node", "apps/web/dist/server.js"]
