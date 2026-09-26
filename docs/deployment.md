# Production Deployment & Operations Guide

This guide details containerization, cloud orchestration, production environment tuning, and 4K display wall signage configurations.

---

## 1. Containerized Architecture (Docker & Docker Compose)

The platform is designed for zero-friction containerized deployment across multi-service topologies.

### 1.1 Multi-Stage Dockerfile (Example for `apps/api`)

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY libs/*/package.json ./libs/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/apps/api/main.js"]
```

### 1.2 Docker Compose Topologies

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: globalpulse
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_ENGINE: prisma
      DATABASE_URL: postgresql://postgres:secure_password@postgres:5432/globalpulse?schema=public
      REDIS_URL: redis://redis:6379
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  mcp-server:
    build:
      context: .
      dockerfile: apps/mcp-server/Dockerfile
    environment:
      PORT: 3001
      API_BASE_URL: http://api:3000
    ports:
      - "3001:3001"
    depends_on:
      - api

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      PORT: 3002
      NEXT_PUBLIC_API_URL: http://api:3000
    ports:
      - "3002:3002"
    depends_on:
      - api

volumes:
  pgdata:
```

---

## 2. Kubernetes Deployment Guidelines

### 2.1 Pod Sizing & Resource Allocations

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit | Scaling Metric |
|:---|:---|:---|:---|:---|:---|
| `apps/api` | 250m | 1000m | 512Mi | 1024Mi | CPU > 75% or Active SSE Conns |
| `apps/mcp-server` | 250m | 1500m | 512Mi | 2048Mi | Concurrent Tool Executions |
| `apps/web` | 500m | 2000m | 1024Mi | 2048Mi | HTTP RPS > 1000 |
| `apps/worker` | 500m | 2000m | 1024Mi | 4096Mi | BullMQ Queue Depth |

### 2.2 Probes & Health Checks

Every service exposes standardized Kubernetes probes:
* **Liveness Probe**: `GET /health/live` (HTTP 200 if event loop is operational)
* **Readiness Probe**: `GET /health/ready` (HTTP 200 only if database pool and Redis connection are verified healthy)

---

## 3. Large Display Wall & Kiosk Signage Deployment

For corporate lobbies, newsrooms, and conference venues:

### 3.1 Hardware Recommendations
* **Display**: 4K UHD (3840×2160) or 32:9 Super Ultrawide (5120×1440) 60Hz+ HDR panel.
* **Playback Hardware**: Intel NUC, Apple Mac Mini M2, or Raspberry Pi 5 with hardware-accelerated Chromium.

### 3.2 Kiosk Chromium Launch Command
Launch the dedicated `/kiosk` or `/wall` route in fullscreen kiosk mode:

```bash
google-chrome \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-features=Translate \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  http://newsroom-display.internal:3002/kiosk
```

### 3.3 Display Features
* **Auto-rotation**: Cycles lead stories every 25 seconds without page reload.
* **Live Clock**: Synchronized UTC millisecond-precision clock display.
* **Multi-Pane Layout**: Side-by-side D3 settlement bar charts, MapLibre geographic epicenters, and breaking ticker ribbons.
