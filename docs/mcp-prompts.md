# Model Context Protocol (MCP) Standard Prompts

This document details the standardized MCP Prompts exposed by the server to guide external AI agents when reporting news stories.

---

## 1. Prompt Catalog

The MCP server exposes editorial prompt templates via the `prompts/list` endpoint:

### 1.1 `story-creation`
Instructs the agent on how to compose a new journalistic story:
* **Arguments**:
  * `topic` (string, required): Central subject or event title.
  * `tone` (string, optional): e.g. `objective`, `breaking`, `in-depth-investigative`.
* **Prompt Instructions Given to Agent**:
  1. Search existing coverage (`search_stories`) to confirm novelty.
  2. Verify primary sources (`create_source`) before making factual assertions.
  3. Structure the article into clear blocks: `summary`, `paragraph`, `quote`, `chart` (if quantitative data exists), and `timeline`.
  4. Submit draft via `create_story`.

### 1.2 `story-update`
Guides the agent when revising an existing developing story:
* **Arguments**:
  * `storyId` (string, required): Target story identifier.
  * `updateReason` (string, required): What new facts or statements emerged.
* **Prompt Instructions Given to Agent**:
  1. Retrieve the existing story blocks (`get_story`).
  2. Identify specific blocks to update, append, or replace.
  3. Formulate a structured `what_changed` block listing added, updated, or corrected items.
  4. Submit revision via `create_story_version`.

### 1.3 `fact-check-verification`
Guides the agent to audit claims against primary sources:
* **Arguments**:
  * `storyId` (string, required): Target story.
* **Prompt Instructions Given to Agent**:
  1. Extract claims and associated `sourceIds`.
  2. Inspect permissible excerpts from the source registry.
  3. Append `citation` blocks with confidence ratings.
