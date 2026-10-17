# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install --legacy-peer-deps

# Build all workspaces before starting the production entrypoint
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]