/**
 * API Client — Story Intelligence Endpoints
 *
 * Claims & evidence, timelines, perspectives, knowledge graph, alerts,
 * ingestion, and publisher transparency. Every call here is tenant-scoped by
 * the API to the caller's organization.
 */
import type {
  StoryIntelligence,
  StoryWhatChanged,
  StoryClaim,
  Evidence,
  StoryTimelineEvent,
  EditorialPerspective,
  KnowledgeEdge,
  GraphTraversal,
  AlertRule,
  AlertTrigger,
  IngestionFeed,
  IngestionItem,
  SourceCorrection,
  SourceIntelligence,
} from '@ai-news/schemas';
import { request } from './core';

export async function getStoryIntelligence(storyId: string): Promise<StoryIntelligence> {
  return request<StoryIntelligence>(`/api/stories/${storyId}/intelligence`);
}

export async function getStoryWhatChanged(storyId: string): Promise<StoryWhatChanged> {
  return request<StoryWhatChanged>(`/api/stories/${storyId}/what-changed`);
}

export async function getStoryClaims(storyId: string): Promise<StoryClaim[]> {
  return request<StoryClaim[]>(`/api/stories/${storyId}/claims`);
}

export async function getStoryEvidence(storyId: string): Promise<Evidence[]> {
  return request<Evidence[]>(`/api/stories/${storyId}/evidence`);
}

export async function getStoryTimeline(storyId: string): Promise<StoryTimelineEvent[]> {
  return request<StoryTimelineEvent[]>(`/api/stories/${storyId}/timeline`);
}

export async function getStoryPerspectives(storyId: string): Promise<EditorialPerspective[]> {
  return request<EditorialPerspective[]>(`/api/stories/${storyId}/perspectives`);
}

export async function listKnowledgeEdges(
  filter: {
    fromType?: string;
    fromId?: string;
    toType?: string;
    toId?: string;
    relation?: string;
    limit?: number;
  } = {}
): Promise<KnowledgeEdge[]> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return request<KnowledgeEdge[]>(`/api/graph/edges${qs ? `?${qs}` : ''}`);
}

export async function getGraphNeighborhood(
  nodeType: string,
  nodeId: string,
  depth = 1,
  limit = 100
): Promise<GraphTraversal> {
  const searchParams = new URLSearchParams({
    nodeType,
    nodeId,
    depth: String(depth),
    limit: String(limit),
  });
  return request<GraphTraversal>(`/api/graph/neighborhood?${searchParams.toString()}`);
}

export async function listAlertRules(enabled?: boolean): Promise<AlertRule[]> {
  const qs = enabled === undefined ? '' : `?enabled=${enabled}`;
  return request<AlertRule[]>(`/api/alerts/rules${qs}`);
}

export async function listAlertTriggers(limit = 50): Promise<AlertTrigger[]> {
  return request<AlertTrigger[]>(`/api/alerts/triggers?limit=${limit}`);
}

export async function listIngestionFeeds(): Promise<IngestionFeed[]> {
  return request<IngestionFeed[]>('/api/ingestion/feeds');
}

export async function listIngestionItems(
  filter: { feedId?: string; status?: string; query?: string; limit?: number; offset?: number } = {}
): Promise<IngestionItem[]> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return request<IngestionItem[]>(`/api/ingestion/items${qs ? `?${qs}` : ''}`);
}

export async function listSourceCorrections(
  filter: { publisherId?: string; sourceId?: string; storyId?: string; limit?: number } = {}
): Promise<SourceCorrection[]> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return request<SourceCorrection[]>(`/api/source-corrections${qs ? `?${qs}` : ''}`);
}

export async function getPublisherIntelligence(publisherId: string): Promise<SourceIntelligence> {
  return request<SourceIntelligence>(`/api/publishers/${publisherId}/intelligence`);
}
