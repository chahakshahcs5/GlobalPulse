import { describe, it, expect, vi } from 'vitest';
import { PrismaStoryRepository } from '../../../libs/database/src/repositories/prisma/story.prisma';
import type { Story, StoryBlock } from '@ai-news/schemas';

describe('PrismaStoryRepository (Postgres/Prisma implementation)', () => {
  it('correctly maps and preserves scheduledPublishAt, isSubscriberOnly, wordCount, and readingTimeMinutes', async () => {
    const scheduledDate = new Date('2026-10-25T12:00:00.000Z');
    let savedData: Record<string, unknown> | null = null;

    const mockStoryClient = {
      create: vi.fn().mockImplementation(async ({ data }) => {
        savedData = data;
        return {
          ...data,
          createdAt: new Date('2026-10-23T10:00:00.000Z'),
          updatedAt: new Date('2026-10-23T10:00:00.000Z'),
        };
      }),
      findFirst: vi.fn().mockImplementation(async () => {
        if (!savedData) return null;
        return {
          ...savedData,
          createdAt: new Date('2026-10-23T10:00:00.000Z'),
          updatedAt: new Date('2026-10-23T10:00:00.000Z'),
          blocks: [],
        };
      }),
    };

    const mockPrisma = {
      story: mockStoryClient,
      storyBlock: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    };

    const repo = new PrismaStoryRepository(() => mockPrisma as unknown as Record<string, unknown>);

    const inputStory: Story = {
      id: 'sty_scheduled_1',
      organizationId: 'org_enterprise',
      slug: 'deep-space-probe-telemetry',
      title: 'Voyager 1 Telemetry Analysis',
      summary: 'Detailed signal decoding from interstellar space.',
      status: 'SCHEDULED',
      articleType: 'science',
      authorId: 'usr_astronomer',
      createdByClient: 'gemini',
      createdVia: 'api',
      currentVersionNumber: 1,
      topicIds: ['top_space'],
      entityIds: ['ent_voyager'],
      sourceIds: ['src_nasa'],
      isSubscriberOnly: true,
      scheduledPublishAt: scheduledDate.toISOString(),
      wordCount: 1450,
      readingTimeMinutes: 6,
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await repo.create(inputStory);

    expect(mockStoryClient.create).toHaveBeenCalledTimes(1);
    expect(savedData).not.toBeNull();
    const data = savedData as unknown as Record<string, unknown>;
    // Verify Date conversion
    expect(data.scheduledPublishAt).toEqual(scheduledDate);
    expect(data.isSubscriberOnly).toBe(true);
    expect(data.wordCount).toBe(1450);
    expect(data.readingTimeMinutes).toBe(6);

    // Verify domain mapping back
    expect(result.scheduledPublishAt).toBe(scheduledDate.toISOString());
    expect(result.isSubscriberOnly).toBe(true);
    expect(result.wordCount).toBe(1450);
    expect(result.readingTimeMinutes).toBe(6);
  });

  it('atomically deletes and replaces blocks within a prisma $transaction', async () => {
    const executedOps: string[] = [];

    const mockBlockTxClient = {
      deleteMany: vi.fn().mockImplementation(async ({ where }) => {
        executedOps.push(`deleteMany:${where.storyId}`);
        return { count: 3 };
      }),
      createMany: vi.fn().mockImplementation(async ({ data }) => {
        executedOps.push(`createMany:${data.length}`);
        return { count: data.length };
      }),
    };

    const mockPrisma = {
      $transaction: vi.fn().mockImplementation(async (callback) => {
        executedOps.push('start_tx');
        await callback({ storyBlock: mockBlockTxClient });
        executedOps.push('commit_tx');
      }),
      storyBlock: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    };

    const repo = new PrismaStoryRepository(() => mockPrisma as unknown as Record<string, unknown>);

    const newBlocks: StoryBlock[] = [
      {
        id: 'blk_1',
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: 'First block', format: 'plain' },
      },
      {
        id: 'blk_2',
        blockType: 'heading',
        sortOrder: 1,
        data: { level: 2, text: 'Second block' },
      },
    ];

    await repo.saveBlocks('sty_atomicity_test', newBlocks);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(executedOps).toEqual([
      'start_tx',
      'deleteMany:sty_atomicity_test',
      'createMany:2',
      'commit_tx',
    ]);
  });

  it('fails and aborts without committing if $transaction raises an error during saveBlocks', async () => {
    const mockPrisma = {
      $transaction: vi.fn().mockImplementation(async () => {
        throw new Error('Connection terminated by database during bulk insert');
      }),
    };

    const repo = new PrismaStoryRepository(() => mockPrisma as unknown as Record<string, unknown>);

    await expect(
      repo.saveBlocks('sty_fail', [
        {
          id: 'blk_err',
          blockType: 'paragraph',
          sortOrder: 0,
          data: { text: 'boom', format: 'plain' },
        },
      ])
    ).rejects.toThrow('Connection terminated by database during bulk insert');
  });

  it('enforces tenant isolation across findById and findBySlug', async () => {
    const mockStoryClient = {
      findFirst: vi.fn().mockImplementation(async ({ where }) => {
        if (where.organizationId === 'org_allowed') {
          return {
            id: 'sty_isolated_1',
            organizationId: 'org_allowed',
            slug: 'isolated-story',
            title: 'Isolated',
            summary: 'Summary',
            status: 'PUBLISHED',
            articleType: 'general',
            authorId: 'usr_1',
            createdByClient: 'gemini',
            createdVia: 'api',
            currentVersionNumber: 1,
            topicIds: [],
            entityIds: [],
            sourceIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        return null;
      }),
    };

    const mockPrisma = { story: mockStoryClient };
    const repo = new PrismaStoryRepository(() => mockPrisma as unknown as Record<string, unknown>);

    const allowed = await repo.findById('sty_isolated_1', 'org_allowed');
    expect(allowed).not.toBeNull();
    expect(allowed?.id).toBe('sty_isolated_1');

    const denied = await repo.findById('sty_isolated_1', 'org_other');
    expect(denied).toBeNull();

    expect(mockStoryClient.findFirst).toHaveBeenCalledWith({
      where: { id: 'sty_isolated_1', organizationId: 'org_other' },
      include: { blocks: { orderBy: { sortOrder: 'asc' } } },
    });
  });
});
