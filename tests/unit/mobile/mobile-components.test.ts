import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Dimensions } from 'react-native';
import MobileApp, { SAMPLE_MOBILE_STORIES } from '../../../apps/mobile/src/App';
import { FeedScreen } from '../../../apps/mobile/src/screens/FeedScreen';
import { StoryDetailScreen } from '../../../apps/mobile/src/screens/StoryDetailScreen';
import { BookmarksScreen } from '../../../apps/mobile/src/screens/BookmarksScreen';
import { MobileBlockRenderer } from '../../../apps/mobile/src/components/MobileBlockRenderer';
import { offlineStorage } from '../../../apps/mobile/src/services/storage';

describe('React Native & Expo Mobile Application (Unit Tests)', () => {
  beforeEach(() => {
    offlineStorage.clearAll();
    Dimensions.set({ width: 390, height: 844 });
  });

  describe('MobileBlockRenderer (Authentic React Native Blocks)', () => {
    it('renders all block types into native styled structures', () => {
      const sampleBlocks = [
        {
          id: 'b1',
          blockType: 'heading',
          data: { level: 1, text: 'Breaking Headlines', subtext: 'Global impact analysis' },
        },
        {
          id: 'b2',
          blockType: 'paragraph',
          data: { text: 'Key international developments reported across sectors.' },
        },
        {
          id: 'b3',
          blockType: 'summary',
          data: {
            headline: 'Executive Points',
            bulletPoints: ['Point Alpha', 'Point Beta'],
          },
        },
        {
          id: 'b4',
          blockType: 'quote',
          data: { quote: 'Historic milestone.', attribution: 'Chief Economist', title: 'Advisory Board' },
        },
        {
          id: 'b5',
          blockType: 'chart',
          data: {
            chartType: 'bar',
            title: 'GDP Comparison',
            values: [{ year: '2024', val: 100 }, { year: '2026', val: 140 }],
            sourceAttribution: 'IMF',
          },
        },
        {
          id: 'b6',
          blockType: 'timeline',
          data: {
            title: 'Summit Timeline',
            items: [{ date: 'Day 1', headline: 'Opening', body: 'Plenary begins.' }],
          },
        },
        {
          id: 'b7',
          blockType: 'map',
          data: {
            title: 'Summit Venue',
            center: [77.2, 28.6],
            markers: [{ title: 'Plenary Hall', coordinates: [77.2, 28.6] }],
          },
        },
        {
          id: 'b8',
          blockType: 'statistic',
          data: {
            label: 'Trade Volume',
            value: '$41B',
            trend: 'up',
            trendValue: '+28%',
          },
        },
        {
          id: 'b9',
          blockType: 'callout',
          data: { title: 'Security Advisory', text: 'Precautionary measures enacted.' },
        },
        {
          id: 'b10',
          blockType: 'video',
          data: { url: 'https://example.com/video.mp4', caption: 'Press Conference', durationSeconds: 120 },
        },
        {
          id: 'b11',
          blockType: 'audio',
          data: { title: 'Daily Briefing', narrator: 'Anchor F', durationSeconds: 90, transcript: 'Welcome to the update.' },
        },
        {
          id: 'b12',
          blockType: 'source',
          data: { publisher: 'Reuters', title: 'Official Accord Text' },
        },
        {
          id: 'b13',
          blockType: 'entity',
          data: { name: 'BRICS', type: 'ORGANIZATION', description: 'Multilateral bloc' },
        },
        {
          id: 'b14',
          blockType: 'what_changed',
          data: {
            previousVersionNumber: 1,
            items: [{ changeType: 'updated', description: 'Refined statistics' }],
          },
        },
        {
          id: 'b15',
          blockType: 'table',
          data: {
            title: 'Tariff Matrix',
            headers: ['Sector', 'Rate'],
            rows: [['Agriculture', '0%'], ['Tech', '2%']],
          },
        },
      ];

      const html = renderToString(React.createElement(MobileBlockRenderer, { blocks: sampleBlocks }));
      expect(html).toContain('Breaking Headlines');
      expect(html).toContain('Global impact analysis');
      expect(html).toContain('Key international developments');
      expect(html).toContain('EXECUTIVE BRIEFING');
      expect(html).toContain('Point Alpha');
      expect(html).toContain('Historic milestone.');
      expect(html).toContain('Chief Economist');
      expect(html).toContain('GDP Comparison');
      expect(html).toContain('Summit Timeline');
      expect(html).toContain('Summit Venue');
      expect(html).toContain('Trade Volume');
      expect(html).toContain('$41B');
      expect(html).toContain('Security Advisory');
      expect(html).toContain('Press Conference');
      expect(html).toContain('Daily Briefing');
      expect(html).toContain('Reuters');
      expect(html).toContain('BRICS');
      expect(html).toContain('Refined statistics');
      expect(html).toContain('Tariff Matrix');
    });

    it('renders empty fallback when blocks array is empty', () => {
      const html = renderToString(React.createElement(MobileBlockRenderer, { blocks: [] }));
      expect(html).toContain('No content blocks available for this revision.');
    });
  });

  describe('FeedScreen (Authentic React Native Feed)', () => {
    it('renders header branding and story cards with version pills', () => {
      let selected: any = null;
      const html = renderToString(
        React.createElement(FeedScreen, {
          stories: SAMPLE_MOBILE_STORIES,
          onSelectStory: (s) => {
            selected = s;
          },
        })
      );

      expect(html).toContain('GLOBALPULSE');
      expect(html).toContain('AI INGESTION ACTIVE');
      expect(html).toContain('MOBILE EDITION');
      expect(html).toContain('BREAKING');
      expect(html).toContain('BRICS Expansion 2026: Historic Geoeconomic Shift');
      expect(html).toContain('v2');
      expect(html).toContain('Read Dispatch');
    });
  });

  describe('StoryDetailScreen (Authentic React Native Reader)', () => {
    it('renders story detail view with metadata and actions', () => {
      const story = SAMPLE_MOBILE_STORIES[0];
      const html = renderToString(
        React.createElement(StoryDetailScreen, {
          story,
          onBack: () => {},
        })
      );

      expect(html).toContain('BRICS Expansion 2026: Historic Geoeconomic Shift');
      expect(html).toContain('Version 2');
      expect(html).toContain('Audio');
      expect(html).toContain('Save');
      expect(html).toContain('New Multilateral Financial Architecture');
    });
  });

  describe('BookmarksScreen (Offline Cache View)', () => {
    it('renders empty library state when no articles are saved', () => {
      const html = renderToString(
        React.createElement(BookmarksScreen, {
          onSelectStory: () => {},
        })
      );

      expect(html).toContain('Offline Library');
      expect(html).toContain('0 dispatches cached');
      expect(html).toContain('No Offline Articles Yet');
    });

    it('renders cached articles list when stories are saved', () => {
      offlineStorage.saveStory(SAMPLE_MOBILE_STORIES[0]);

      const html = renderToString(
        React.createElement(BookmarksScreen, {
          onSelectStory: () => {},
        })
      );

      expect(html).toContain('Offline Library');
      expect(html).toContain('1 dispatch cached');
      expect(html).toContain('BRICS Expansion 2026: Historic Geoeconomic Shift');
      expect(html).toContain('CACHED OFFLINE');
    });
  });

  describe('Responsive Tablet Dual-Pane vs Phone Layout', () => {
    it('renders tablet dual-pane layout when width >= 768px', () => {
      Dimensions.set({ width: 1024, height: 768 });

      const html = renderToString(React.createElement(MobileApp));
      expect(html).toContain('Dispatches');
      expect(html).toContain('Offline Cache');
      expect(html).toContain('DISPATCH READER');
      expect(html).toContain('BRICS Expansion 2026: Historic Geoeconomic Shift');
    });

    it('renders phone single-pane stack layout when width < 768px', () => {
      Dimensions.set({ width: 390, height: 844 });

      const html = renderToString(React.createElement(MobileApp));
      expect(html).toContain('GLOBALPULSE');
      expect(html).toContain('Feed');
      expect(html).toContain('Saved');
    });
  });
});
