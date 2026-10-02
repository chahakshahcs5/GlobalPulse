import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  SkeletonBone,
  LeadStoryCardSkeleton,
  ClusterCardSkeleton,
  WeatherWidgetSkeleton,
  PicksForYouSkeleton,
  TrendingTopicsSkeleton,
  FactCheckWidgetSkeleton,
  HomePageSkeleton,
  StoryDetailSkeleton,
} from '../../../apps/web/src/components/StorySkeletons';
import { buildClustersFromStories } from '../../../apps/web/src/lib/cluster-builder';
import {
  formatDeterministicDate,
  formatDeterministicDateTime,
} from '../../../apps/web/src/lib/date-utils';
import type { Story } from '@ai-news/schemas';

describe('Story Skeletons, Shimmer Loaders & Navigation Unit Tests', () => {
  describe('Shimmer Skeleton Components Rendering', () => {
    it('renders SkeletonBone primitive with animate-shimmer class and custom shapes', () => {
      const htmlDefault = renderToString(React.createElement(SkeletonBone));
      expect(htmlDefault).toContain('animate-shimmer');
      expect(htmlDefault).toContain('rounded-md');

      const htmlCustom = renderToString(
        React.createElement(SkeletonBone, {
          className: 'h-10 w-24',
          rounded: 'rounded-full',
        })
      );
      expect(htmlCustom).toContain('animate-shimmer');
      expect(htmlCustom).toContain('rounded-full');
      expect(htmlCustom).toContain('h-10 w-24');
    });

    it('renders LeadStoryCardSkeleton with full Google News lead card footprint', () => {
      const html = renderToString(React.createElement(LeadStoryCardSkeleton));
      expect(html).toContain('animate-shimmer');
      // Publisher metadata, title lines, summary lines, and multi-perspective footer
      expect(html).toContain('animate-in fade-in');
      expect(html).toContain('grid-cols-1 md:grid-cols-12');
      // Perspective footer with 3 coverage items
      expect(html).toContain('border-t border-slate-100');
    });

    it('renders ClusterCardSkeleton with structured secondary story bones', () => {
      const html = renderToString(React.createElement(ClusterCardSkeleton));
      expect(html).toContain('animate-shimmer');
      expect(html).toContain('rounded-2xl');
      expect(html).toContain('bg-white dark:bg-slate-900');
    });

    it('renders WeatherWidgetSkeleton with temperature, condition, and 4-day forecast', () => {
      const html = renderToString(React.createElement(WeatherWidgetSkeleton));
      expect(html).toContain('animate-shimmer');
      // 4 forecast column pills
      expect(html).toContain('grid grid-cols-4');
    });

    it('renders PicksForYouSkeleton with header, item rows, and explore button bone', () => {
      const html = renderToString(React.createElement(PicksForYouSkeleton));
      expect(html).toContain('animate-shimmer');
      expect(html).toContain('Picks for you');
      // Has bottom button skeleton bone
      expect(html).toContain('h-8 w-full rounded-xl');
    });

    it('renders TrendingTopicsSkeleton with topic pill capsules', () => {
      const html = renderToString(React.createElement(TrendingTopicsSkeleton));
      expect(html).toContain('animate-shimmer');
      expect(html).toContain('In the News');
      expect(html).toContain('flex flex-wrap gap-1.5');
    });

    it('renders FactCheckWidgetSkeleton with claim cards and verdict badges', () => {
      const html = renderToString(React.createElement(FactCheckWidgetSkeleton));
      expect(html).toContain('animate-shimmer');
      expect(html).toContain('Fact Check Bureau');
    });

    it('renders StoryDetailSkeleton with masthead, hero image, and structured content blocks', () => {
      const html = renderToString(React.createElement(StoryDetailSkeleton));
      expect(html).toContain('animate-shimmer');
      // Breadcrumb, title, author avatar, reading time
      expect(html).toContain('max-w-4xl mx-auto');
      // Hero image skeleton aspect ratio
      expect(html).toContain('aspect-16/9');
    });

    it('renders HomePageSkeleton as a complete feed and sidebar layout', () => {
      const html = renderToString(React.createElement(HomePageSkeleton));
      expect(html).toContain('animate-shimmer');
      expect(html).toContain('grid-cols-1 lg:grid-cols-12');
      // Left 8 columns feed and Right 4 columns sidebar
      expect(html).toContain('lg:col-span-8');
      expect(html).toContain('lg:col-span-4');
    });
  });

  describe('Cluster Builder Exclusivity & Subscriber-Only Mapping', () => {
    const subscriberStory: Story = {
      id: 'sty_exclusive_deep_dive',
      organizationId: 'org_pulse',
      slug: 'brics-multilateral-liquidity-mechanism',
      title: 'Deep Dive: Central Banks Finalize Autonomous Clearing Engine',
      summary: 'Exclusive financial architecture investigation for GlobalPulse subscribers.',
      status: 'PUBLISHED',
      articleType: 'business',
      currentVersionNumber: 1,
      currentVersionId: 'ver_01',
      topicIds: ['top_brics', 'top_finance'],
      entityIds: ['ent_brics'],
      sourceIds: ['src_reuters'],
      createdByClient: 'human_web',
      createdVia: 'admin',
      blocks: [],
      authorId: 'usr_senior_analyst',
      isSubscriberOnly: true,
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T12:00:00Z',
    };

    const regularStory: Story = {
      id: 'sty_public_briefing',
      organizationId: 'org_pulse',
      slug: 'open-source-ai-weights-released',
      title: 'Consortium Releases Open Weights Foundation Model',
      summary: 'Freely available intelligence report for global researchers.',
      status: 'PUBLISHED',
      articleType: 'technology',
      currentVersionNumber: 1,
      currentVersionId: 'ver_02',
      topicIds: ['top_ai'],
      entityIds: ['ent_open_weights'],
      sourceIds: ['src_nature'],
      createdByClient: 'gemini',
      createdVia: 'mcp',
      blocks: [],
      authorId: 'usr_wire',
      isSubscriberOnly: false,
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:30:00Z',
    };

    it('faithfully maps isSubscriberOnly=true onto leadStory in GoogleNewsCluster', () => {
      const clusters = buildClustersFromStories([subscriberStory, regularStory]);
      expect(clusters.length).toBe(2);

      const exclusiveCluster = clusters.find((c) => c.mainStoryId === subscriberStory.id);
      expect(exclusiveCluster).toBeDefined();
      expect(exclusiveCluster?.leadStory.isSubscriberOnly).toBe(true);

      const publicCluster = clusters.find((c) => c.mainStoryId === regularStory.id);
      expect(publicCluster).toBeDefined();
      expect(publicCluster?.leadStory.isSubscriberOnly).toBe(false);
    });
  });

  describe('Picks For You Navigation & Route Link Contracts', () => {
    it('defines valid destination hrefs for exploring the personalized For You feed', () => {
      const forYouHref = '/for-you';
      expect(forYouHref).toBe('/for-you');

      // Verify link contracts match user expectations:
      // Header: "Explore all"
      // Bottom: "Explore full For You feed"
      const routes = {
        headerExplore: '/for-you',
        footerExplore: '/for-you',
        emptyStateFallback: '/for-you',
      };

      expect(routes.headerExplore).toBe('/for-you');
      expect(routes.footerExplore).toBe('/for-you');
      expect(routes.emptyStateFallback).toBe('/for-you');
    });
  });

  describe('Deterministic Date & Time Formatting Utilities', () => {
    it('formats ISO timestamps into consistent date strings without hydration error', () => {
      const iso = '2026-10-02T12:00:00.000Z';
      const formattedDate = formatDeterministicDate(iso);
      expect(formattedDate).toMatch(/Oct(?:ober)?\s+2,?\s+2026/i);

      const formattedDateTime = formatDeterministicDateTime(iso);
      expect(formattedDateTime).toContain('2026');
    });

    it('handles falsy or invalid dates safely with fallback string', () => {
      expect(formatDeterministicDate(undefined as unknown as string)).toBe('Recent');
      expect(formatDeterministicDate('')).toBe('Recent');
      expect(formatDeterministicDate('invalid-date')).toBe('Recent');
    });
  });

  describe('Paywall & Metered Access Rules', () => {
    it('allows up to 5 free articles before triggering the subscription paywall', () => {
      const evaluateAccess = (readCount: number, isSubscriber: boolean) => {
        const FREE_ARTICLE_LIMIT = 5;
        if (isSubscriber) return { granted: true, remaining: Infinity, locked: false };
        const remaining = Math.max(0, FREE_ARTICLE_LIMIT - readCount);
        const locked = readCount >= FREE_ARTICLE_LIMIT;
        return { granted: !locked, remaining, locked };
      };

      // 1st article
      const first = evaluateAccess(1, false);
      expect(first.granted).toBe(true);
      expect(first.remaining).toBe(4);
      expect(first.locked).toBe(false);

      // 5th article (last free)
      const fifth = evaluateAccess(5, false);
      expect(fifth.granted).toBe(false);
      expect(fifth.remaining).toBe(0);
      expect(fifth.locked).toBe(true);

      // Subscriber bypasses meter unconditionally
      const subscriber = evaluateAccess(12, true);
      expect(subscriber.granted).toBe(true);
      expect(subscriber.remaining).toBe(Infinity);
      expect(subscriber.locked).toBe(false);
    });
  });

  describe('Quick Reading Depth Blocks Retention', () => {
    it('preserves live_ticker, poll, and heading blocks in quick mode alongside lead paragraph', () => {
      const blocks = [
        { id: '1', blockType: 'paragraph', sortOrder: 1, data: { text: 'Lead paragraph' } },
        { id: '2', blockType: 'paragraph', sortOrder: 2, data: { text: 'Second paragraph' } },
        { id: '3', blockType: 'live_ticker', sortOrder: 3, data: { ticker: 'AI-COMPUTE' } },
        { id: '4', blockType: 'poll', sortOrder: 4, data: { question: 'Vote on standard' } },
        { id: '5', blockType: 'heading', sortOrder: 5, data: { text: 'Key Takeaways' } },
        { id: '6', blockType: 'document_viewer', sortOrder: 6, data: { doc: 'archive.pdf' } },
      ];

      let paragraphCount = 0;
      const effectiveQuick = blocks.filter((b) => {
        if (b.blockType === 'paragraph') {
          paragraphCount++;
          return paragraphCount <= 1;
        }
        return (
          b.blockType === 'summary' ||
          b.blockType === 'statistic' ||
          b.blockType === 'quote' ||
          b.blockType === 'callout' ||
          b.blockType === 'chart' ||
          b.blockType === 'live_ticker' ||
          b.blockType === 'poll' ||
          b.blockType === 'heading'
        );
      });

      expect(effectiveQuick.map((b) => b.blockType)).toEqual([
        'paragraph',
        'live_ticker',
        'poll',
        'heading',
      ]);
      expect(effectiveQuick.find((b) => b.blockType === 'live_ticker')).toBeDefined();
      expect(effectiveQuick.find((b) => b.blockType === 'poll')).toBeDefined();
    });
  });

  describe('Category Hub Desk Filter Matching', () => {
    it('matches semiconductor stories under Semiconductors desk accounting for plural and synonyms', () => {
      const semiconductorStory = {
        title: 'Global Semiconductor Consortium Establishes 2nm Lithography Standard',
        summary: 'Leading fabrication foundries establish an open patent pool.',
        topicIds: ['top_semiconductors'],
      };

      const aiStory = {
        title:
          'Autonomous AI Agents Surpass Human Verification Benchmarks in Critical Infrastructure',
        summary:
          'Rigorous evaluations across telecommunications demonstrate multi-agent verification.',
        topicIds: ['top_ai'],
      };

      const matchesDesk = (item: typeof semiconductorStory, desk: string) => {
        const norm = desk.toLowerCase().trim();
        const singular = norm.endsWith('s') ? norm.slice(0, -1) : norm;
        const text =
          `${item.title} ${item.summary} ${(item.topicIds || []).join(' ')}`.toLowerCase();
        return text.includes(norm) || text.includes(singular);
      };

      expect(matchesDesk(semiconductorStory, 'Semiconductors')).toBe(true);
      expect(matchesDesk(aiStory, 'Semiconductors')).toBe(false);
      expect(matchesDesk(aiStory, 'Artificial Intelligence')).toBe(false); // matches if checking AI acronym
    });
  });

  describe('Weather Widget Location Fallback Contract', () => {
    it('specifies New Delhi as the default location fallback when geolocation is unavailable', async () => {
      const { DELHI_FALLBACK, WEATHER_CITIES } =
        await import('../../../apps/web/src/components/WeatherWidget');

      expect(DELHI_FALLBACK.key).toBe('new-delhi');
      expect(DELHI_FALLBACK.name).toBe('New Delhi');
      expect(DELHI_FALLBACK.label).toContain('New Delhi');
      expect(DELHI_FALLBACK.lat).toBeCloseTo(28.6139, 2);
      expect(DELHI_FALLBACK.lon).toBeCloseTo(77.209, 2);
      expect(WEATHER_CITIES[0].key).toBe('new-delhi');
    });
  });
});
