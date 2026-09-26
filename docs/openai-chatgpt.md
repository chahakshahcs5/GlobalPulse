# OpenAI ChatGPT & MCP App Integration Guide

## Overview

The News Publishing Platform connects to **ChatGPT as an MCP-powered application** using the modern OpenAI Apps/MCP remote server architecture over **Streamable HTTP**.

The application is **NOT** an autonomous newsroom; ChatGPT is the **Brain, Researcher, and Editor**, while the News Platform provides the **programmable capabilities, database persistence, and multimedia publishing engine**.

---

## Architecture

```
User (ChatGPT Client)
       │
       │ "Research BRICS 2026 and update my News Platform"
       ▼
ChatGPT External Agent
  - Performs independent web research across external sources
  - Discovers and calls News MCP Tools
       │
       │ [OAuth 2.1 + PKCE S256 over Streamable HTTP]
       ▼
News Platform Remote MCP Server (https://news.example.com/mcp)
       │
  ┌────┴───────────────────────────┐
  │ MCP Tools & Resources          │
  │  - search_stories              │
  │  - get_story                   │
  │  - create_story_version        │
  │  - add_story_block             │
  │  - create_chart / create_map   │
  │  - attach_source               │
  │  - publish_story               │
  └────┬───────────────────────────┘
       │
       ▼
Core Application Services & PostgreSQL Database
```

---

## Tool Sensitivity & Approval Policies

OpenAI's MCP client distinguishes read-only actions from mutating actions. The News Platform structures tool metadata accordingly:

### 1. Read-Only Tools (Auto-approved by default)
- `search_stories`, `search_events`, `search_topics`, `search_entities`, `search_sources`
- `get_story`, `get_story_version`, `get_story_versions`, `get_story_sources`
- `find_similar_stories`

### 2. Normal Write Tools (Standard modify permissions)
- `create_story` (Creates draft)
- `update_story`
- `create_story_version`
- `add_story_block`, `update_story_block`, `remove_story_block`, `reorder_story_blocks`
- `create_chart`, `create_map`, `create_timeline`, `create_diagram`
- `create_source`, `attach_source`, `attach_citation`
- `create_topic`, `create_event`, `create_entity`

### 3. High-Impact Write Tools (Approval prompt recommended)
- `publish_story`: Moves story to live feeds.
- `unpublish_story`: Reverts live story to draft.
- `archive_story`: Permanently retires story.

---

## ChatGPT App Manifest (`manifest.json`)

To connect ChatGPT to your News Platform, register the MCP server endpoint in the ChatGPT developer settings:

```json
{
  "name": "News Publishing Platform",
  "description": "Programmable multimedia newsroom with structured stories, D3 charts, MapLibre maps, timelines, and source citations.",
  "mcp_server": {
    "url": "https://news.example.com/mcp",
    "transport": "streamable_http",
    "authorization": {
      "type": "oauth2",
      "protected_resource_metadata_url": "https://news.example.com/.well-known/oauth-protected-resource"
    }
  },
  "scopes": [
    "news:read",
    "news:search",
    "news:write",
    "news:publish",
    "news:media",
    "news:sources",
    "news:topics"
  ]
}
```

---

## Interactive App UI (Optional)

Where supported by ChatGPT client environments, tool calls return structured data alongside interactive React component descriptors:
- `search_stories`: Displays interactive story preview cards with topic pills and version badges.
- `get_story`: Displays interactive article reader with rendered D3 charts, timelines, and expandable source footnotes.
