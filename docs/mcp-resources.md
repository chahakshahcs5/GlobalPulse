# Model Context Protocol (MCP) Resources Reference

This document describes the read-only URI resources and dynamic templates exposed by the **GlobalPulse Remote MCP Server**.

---

## 1. Resource URI Schemes

External AI agents read real-time newsroom context using standardized URI templates:

| Resource URI | Description | MIME Type |
|:---|:---|:---|
| `news://stories` | Real-time list of latest published stories | `application/json` |
| `news://stories/{id}` | Full story document with structured blocks and revision metadata | `application/json` |
| `news://events` | Catalog of active developing events | `application/json` |
| `news://events/{id}` | Event milestone tracker and geographic coordinates | `application/json` |
| `news://entities/{id}` | Named entity profile, aliases, and cited stories | `application/json` |
| `news://topics/{slug}` | Topic taxonomy graph and covered dispatches | `application/json` |
| `news://sources/{id}` | Primary source fact-check citation with permissible excerpt | `application/json` |
| `news://audit/latest` | Recent agent publication actions for compliance inspection | `application/json` |

---

## 2. Resource Subscription & Live Invalidation

When an MCP client registers a subscription to a resource (e.g. `news://stories` or `news://events/{id}`), the MCP server emits `notifications/resources/updated` whenever that resource changes:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "uri": "news://stories/sty_brics_2026"
  }
}
```

This allows external AI monitoring agents to react to revisions made by other agents in real-time.
