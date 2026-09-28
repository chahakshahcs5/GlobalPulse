# Observability, Telemetry & Auditability (`libs/observability`)

This document details structured JSON logging, Prometheus metrics exporting (`/metrics`), and OpenTelemetry distributed tracing implemented across the **GlobalPulse** platform.

---

## 1. Structured JSON Logging (`StructuredLogger`)

Every service outputs structured, machine-parsable JSON lines to stdout:

```json
{
  "level": "info",
  "timestamp": "2026-09-26T14:45:00.123Z",
  "message": "Story published successfully via remote MCP",
  "context": {
    "service": "mcp-server",
    "traceId": "tr_889a71efc",
    "clientId": "gemini_spark",
    "storyId": "sty_brics_2026",
    "version": 3,
    "latencyMs": 42
  }
}
```

### Contextual Correlation

The logger automatically inherits correlation IDs (`x-correlation-id` / `traceId`) across Fastify plugins, domain repositories, and background worker queues.

---

## 2. Prometheus Metrics Registry (`MetricsRegistry`)

The platform instruments domain metrics conforming to OpenMetrics specifications, exposed on:

- **Endpoint**: `GET /metrics`

### Key Metric Counters & Gauges:

- `mcp_tool_invocations_total`: Counter partitioned by `tool_name`, `client_id`, and `status`.
- `stories_published_total`: Counter partitioned by `article_type` and `created_by_client`.
- `worker_jobs_completed_total`: Counter tracking background queue throughput (`media.process_variant`, `search.index_story`, `audio.generate_briefing`).
- `worker_jobs_failed_total`: Counter tracking unrecoverable worker failures.
- `active_sse_connections`: Gauge tracking connected Web and 4K display wall clients.
- `database_query_duration_seconds`: Summary tracking p50, p95, and p99 database query latencies.

---

## 3. Distributed Tracing (`SimpleTracer`)

OpenTelemetry-compatible spans track execution duration across boundaries:

1. Client HTTP request -> Fastify Auth Guard
2. Remote MCP JSON-RPC dispatch -> Domain transaction
3. Background BullMQ queue enqueue -> Worker completion
