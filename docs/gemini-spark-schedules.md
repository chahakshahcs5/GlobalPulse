# Gemini Spark Recurring Schedules & Workflow Examples

## Recurring Workflow Blueprints

### 1. Daily Morning Newsroom Briefing (07:00 AM)

- **Schedule**: Daily at 07:00 AM
- **Objective**: Monitor overnight geopolitical, economic, and scientific news.
- **Workflow**:
  1. Gemini independently researches top global developments.
  2. Queries MCP: `search_stories({ query: "overnight developing", limit: 10 })`.
  3. Detects if developing stories require updates or new items should be drafted.
  4. Calls `create_story` or `create_story_version`.
  5. Attaches sources and invokes `publish_story`.

---

### 2. Topic Watcher: BRICS 2026 Expansion

- **Schedule**: Every 6 hours
- **Objective**: Track bilateral negotiations, summit logistics, and joint trade agreements.
- **Workflow**:
  1. Gemini queries web for "BRICS Summit 2026".
  2. Calls `search_stories({ query: "BRICS 2026" })`.
  3. If new member accessions are confirmed:
     - Calls `create_story_version` on the primary summit story.
     - Adds `MapBlock` highlighting the new member countries.
     - Adds `ChartBlock` depicting economic output of the expanded bloc.
     - Calls `create_source` for the official joint declaration.
     - Calls `publish_story`.

---

### 3. Weekly Technology & Semiconductor Briefing

- **Schedule**: Every Sunday at 18:00
- **Objective**: Synthesize the week's key technological advancements.
- **Workflow**:
  1. Searches published stories: `search_stories({ topicId: "top_semiconductors", fromDate: "7-days-ago" })`.
  2. Synthesizes a macro briefing with timeline and benchmark charts.
  3. Publishes a comprehensive deep-dive explainer.
