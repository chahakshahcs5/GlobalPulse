# Enterprise Testing Strategy & Quality Assurance Architecture

This document describes the testing pyramid, test suites organization, Vitest configuration, and Playwright browser E2E test execution for **GlobalPulse**.

---

## 1. The Enterprise Testing Pyramid

```mermaid
graph TD
    E2E[End-to-End Journeys: Playwright + scripts/demo-e2e.ts]
    Integration[Subsystem Integration: Fastify API, MCP Server, GraphQL Mercurius, Web, DB]
    Unit[Domain & Unit Tests: 22 Blocks, 13 D3 Charts, MapLibre, Timelines, Auth, Search, Mobile]

    E2E --> Integration
    Integration --> Unit
```

---

## 2. Test Taxonomy & Directory Structure

All tests reside under the root `tests/` directory:

```text
tests/
├── unit/
│   ├── blocks/blocks.test.ts                 # Validates 22 block schemas and diff calculations
│   ├── visual-renderers/visual-renderers.test.ts # 13 D3 chart renderers, maps, timelines
│   ├── stories/story-service.test.ts          # Story lifecycle, version snapshots
│   ├── search/search-service.test.ts          # Jaccard text similarity and scoring
│   ├── api/guards-and-errors.test.ts          # OAuth scope guards, RFC 7807 error responses
│   ├── auth/auth-service.test.ts              # JWT signing, PKCE challenge verification
│   ├── domain/domain-services.test.ts         # Events, Entities, Topics, Sources services
│   ├── jobs/queue-and-workers.test.ts         # Worker handlers for media, search, and audio
│   ├── mobile/offline-storage.test.ts         # Mobile offline cache and read history
│   └── mobile/mobile-components.test.ts       # Native React Native component rendering
│
├── integration/
│   ├── api/api-gateway.test.ts                # Fastify REST endpoints, CRUD, SSE
│   ├── database/database.test.ts              # Dual-engine switching (Prisma / Memory), seeder
│   ├── mcp/mcp-server.test.ts                 # Remote MCP Streamable HTTP, principal isolation
│   ├── graphql/graphql-api.test.ts            # Mercurius GraphQL queries, mutations, subscriptions
│   ├── publishing/idempotency-audit.test.ts   # Idempotency gates, atomic transactions
│   ├── realtime/sse-broker.test.ts            # SSE channel broadcasting and heartbeats
│   └── web/web-renderer-cms.test.ts           # Next.js StoryRenderer, 4K wall, entity/event pages
│
└── e2e/
    ├── multi-agent-publishing.e2e.test.ts     # Multi-agent publishing journey
    ├── web-portal.spec.ts                     # Playwright: Portal, story reader, 4K wall
    └── cms-workflow.spec.ts                   # Playwright: Journalist CMS, revision diffs
```

---

## 3. Running Test Suites

### 3.1 Fast Local Unit Tests
```bash
pnpm test:unit
```

### 3.2 Subsystem Integration Tests
```bash
pnpm test:integration
```

### 3.3 Full Test Suite (17 Suites, 158 Tests)
```bash
pnpm test
```

### 3.4 Multi-Agent End-to-End Demonstration Script
```bash
pnpm demo:e2e
# or: tsx scripts/demo-e2e.ts
```

### 3.5 Browser End-to-End Tests (Playwright)
```bash
pnpm test:e2e:browser
```

---

## 4. Architectural Distinction: Automated CI Tests (`tests/e2e/`) vs. Live Demonstration Script (`scripts/demo-e2e.ts`)

A key design principle of the repository is separating **automated headless machine assertions** from **interactive live stakeholder demonstrations**:

```mermaid
flowchart LR
    subgraph CI["Automated CI/CD Pipeline (Machine Feedback)"]
        direction TB
        TestRunner["Vitest / Playwright Runner"]
        E2ETests["tests/e2e/*.test.ts"]
        Assertions["Headless Assertions\nexpect(res.status).toBe(200)"]
        ExitCode["Machine Exit Code (0 / 1)\nJUnit / TAP Reports"]
        TestRunner --> E2ETests --> Assertions --> ExitCode
    end

    subgraph LiveDemo["Interactive Live Walkthrough (Human Observation)"]
        direction TB
        TSX["tsx Engine / pnpm demo:e2e"]
        DemoScript["scripts/demo-e2e.ts"]
        VisualSteps["9 Rich Visual Step Outputs\nEmoji Status • ASCII Tables • Payloads"]
        LiveVerification["Real-time Protocol Inspection\nRFC 8414 • Gemini Spark • MCP • Workers"]
        TSX --> DemoScript --> VisualSteps --> LiveVerification
    end
```

### Detailed Comparison

| Feature | Automated E2E Tests (`tests/e2e/`) | Live Demonstration Script (`scripts/demo-e2e.ts`) |
|:---|:---|:---|
| **Location** | `tests/e2e/multi-agent-publishing.e2e.test.ts` | `scripts/demo-e2e.ts` |
| **Execution Command** | `pnpm test:e2e` / `pnpm test` | `pnpm demo:e2e` |
| **Target Audience** | Continuous Integration (CI/CD) runners, automated pull request gates | Human developers, architects, conference presentations, stakeholders |
| **Output Style** | Silent, minimal TAP or dot progress, failure stack traces only | Verbose, colorful step-by-step console logs with emojis, formatted JSON payloads, and ASCII banners |
| **Assertion Strategy** | Strict programmatic invariants (`expect(...).toBe(...)`) | Stepwise walkthrough displaying protocol lifecycle, background workers, and audit counts |
| **Lifecycle** | Runs inside Vitest test harness with mock timers and test hooks | Standalone node execution booting ephemeral domain services, workers, and mobile caches |
| **Failure Handling** | Immediately aborts test runner with non-zero exit code for CI | Clearly logs the exact failure step in human-readable terms for interactive troubleshooting |

