'use client';

import { useMemo } from 'react';
import type { Story } from '@ai-news/schemas';

import {
  GOOGLE_NEWS_CLUSTERS,
  type GoogleNewsCluster,
  type RelatedSourceArticle,
} from './news-data';
import { useAllStories } from './news-store';

/**
 * Maps article types to Google News category tabs
 */
function mapArticleTypeToCategory(
  articleType: string
): 'India' | 'World' | 'Business' | 'Technology' | 'Science' | 'Health' | 'Sports' {
  switch (articleType) {
    case 'technology':
      return 'Technology';
    case 'science':
      return 'Science';
    case 'business':
    case 'markets':
      return 'Business';
    case 'breaking_news':
    case 'developing_story':
    case 'politics':
      return 'World';
    case 'sports':
      return 'Sports';
    case 'health':
      return 'Health';
    case 'local':
      return 'India';
    default:
      return 'World';
  }
}

/**
 * Formats a ISO timestamp into a human relative time (e.g., '5m ago', '2h ago')
 */
function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

/**
 * Extracts related articles and perspectives from a story's content blocks
 */
function extractRelatedSources(story: Story, otherStories: Story[]): RelatedSourceArticle[] {
  const related: RelatedSourceArticle[] = [];

  // 1. Look for other stories that share the same topic or event
  for (const other of otherStories) {
    if (other.id === story.id) continue;
    const sharesTopic =
      story.topicIds && other.topicIds && story.topicIds.some((t) => other.topicIds.includes(t));
    const sharesEvent = story.eventId && other.eventId && story.eventId === other.eventId;

    if (sharesTopic || sharesEvent) {
      related.push({
        id: other.id,
        publisher:
          other.createdVia === 'admin'
            ? 'GlobalPulse Staff'
            : other.createdByClient === 'gemini'
              ? 'Gemini Wire'
              : 'Associated News',
        headline: other.title,
        timeAgo: formatTimeAgo(other.publishedAt || other.createdAt),
        url: `/stories/${other.slug}`,
      });
      if (related.length >= 3) break;
    }
  }

  // 2. If story blocks contain citations or sources, convert them to related articles
  if (story.blocks && Array.isArray(story.blocks)) {
    for (const block of story.blocks) {
      if (block.blockType === 'quote' && block.data && typeof block.data === 'object') {
        const d = block.data as Record<string, unknown>;
        if (d.attribution) {
          related.push({
            id: `quote_${block.id}`,
            publisher: String(d.attribution),
            headline: d.quote
              ? `Perspective: "${String(d.quote).slice(0, 70)}..."`
              : 'Key Perspective',
            timeAgo: 'Analysis',
            url: `/stories/${story.slug}#${block.id}`,
          });
        }
      }
    }
  }

  return related.slice(0, 3);
}

/**
 * Dynamically converts published stories into GoogleNewsCluster objects
 */
export function buildClustersFromStories(stories: Story[]): GoogleNewsCluster[] {
  const publishedStories = stories.filter((s) => s.status === 'PUBLISHED' || s.status === 'DRAFT');

  // Track existing slugs from seed clusters so we don't duplicate
  const seedSlugs = new Set<string>();
  for (const cluster of GOOGLE_NEWS_CLUSTERS) {
    seedSlugs.add(cluster.leadStory.slug);
    for (const r of cluster.relatedArticles) {
      seedSlugs.add(r.url.replace('/stories/', ''));
    }
  }

  const dynamicClusters: GoogleNewsCluster[] = [];

  for (const story of publishedStories) {
    // If this story is already featured in seed data, skip to keep rich seed metadata
    if (seedSlugs.has(story.slug)) continue;

    const publisherName =
      story.createdVia === 'admin'
        ? 'GlobalPulse Newsroom'
        : story.createdByClient === 'gemini' || story.createdByClient === 'gemini_spark'
          ? 'Gemini AI Wire'
          : story.createdByClient === 'chatgpt'
            ? 'GPT Research Bureau'
            : 'GlobalPulse Dispatch';

    const relatedArticles = extractRelatedSources(story, publishedStories);

    dynamicClusters.push({
      id: `cluster_${story.id}`,
      mainStoryId: story.id,
      title: story.title,
      summary: story.summary,
      category: mapArticleTypeToCategory(story.articleType),
      leadStory: {
        slug: story.slug,
        headline: story.title,
        publisher: publisherName,
        timeAgo: formatTimeAgo(story.publishedAt || story.createdAt),
        imageUrl:
          story.heroImageUrl ||
          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        author: story.authorId === 'usr_admin' ? 'Editorial Board' : story.authorId,
        excerpt: story.summary,
      },
      relatedArticles,
    });
  }

  // Prepend newly published dynamic clusters before baseline seed clusters
  return [...dynamicClusters, ...GOOGLE_NEWS_CLUSTERS];
}

/**
 * React hook that returns dynamic Google News clusters reflecting both
 * CMS human stories and MCP autonomous AI dispatches.
 */
export function useNewsClusters() {
  const { stories } = useAllStories();

  const clusters = useMemo(() => {
    return buildClustersFromStories(stories);
  }, [stories]);

  const leadCluster = clusters[0] || GOOGLE_NEWS_CLUSTERS[0];
  const secondaryClusters = clusters.slice(1);

  return {
    clusters,
    leadCluster,
    secondaryClusters,
    totalStoriesCount: stories.length,
  };
}
