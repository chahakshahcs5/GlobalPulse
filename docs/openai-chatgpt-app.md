# OpenAI ChatGPT App Integration & Optional MCP App UI

This document details integrating GlobalPulse as a ChatGPT App, configuring OpenAI MCP connectors, and providing optional conversational MCP App UI without vendor lock-in.

---

## 1. ChatGPT App & Custom GPT Connector Configuration

OpenAI ChatGPT users and automated OpenAI Assistants operate GlobalPulse by adding the remote MCP server URL.

### 1.1 Action / Connector Manifest (`ai-plugin.json` / OpenAPI metadata)

```json
{
  "schema_version": "v1",
  "name_for_model": "globalpulse_newsroom",
  "name_for_human": "GlobalPulse Newsroom Desk",
  "description_for_model": "Operate the GlobalPulse newsroom. Search verified news coverage, create drafts with structured blocks, attach verified primary sources, and publish updates with D3 charts and WhatChanged diffs.",
  "description_for_human": "Connect ChatGPT to the GlobalPulse multimedia news publishing platform.",
  "auth": {
    "type": "oauth",
    "authorization_url": "https://auth.globalpulse.news/oauth/authorize",
    "scope": "news:read news:write news:publish",
    "authorization_content_type": "application/json",
    "verification_tokens": {}
  },
  "api": {
    "type": "openapi",
    "url": "https://api.globalpulse.news/docs/openapi.json"
  }
}
```

---

## 2. Optional MCP App UI

Some external AI interfaces (e.g. advanced ChatGPT App sidecars or Claude desktop artifacts) support rendering custom iframe-based App UIs directly inside the conversation.

### Design Principles:

1. **Zero Vendor Lock-in**: The MCP tools function 100% identically whether the UI iframe is rendered or ignored.
2. **Read-Only Inspection**: The conversational App UI displays an interactive preview of the rendered article (with interactive D3 charts and SVG maps) inside ChatGPT.
3. **Fallback Gracefulness**: If the AI client does not support HTML iframe extensions, the tool returns the standard JSON response:
   ```json
   {
     "status": "success",
     "storyId": "sty_brics_2026",
     "title": "BRICS 2026 Summit Ratifies Landmark Trade Accord in New Delhi",
     "currentVersionNumber": 3,
     "url": "https://globalpulse.news/stories/brics-2026-summit-ratifies-landmark-trade-pact"
   }
   ```
