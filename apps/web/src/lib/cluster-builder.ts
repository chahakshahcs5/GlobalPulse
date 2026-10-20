'use client';

import { useMemo } from 'react';
import type { Story } from '@ai-news/schemas';

import { type GoogleNewsCluster, type RelatedSourceArticle } from './cluster-types';
import { useAllStories } from './news-store';

/**
 * Maps a story to its canonical Google News category tab based on categories, topicIds, articleType, and semantic keywords
 */
export function mapStoryToCategory(
  story: Story
):
  | 'India'
  | 'World'
  | 'Business'
  | 'Technology'
  | 'Science'
  | 'Health'
  | 'Sports'
  | 'Entertainment'
  | string {
  const title = (story.title || '').toLowerCase();
  const articleType = (story.articleType || '').toLowerCase();
  const topicsStr = Array.isArray(story.topicIds) ? story.topicIds.join(' ').toLowerCase() : '';
  const catsStr = Array.isArray(story.categories) ? story.categories.join(' ').toLowerCase() : '';

  // 1. India (Digital Public Infrastructure, ISRO, national space, and domestic ecosystem)
  if (
    articleType === 'local' ||
    catsStr.includes('india') ||
    topicsStr.includes('india') ||
    title.includes('isro') ||
    title.includes('gaganyaan') ||
    title.includes('upi') ||
    title.includes('india') ||
    title.includes('dholera') ||
    title.includes('shukrayaan') ||
    title.includes('6g testbed')
  ) {
    return 'India';
  }

  // 2. World (Geopolitics, multilateral treaties, defense alliances, diplomatic summits, UN accords)
  if (
    articleType === 'politics' ||
    catsStr.includes('world') ||
    topicsStr.includes('geopolitics') ||
    title.includes('un global') ||
    title.includes('ethics accord') ||
    title.includes('drone swarm') ||
    title.includes('treaty') ||
    title.includes('geneva') ||
    title.includes('shangri-la') ||
    title.includes('nordic') ||
    title.includes('baltic') ||
    title.includes('lunar resource') ||
    title.includes('maritime')
  ) {
    return 'World';
  }

  // 3. Sports (Athletics, Grand Prix, FIFA, Olympics, biomechanics)
  if (
    articleType === 'sports' ||
    catsStr.includes('sport') ||
    title.includes('formula 1') ||
    title.includes('f1') ||
    title.includes('athletics') ||
    title.includes('fifa') ||
    title.includes('olympic') ||
    title.includes('biomechanic') ||
    title.includes('football') ||
    title.includes('world cup') ||
    title.includes('marathon') ||
    title.includes('championship')
  ) {
    return 'Sports';
  }

  // 4. Entertainment (Cinema, Festivals, Volumetric performance, Grammys, Creative rights)
  if (
    articleType === 'culture' ||
    articleType === 'entertainment' ||
    catsStr.includes('entertainment') ||
    catsStr.includes('cinema') ||
    topicsStr.includes('culture_cinema') ||
    title.includes('biennale') ||
    title.includes('actors guild') ||
    title.includes('cinema') ||
    title.includes('film') ||
    title.includes('symphonic') ||
    title.includes('audio codec') ||
    title.includes('spatial acoustic') ||
    title.includes('likeness') ||
    title.includes('grammy') ||
    title.includes('photonic dome')
  ) {
    return 'Entertainment';
  }

  // 5. Health (Therapeutics, vaccines, clinical trials, epidemiology, biosensors)
  if (
    articleType === 'health' ||
    catsStr.includes('health') ||
    topicsStr.includes('biotech_crispr') ||
    title.includes('therapy') ||
    title.includes('vaccine') ||
    title.includes('neurodegener') ||
    title.includes('cholesterol') ||
    title.includes('rsv') ||
    title.includes('clinical trial') ||
    title.includes('mucosal') ||
    title.includes('cardiomyopathy') ||
    title.includes('biosensor') ||
    title.includes('pathogen') ||
    title.includes('epigenetic')
  ) {
    return 'Health';
  }

  // 6. Science (Deep space, astrophysics, fusion plasma, hydrothermal vents, mineralization)
  if (
    articleType === 'science' ||
    catsStr.includes('science') ||
    topicsStr.includes('space_exploration') ||
    topicsStr.includes('energy_fusion') ||
    title.includes('exoplanet') ||
    title.includes('james webb') ||
    title.includes('k2-18b') ||
    title.includes('basalt') ||
    title.includes('square kilometre') ||
    title.includes('ska') ||
    title.includes('extremophile') ||
    title.includes('mariana') ||
    title.includes('trench') ||
    title.includes('solar island') ||
    title.includes('iter') ||
    title.includes('plasma') ||
    title.includes('hydrothermal') ||
    title.includes('prebiotic')
  ) {
    return 'Science';
  }

  // 7. Business & Markets (Central banking, CBDCs, macro, debt markets, capex, trade settlement)
  if (
    articleType === 'business' ||
    articleType === 'markets' ||
    catsStr.includes('business') ||
    topicsStr.includes('macroeconomics') ||
    topicsStr.includes('digital_currency') ||
    topicsStr.includes('sovereign_wealth') ||
    title.includes('cbdc') ||
    title.includes('central bank') ||
    title.includes('green bond') ||
    title.includes('megapack') ||
    title.includes('sodium-ion') ||
    title.includes('cargo fleet') ||
    title.includes('remittance') ||
    title.includes('capital expenditure') ||
    title.includes('instant settlement') ||
    title.includes('asean')
  ) {
    return 'Business';
  }

  // 8. Technology (Semiconductors, AI, Quantum, Cybersecurity, Neuromorphic, Standards)
  if (
    articleType === 'technology' ||
    catsStr.includes('technology') ||
    topicsStr.includes('semiconductors') ||
    topicsStr.includes('ai_agents') ||
    topicsStr.includes('quantum_computing') ||
    topicsStr.includes('cybersecurity') ||
    title.includes('semiconductor') ||
    title.includes('1.4nm') ||
    title.includes('euv') ||
    title.includes('quantum') ||
    title.includes('nitrogenase') ||
    title.includes('ransomware') ||
    title.includes('kernel') ||
    title.includes('fusion grid') ||
    title.includes('ai safety') ||
    title.includes('neuromorphic') ||
    title.includes('kyber') ||
    title.includes('tls 1.4')
  ) {
    return 'Technology';
  }

  return 'World';
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
  const dynamicClusters: GoogleNewsCluster[] = [];

  for (const story of publishedStories) {
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
      category: mapStoryToCategory(story),
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
        isSubscriberOnly: story.isSubscriberOnly,
      },
      relatedArticles,
    });
  }

  // Return clusters purely derived from live stories
  return dynamicClusters;
}

/**
 * React hook that returns dynamic Google News clusters reflecting both
 * CMS human stories and MCP autonomous AI dispatches.
 */
export function useNewsClusters() {
  const { stories, isLoading } = useAllStories();

  const clusters = useMemo(() => {
    return buildClustersFromStories(stories);
  }, [stories]);

  const leadCluster = clusters[0] || null;
  const secondaryClusters = clusters.slice(1);

  return {
    clusters,
    leadCluster,
    secondaryClusters,
    isLoading,
    totalStoriesCount: stories.length,
  };
}
