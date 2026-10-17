# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install --legacy-peer-deps

EXPOSE 3001

# Start using tsx directly so no missing dist/ or build errors
CMD ["npx", "tsx", "apps/web/src/server.ts"]