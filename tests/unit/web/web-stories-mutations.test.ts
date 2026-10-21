import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Story } from '@ai-news/schemas';
import { eventBus } from '../../../apps/web/src/lib/event-bus';

const apiMocks = vi.hoisted(() => ({
  createStory: vi.fn(),
  publishStory: vi.fn(),
  unpublishStory: vi.fn(),
  updateStory: vi.fn(),
  createStoryVersion: vi.fn(),
  getStory: vi.fn(),
  deleteStory: vi.fn(),
  submitForReview: vi.fn(),
  reviewStory: vi.fn(),
  subscribeToRealtimeEvents: vi.fn(() => () => {}),
  listStories: vi.fn(async () => [] as Story[]),
}));

vi.mock('@ai-news/api-client', () => apiMocks);

// Store module is imported after the mock so its internal `import * as api` binds to the mock.
const {
  saveUserStory,
  updateUserStory,
  toggleStoryStatus,
  deleteUserStory,
  submitStoryForReview,
  reviewUserStory,
  notifyStoryMutation,
} = await import('../../../apps/web/src/lib/news-store');

const baseStory: Partial<Story> = {
  id: 'sty_local_1',
  slug: 'local-agent-dispatch',
  title: 'Local Agent Dispatch',
  summary: 'A locally authored story',
  status: 'DRAFT',
};

