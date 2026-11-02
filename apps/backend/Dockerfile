# ==============================================================================
# MSME POS Platform — NestJS Backend Production Dockerfile
# Multi-stage build with non-root security execution and healthcheck
# ==============================================================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy root workspace definitions
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages, database & backend
COPY packages ./packages
COPY database ./database
COPY apps/backend ./apps/backend

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages
RUN pnpm --filter @pos/shared-types build
RUN pnpm --filter @pos/validation build
RUN pnpm --filter @pos/api-contracts build

# Build backend
RUN pnpm --filter @pos/backend build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/database ./database
COPY --from=builder /app/apps/backend/src ./apps/backend/src
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY apps/backend/package.json ./apps/backend/

# Run as unprivileged node user
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

CMD ["node", "apps/backend/dist/apps/backend/src/main.js"]


