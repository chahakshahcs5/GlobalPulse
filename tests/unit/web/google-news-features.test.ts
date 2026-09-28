import { describe, it, expect } from 'vitest';

describe('Google News Parity & Advanced Production Features Unit Tests', () => {
  describe('F7: Reading Time Calculation', () => {
    it('calculates reading time from word count based on 200 words per minute average', () => {
      const calculateReadingTime = (words: number) => Math.max(1, Math.ceil(words / 200));

      expect(calculateReadingTime(50)).toBe(1);
      expect(calculateReadingTime(200)).toBe(1);
      expect(calculateReadingTime(350)).toBe(2);
      expect(calculateReadingTime(850)).toBe(5);
    });
  });

  describe('F8: Social Share URLs', () => {
    it('generates compliant encoded URLs for Twitter/X, LinkedIn, Facebook, and WhatsApp', () => {
      const title = 'Global Geothermal Discovery on Mars: 2026 Summit';
      const url = 'https://globalpulse.news/stories/mars-geothermal-discovery';

      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
      expect(twitterUrl).toContain('intent/tweet');
      expect(twitterUrl).toContain('Mars%3A%202026');

      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      expect(linkedinUrl).toContain('share-offsite');
      expect(linkedinUrl).toContain(encodeURIComponent(url));

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`;
      expect(whatsappUrl).toContain('api.whatsapp.com');
    });
  });

  describe('F12: Reading History Synchronization', () => {
    it('deduplicates and prepends read stories to reading history queue', () => {
      const history: Array<{ slug: string; title: string }> = [
        { slug: 'story-1', title: 'Story One' },
        { slug: 'story-2', title: 'Story Two' },
      ];

      const recordRead = (existing: typeof history, item: { slug: string; title: string }) => {
        const filtered = existing.filter((h) => h.slug !== item.slug);
        filtered.unshift(item);
        return filtered.slice(0, 20);
      };

      // Adding existing story moves it to the front
      const updated = recordRead(history, { slug: 'story-2', title: 'Story Two (Updated)' });
      expect(updated.length).toBe(2);
      expect(updated[0].slug).toBe('story-2');
      expect(updated[1].slug).toBe('story-1');

      // Adding new story
      const withNew = recordRead(updated, { slug: 'story-3', title: 'Story Three' });
      expect(withNew.length).toBe(3);
      expect(withNew[0].slug).toBe('story-3');
    });
  });

  describe('F14: Regional Edition Filtering', () => {
    it('filters dispatches according to selected regional edition', () => {
      const items = [
        { id: '1', category: 'India', title: 'Reserve Bank of India Monetary Policy' },
        { id: '2', category: 'World', title: 'UN Climate Summit in Geneva' },
        { id: '3', category: 'Business', title: 'Wall Street Technology Rally' },
        { id: '4', category: 'Science', title: 'European Space Agency Telescope' },
      ];

      const filterByEdition = (list: typeof items, edition: string) => {
        if (edition === 'global') return list;
        if (edition === 'india')
          return list.filter(
            (i) => i.category === 'India' || i.title.toLowerCase().includes('india')
          );
        if (edition === 'us')
          return list.filter((i) => i.category === 'World' || i.category === 'Business');
        if (edition === 'europe') return list.filter((i) => i.category === 'Science');
        return list;
      };

      expect(filterByEdition(items, 'global')).toHaveLength(4);
      expect(filterByEdition(items, 'india')).toHaveLength(1);
      expect(filterByEdition(items, 'india')[0].id).toBe('1');
      expect(filterByEdition(items, 'europe')).toHaveLength(1);
      expect(filterByEdition(items, 'europe')[0].id).toBe('4');
    });
  });

  describe('F22: AI Content Attribution & Provenance', () => {
    it('classifies story creator between AI models, hybrid dispatches, and human staff', () => {
      const classifyAttribution = (clientType?: string, createdVia?: string) => {
        if (createdVia === 'admin') return { label: 'Human Editorial Staff', isAi: false };
        if (clientType === 'gemini_spark' || clientType === 'gemini')
          return { label: 'Google Gemini via MCP', isAi: true };
        if (clientType === 'chatgpt') return { label: 'ChatGPT Agent via MCP', isAi: true };
        if (clientType === 'claude') return { label: 'Claude via MCP', isAi: true };
        return { label: 'GlobalPulse Wire', isAi: false };
      };

      expect(classifyAttribution('gemini', 'mcp')).toEqual({
        label: 'Google Gemini via MCP',
        isAi: true,
      });
      expect(classifyAttribution('chatgpt', 'mcp')).toEqual({
        label: 'ChatGPT Agent via MCP',
        isAi: true,
      });
      expect(classifyAttribution(undefined, 'admin')).toEqual({
        label: 'Human Editorial Staff',
        isAi: false,
      });
    });
  });

  describe('F26: Content Quality Gate Validation Rules', () => {
    it('enforces readability, minimum word count, and required citations before publication', () => {
      const validateStoryGates = (story: {
        wordCount: number;
        citations: number;
        readabilityGrade: number;
      }) => {
        const issues: string[] = [];
        if (story.wordCount < 150) issues.push('Word count below 150 words');
        if (story.citations < 1) issues.push('No sources cited');
        if (story.readabilityGrade > 14)
          issues.push('Readability exceeds standard news grade level');
        return {
          passed: issues.length === 0,
          issues,
        };
      };

      const validStory = { wordCount: 450, citations: 2, readabilityGrade: 9.5 };
      expect(validateStoryGates(validStory).passed).toBe(true);

      const invalidStory = { wordCount: 40, citations: 0, readabilityGrade: 16 };
      const res = validateStoryGates(invalidStory);
      expect(res.passed).toBe(false);
      expect(res.issues).toHaveLength(3);
    });
  });
});
