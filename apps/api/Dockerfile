# ==============================================================================
# GlobalPulse Production Dockerfile: NestJS API Gateway
# Multi-stage build with pnpm workspace isolation
# ==============================================================================

FROM node:20-alpine AS base
RUN npm install -g pnpm@9

WORKDIR /app

# Copy root manifest and workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

# Copy all application manifests
COPY apps/api/package.json ./apps/api/
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

# Copy all library manifests
COPY libs/schemas/package.json ./libs/schemas/
COPY libs/database/package.json ./libs/database/
COPY libs/content/package.json ./libs/content/
COPY libs/stories/package.json ./libs/stories/
COPY libs/events/package.json ./libs/events/
COPY libs/topics/package.json ./libs/topics/
COPY libs/entities/package.json ./libs/entities/
COPY libs/sources/package.json ./libs/sources/
COPY libs/search/package.json ./libs/search/
COPY libs/auth/package.json ./libs/auth/
COPY libs/media/package.json ./libs/media/
COPY libs/jobs/package.json ./libs/jobs/
COPY libs/observability/package.json ./libs/observability/
COPY libs/graphql/package.json ./libs/graphql/
COPY libs/shared/package.json ./libs/shared/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy full monorepo source tree
COPY . .

# Expose API Gateway port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["pnpm", "--filter", "@ai-news/api", "start"]
