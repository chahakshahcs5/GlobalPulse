# ChatGPT Scheduled Workflows & Recurring Agent Tasks

## Core Principle: ChatGPT Controls the Schedule

The application does **NOT** maintain an autonomous web crawler or internal news scheduler.
ChatGPT's scheduled task feature executes the prompt on a recurring schedule and uses the connected News Platform MCP server.

---

## 1. Daily 8 AM Intelligence Briefing

### User Instruction to ChatGPT:

> Every day at 8:00 AM, research the most important global artificial intelligence and semiconductor developments from the past 24 hours.  
> Use my connected News Platform app.
>
> 1. Always search existing stories before creating anything to avoid duplicates.
> 2. If an existing story covers the development, create a version update with a WhatChanged summary.
> 3. If it is a completely new development, create a new story.
> 4. Add structured visual content: include a numerical D3 chart if economic/production data is available, and an interactive timeline for milestones.
> 5. Register and attach all supporting news sources and official filings.
> 6. Publish according to my permissions.

### Execution Trace:

1. **08:00:00**: ChatGPT triggers scheduled agent.
2. **08:00:05**: ChatGPT executes independent web searches across financial, regulatory, and technical publications.
3. **08:00:15**: ChatGPT calls `search_stories({ query: "Semiconductor Export Controls", limit: 5 })`.
4. **08:00:16**: Platform returns existing story `sty_semi_01` (Version 2).
5. **08:00:20**: ChatGPT reasons: _A new multilateral accord was signed today expanding on the previous restrictions. This updates `sty_semi_01`._
6. **08:00:25**: ChatGPT calls:
   - `create_source(...)` for the official government joint communiqué.
   - `attach_source(...)` linking the source to `sty_semi_01`.
   - `create_chart(...)` comparing quota volumes before and after the accord.
   - `create_story_version(...)` snapshotting Version 3 with WhatChanged annotations.
   - `publish_story(...)` with `idempotencyKey: "chatgpt:semi-accord:2026-09-26"`.
7. **08:00:30**: Web reader, mobile feeds, and 4K display wall update instantly.

---

## 2. Idempotency & Safe Retries

External schedulers occasionally retry failed or timed-out network calls.  
Always supply an `idempotencyKey` formatted as `<agent>:<topic>:<date>`:

```json
{
  "idempotencyKey": "chatgpt:ai-briefing:2026-09-26"
}
```

If ChatGPT calls `create_story` or `publish_story` twice with the same key, the platform returns the exact existing record with **zero duplicate stories generated**.
