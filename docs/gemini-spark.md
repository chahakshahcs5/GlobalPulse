# Google Gemini & Gemini Spark Integration Guide

## Overview

**Gemini Spark** operates as an autonomous external researcher and reasoning engine connected to the News Platform via standard **Model Context Protocol (MCP)** over **Streamable HTTP**.

The application is **AI-agnostic**: Gemini interacts with the exact same domain services, validation rules, and database records as human journalists and other AI agents.

---

## Architecture

```
Gemini Spark Scheduled Task / Topic Monitor
                  │
                  ▼
External Web & Source Research (Gemini Deep Search)
                  │
                  ▼
News Platform Remote MCP Server (https://news.example.com/mcp)
                  │
   ┌──────────────┴──────────────────────────┐
   │ Tool Invocations:                       │
   │  1. search_stories("BRICS 2026")        │
   │  2. evaluate: new vs update vs existing │
   │  3. create_story / create_story_version │
   │  4. add_story_block (charts, maps)      │
   │  5. create_source & attach_source       │
   │  6. publish_story                       │
   └──────────────┬──────────────────────────┘
                  │
                  ▼
Application Persistence & Multi-Device Real-Time Broadcast
```

---

## Delayed Execution & Schedule Tolerance

Gemini Spark supports recurring schedules (e.g. hourly or daily topic monitors). In production cloud environments, scheduled invocations are not guaranteed to fire at the exact millisecond of schedule expiry.

The News Publishing Platform is designed to tolerate delayed or out-of-order execution:
1. **Timestamp Normalization**: The platform records real creation timestamps alongside source publication timestamps.
2. **Idempotency Keys**: Scheduled executions use date-based idempotency keys (e.g. `spark:brics:2026-09-26`) so retries never create duplicate drafts.
3. **Optimistic Version Checks**: When updating existing stories, Gemini inspects `currentVersionNumber` to ensure edits build sequentially on historical versions.
