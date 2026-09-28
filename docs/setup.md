# Setup & Installation Guide

This document provides setup instructions for configuring development and production environments for the **GlobalPulse** platform.

---

## 1. System Requirements

- **Node.js**: `v20.18.0` LTS or `v22.x` (ESM native modules supported).
- **Package Manager**: `pnpm` `9.x` or `10.x` (recommended) or `npm` `10.x`.
- **Database (Optional for production)**: PostgreSQL 16+ with `pgvector` extension.
- **Operating System**: macOS, Linux, or Windows 10/11 (PowerShell / WSL2).

---

## 2. Repository Cloning & Dependency Installation

```bash
# Clone the repository
git clone https://github.com/chahak/ai-news-generator.git
cd ai-news-generator

# Install dependencies across all monorepo workspaces
pnpm install
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

### Essential Environment Variables

```env
# Application Gateway & REST API
NODE_ENV=development
API_PORT=3000
API_HOST=0.0.0.0
CORS_ORIGIN=*

# Remote MCP Server
MCP_PORT=3001
MCP_HOST=0.0.0.0
MCP_ENDPOINT_PATH=/mcp

# Next.js 15 Web Portal & CMS
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_MCP_URL=http://localhost:3001/mcp
NEXT_PUBLIC_SITE_URL=http://localhost:3002
PORT=3002

# Database Configuration
# Set to 'memory' for zero-dependency development or 'prisma' for PostgreSQL
DATABASE_ENGINE=memory
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/globalpulse?schema=public

# OAuth 2.1 Security & JWT
JWT_SECRET=super-secret-development-key-change-in-production-min-32-chars
JWT_ISSUER=https://auth.globalpulse.news
JWT_AUDIENCE=https://api.globalpulse.news
TOKEN_EXPIRY_SECONDS=3600

# Redis / Job Queue (Optional for memory fallback)
REDIS_URL=redis://localhost:6379
```

---

## 4. Database Seeding & Migrations

If running against PostgreSQL:

```bash
# Generate Prisma Client bindings
pnpm db:generate

# Run schema migrations
pnpm db:migrate

# Seed baseline newsroom stories, entities, sources, and D3 charts
pnpm db:seed
```

If running with `DATABASE_ENGINE=memory`, the in-memory database will automatically seed demo stories, entities, and sources upon startup.

---

## 5. Verification

Verify the entire setup by executing the test suite:

```bash
pnpm test
```

Expected result:

```text
Test Files  17 passed (17)
Tests       158 passed (158)
```
