# Publishing Engine, Idempotency & Real-Time Broadcast

This document details the atomic publishing lifecycle, idempotency key guarantees, Server-Sent Events (SSE) broadcast, and syndication webhooks.

---

## 1. Atomic Publishing Pipeline

Publishing is a multi-step operation guaranteed by atomic database transactions:

```mermaid
sequenceDiagram
    autonumber
    actor Agent as External AI / Journalist
    participant Gateway as MCP / REST Gateway
    participant Idem as Idempotency Engine
    participant Domain as Story Domain Service
    participant DB as PostgreSQL / Memory DB
    participant SSE as Real-time SSE Broker
    participant Queue as BullMQ Worker Queue

    Agent->>Gateway: POST /mcp [publish_story] (Idempotency-Key: xyz)
    Gateway->>Idem: Check key cache
    alt Key already executed
        Idem-->>Agent: Return cached response immediately
    else Fresh request
        Gateway->>Domain: Execute publish transition
        Domain->>DB: ATOMIC TX (Update status, snapshot version, write audit)
        DB-->>Domain: TX Committed
        Domain->>SSE: Broadcast story.published event
        Domain->>Queue: Enqueue indexing, media variants, and audio jobs
        Domain->>Idem: Store idempotency response
        Domain-->>Agent: HTTP 200 { status: 'PUBLISHED', version: 2 }
    end
```

---

## 2. Idempotency Key Guarantees

Network blips or timeout retries from external AI clients could inadvertently trigger duplicate publish operations. GlobalPulse implements RFC 7231 compliant idempotency filtering:

* Callers provide a unique UUID `Idempotency-Key` header (or input property).
* The key is hashed and checked against `IdempotencyRecord` table.
* Subsequent calls within the 24-hour retention window return the identical response payload without re-running side effects.

---

## 3. Real-Time Broadcast via Server-Sent Events (SSE)

The platform streams real-time news updates directly to Web readers and 4K display walls:

* **Endpoint**: `GET /api/v1/realtime/stream?channels=stories:published,breaking:declared`
* **Features**:
  * Channel-based subscriptions (`stories`, `topics`, `breaking`).
  * Automatic 15-second heartbeat keepalives (`:keepalive\n\n`) to prevent proxy timeout disconnections.
  * Instant UI reconciliation on the 4K display wall when an external AI submits a breaking dispatch.
