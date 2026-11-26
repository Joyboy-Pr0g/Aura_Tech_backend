# syntax=docker/dockerfile:1
# AURA TECH Backend — production image (Hetzner CX23 optimized)
# Node 24 LTS · multi-stage · non-root · internal port 5000

FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# curl for container health checks
RUN apk add --no-cache curl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "dist/server.js"]