describe('Web Client Stories Store — Mutation Layer', () => {
  beforeEach(() => {
    Object.values(apiMocks).forEach((fn) => fn.mockReset());
    apiMocks.subscribeToRealtimeEvents.mockReturnValue(() => {});
  });

  it('saveUserStory creates a story via the API with sensible defaults', async () => {
    apiMocks.createStory.mockResolvedValue(baseStory);

    const created = await saveUserStory({
      title: 'Local Agent Dispatch',
      summary: 'A locally authored story',
    });

    expect(created.id).toBe('sty_local_1');
    expect(apiMocks.createStory).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Local Agent Dispatch',
        articleType: 'developing_story',
        topicIds: [],
        blocks: [],
      })
    );
    expect(apiMocks.publishStory).not.toHaveBeenCalled();
  });

  it('saveUserStory publishes immediately when requested', async () => {
    apiMocks.createStory.mockResolvedValue(baseStory);
    apiMocks.publishStory.mockResolvedValue({ ...baseStory, status: 'PUBLISHED' });

    await saveUserStory({
      title: 'Now Live',
      summary: 'Published on save',
      status: 'PUBLISHED',
    });

    expect(apiMocks.publishStory).toHaveBeenCalledWith('sty_local_1');
  });

  it('updateUserStory commits a version snapshot when blocks are provided and switches status', async () => {
    apiMocks.updateStory.mockResolvedValue({ ...baseStory, status: 'DRAFT' });
    apiMocks.createStoryVersion.mockResolvedValue({
      id: 'styver_1',
      versionNumber: 2,
      changeSummary: 'Story updated via Editorial CMS',
      blocks: [],
    });
    apiMocks.publishStory.mockResolvedValue({ ...baseStory, status: 'PUBLISHED' });

    await updateUserStory('sty_local_1', {
      title: 'Local Agent Dispatch',
      summary: 'Revised summary',
      status: 'PUBLISHED',
      blocks: [
        {
          id: 'blk_1',
          blockType: 'heading',
          sortOrder: 0,
          data: { level: 2, text: 'Revised' },
        },
      ],
    });

    expect(apiMocks.updateStory).toHaveBeenCalledWith(
      'sty_local_1',
      expect.objectContaining({ title: 'Local Agent Dispatch' })
    );
    expect(apiMocks.createStoryVersion).toHaveBeenCalledWith(
      'sty_local_1',
      expect.objectContaining({
        changeSummary: 'Story updated via Editorial CMS',
        blocks: [expect.objectContaining({ blockType: 'heading' })],
      })
    );
    expect(apiMocks.publishStory).toHaveBeenCalledWith('sty_local_1');
  });

  it('updateUserStory unpublishes a live story moved back to draft and skips snapshots without blocks', async () => {
    apiMocks.updateStory.mockResolvedValue({ ...baseStory, status: 'PUBLISHED' });
    apiMocks.unpublishStory.mockResolvedValue({ ...baseStory, status: 'DRAFT' });

    await updateUserStory('sty_local_1', {
      title: 'Pulled Back',
      summary: 'No blocks here',
      status: 'DRAFT',
    });

    expect(apiMocks.createStoryVersion).not.toHaveBeenCalled();
    expect(apiMocks.unpublishStory).toHaveBeenCalledWith('sty_local_1');
    expect(apiMocks.publishStory).not.toHaveBeenCalled();
  });

  it('toggleStoryStatus unpublishes a PUBLISHED story and publishes a DRAFT story', async () => {
    apiMocks.getStory.mockResolvedValue({ ...baseStory, status: 'PUBLISHED' });
    await toggleStoryStatus('sty_local_1');
    expect(apiMocks.unpublishStory).toHaveBeenCalledWith('sty_local_1');

    apiMocks.getStory.mockReset();
    apiMocks.getStory.mockResolvedValue({ ...baseStory, status: 'DRAFT' });
    apiMocks.publishStory.mockResolvedValue({ ...baseStory, status: 'PUBLISHED' });
    await toggleStoryStatus('sty_local_1');
    expect(apiMocks.publishStory).toHaveBeenCalledWith('sty_local_1');
  });

  it('deleteUserStory removes the story via the API', async () => {
    apiMocks.deleteStory.mockResolvedValue(undefined);
    await deleteUserStory('sty_local_1');
    expect(apiMocks.deleteStory).toHaveBeenCalledWith('sty_local_1');
  });

  it('submitStoryForReview returns the reviewed story and survives API errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    apiMocks.submitForReview.mockResolvedValue({ ...baseStory, status: 'IN_REVIEW' });
    const submitted = await submitStoryForReview('sty_local_1');
    expect(submitted?.status).toBe('IN_REVIEW');

    apiMocks.submitForReview.mockReset();
    apiMocks.submitForReview.mockRejectedValue(new Error('review queue unavailable'));
    const failed = await submitStoryForReview('sty_local_1');
    expect(failed).toBeNull();

    errorSpy.mockRestore();
  });

  it('reviewUserStory approves or rejects and degrades to null on failure', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    apiMocks.reviewStory.mockResolvedValue({ ...baseStory, status: 'REJECTED' });
    const rejected = await reviewUserStory('sty_local_1', 'reject', 'Fix sourcing');
    expect(rejected?.status).toBe('REJECTED');
    expect(apiMocks.reviewStory).toHaveBeenCalledWith('sty_local_1', {
      action: 'reject',
      feedback: 'Fix sourcing',
    });

    apiMocks.reviewStory.mockReset();
    apiMocks.reviewStory.mockRejectedValue(new Error('forbidden'));
    const failed = await reviewUserStory('sty_local_1', 'approve');
    expect(failed).toBeNull();

    errorSpy.mockRestore();
  });

  it('every successful mutation broadcasts stories_updated on the app event bus', async () => {
    let mutationEvents = 0;
    const unsubscribe = eventBus.subscribe('stories_updated', () => {
      mutationEvents++;
    });

    apiMocks.createStory.mockResolvedValue(baseStory);
    await saveUserStory({ title: 'T', summary: 'S' });

    apiMocks.updateStory.mockResolvedValue(baseStory);
    await updateUserStory('sty_local_1', { title: 'T', summary: 'S' });

    apiMocks.deleteStory.mockResolvedValue(undefined);
    await deleteUserStory('sty_local_1');

    notifyStoryMutation();

    expect(mutationEvents).toBe(4);
    unsubscribe();
  });
});
