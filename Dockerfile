# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install

# Build using tsx / ts-node or run dev mode directly
EXPOSE 3001
CMD ["npm", "run", "dev"]