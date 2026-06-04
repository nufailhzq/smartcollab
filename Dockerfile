# syntax=docker/dockerfile:1.7
#
# Multi-stage build for UKMFolio (SmartCollab):
#   1. deps    — install npm dependencies (cached layer)
#   2. builder — generate Prisma client + run `next build`
#   3. runner  — minimal Node 20 runtime that serves the standalone bundle
#
# Final image is ~250-300 MB. Build with:
#   docker compose build
#
# ---------------------------------------------------------------------------

# 1) ---- Dependencies ------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# OpenSSL is required by Prisma's query engine on Alpine.
RUN apk add --no-cache libc6-compat openssl

# Copy only what npm needs to resolve the dependency tree — keeps the layer
# cache hot across source-only edits.
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# npm ci honours package-lock.json exactly. `postinstall` triggers
# `prisma generate`, so we need the schema in place before this runs.
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 2) ---- Build --------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Pull in the resolved node_modules + Prisma client from the deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Stub DATABASE_URL — next build runs static analysis only, never connects.
# The real URL is injected at runtime by docker-compose.
ENV DATABASE_URL="mysql://stub:stub@localhost:3306/stub"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# 3) ---- Runner -------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user so a compromised process can't muck with the image.
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Standalone server bundle (only the modules `next build` traced as needed).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma engine binary + schema. The runner needs both `migrate deploy` and
# the query engine, neither of which the standalone tracer pulls in.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Tiny entrypoint that waits for MySQL, applies pending migrations, then
# launches the Next.js server.
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
