import { describe, it, expect } from 'vitest';
import {
  DocumentViewerBlockSchema,
  DocumentHighlightSchema,
  StoryBlockSchema,
  type StoryBlock,
} from '@ai-news/schemas';
import { extractTextContent } from '@ai-news/content';

describe('DocumentViewerBlock & Editorial Verification', () => {
  it('should validate DocumentHighlightSchema', () => {
    const validHighlight = {
      page: 14,
      excerpt:
        'The member states agree to mandatory reporting on compute clusters exceeding 10^26 FLOPs.',
      note: 'Key enforcement threshold for frontier AI models.',
      tag: 'Article 12(3)',
    };
    const parsed = DocumentHighlightSchema.parse(validHighlight);
    expect(parsed.page).toBe(14);
    expect(parsed.tag).toBe('Article 12(3)');
  });

  it('should validate DocumentViewerBlockSchema with default documentType', () => {
    const blockData = {
      id: 'blk_doc_1',
      blockType: 'document_viewer' as const,
      sortOrder: 1,
      data: {
        documentUrl: 'https://documents.globalpulse.news/accord.pdf',
        title: 'International AI Safety Treaty of Geneva',
        pageCount: 64,
        documentType: 'treaty' as const,
        description: 'Complete unredacted draft signed by all 27 delegate delegations.',
        highlights: [
          {
            page: 3,
            excerpt:
              'All automated generative systems must provide verifiable cryptographic audit trails.',
            note: 'Mandatory provenance clause.',
            tag: 'Section 2',
          },
        ],
        sourceAttribution: 'UN Department of Disarmament and Frontier Technologies',
      },
    };

    const parsed = StoryBlockSchema.parse(blockData);
    expect(parsed.blockType).toBe('document_viewer');
    if (parsed.blockType === 'document_viewer') {
      expect(parsed.data.documentType).toBe('treaty');
      expect(parsed.data.pageCount).toBe(64);
      expect(parsed.data.highlights.length).toBe(1);
    }
  });

  it('should reject invalid documentUrl or zero pageCount', () => {
    expect(() =>
      DocumentViewerBlockSchema.parse({
        id: 'blk_doc_invalid',
        blockType: 'document_viewer',
        sortOrder: 1,
        data: {
          documentUrl: 'not-a-valid-url',
          title: 'Invalid',
          pageCount: 0,
        },
      })
    ).toThrow();
  });

  it('should extract document viewer text in extractTextContent for search indexing', () => {
    const blocks: StoryBlock[] = [
      {
        id: 'blk_h_1',
        blockType: 'heading',
        sortOrder: 0,
        data: {
          text: 'Key Legal Filings',
          level: 2,
        },
      },
      {
        id: 'blk_doc_1',
        blockType: 'document_viewer',
        sortOrder: 1,
        data: {
          documentUrl: 'https://documents.globalpulse.news/court-filing.pdf',
          title: 'Federal Trade Commission Antitrust Complaint',
          pageCount: 112,
          documentType: 'court_filing',
          description: 'Official filing alleging anticompetitive exclusive cloud arrangements.',
          highlights: [
            {
              page: 22,
              excerpt:
                'Defendants controlled over seventy percent of high-bandwidth interconnects.',
              note: 'Core monopoly argument.',
            },
          ],
        },
      },
    ];

    const extracted = extractTextContent(blocks);
    expect(extracted).toContain('Key Legal Filings');
    expect(extracted).toContain('Federal Trade Commission Antitrust Complaint');
    expect(extracted).toContain('Defendants controlled over seventy percent');
    expect(extracted).toContain('Core monopoly argument');
  });

  it('should correctly partition blocks into variable depth variants', () => {
    const sampleBlocks: StoryBlock[] = [
      {
        id: 'b1',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Executive Summary',
          bulletPoints: ['Point 1', 'Point 2'],
        },
      },
      {
        id: 'b2',
        blockType: 'paragraph',
        sortOrder: 1,
        data: { text: 'First paragraph intro.', format: 'markdown' },
      },
      {
        id: 'b3',
        blockType: 'paragraph',
        sortOrder: 5,
        data: { text: 'Detailed background history from 10 years ago.', format: 'markdown' },
      },
      {
        id: 'b4',
        blockType: 'document_viewer',
        sortOrder: 6,
        data: {
          documentUrl: 'https://example.com/doc.pdf',
          title: 'Primary Leak',
          pageCount: 10,
          documentType: 'leak',
          highlights: [],
        },
      },
    ];

    const quickTypes = new Set([
      'heading',
      'summary',
      'quote',
      'statistic',
      'chart',
      'live_ticker',
      'poll',
      'callout',
    ]);
    const quick = sampleBlocks.filter(
      (b) => quickTypes.has(b.blockType) || (b.blockType === 'paragraph' && b.sortOrder <= 2)
    );
    const balanced = sampleBlocks.filter((b) => b.blockType !== 'document_viewer');
    const deepDive = sampleBlocks;

    expect(quick.map((b) => b.id)).toEqual(['b1', 'b2']);
    expect(balanced.map((b) => b.id)).toEqual(['b1', 'b2', 'b3']);
    expect(deepDive.length).toBe(4);
  });
});
