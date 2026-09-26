import { describe, it, expect, beforeEach } from 'vitest';
import { OfflineStorageService, OfflineStory } from '../../../apps/mobile/src/services/storage';

describe('Mobile OfflineStorageService Unit Tests', () => {
  let storage: OfflineStorageService;

  beforeEach(() => {
    storage = new OfflineStorageService();
  });

  it('saves story and retrieves it by ID', () => {
    const sampleStory: OfflineStory = {
      id: 'sty_mobile_1',
      slug: 'mars-water-discovery',
      title: 'Geothermal Reservoirs Found on Mars',
      summary: 'Robotic probes detect liquid water under southern polar cap.',
      articleType: 'HARD_NEWS',
      currentVersionNumber: 1,
      blocks: [],
      savedAt: new Date().toISOString(),
      readStatus: false,
    };

    storage.saveStory(sampleStory);
    const retrieved = storage.getStory('sty_mobile_1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Geothermal Reservoirs Found on Mars');
    expect(retrieved?.readStatus).toBe(false);
  });

  it('sorts all saved stories in descending chronological order of save timestamp', async () => {
    const storyA: OfflineStory = {
      id: 'sty_old',
      slug: 'old-story',
      title: 'Older Story',
      summary: 'Old',
      articleType: 'HARD_NEWS',
      currentVersionNumber: 1,
      blocks: [],
      savedAt: new Date(Date.now() - 100000).toISOString(),
      readStatus: false,
    };

    const storyB: OfflineStory = {
      id: 'sty_new',
      slug: 'new-story',
      title: 'Newer Story',
      summary: 'New',
      articleType: 'BREAKING',
      currentVersionNumber: 2,
      blocks: [],
      savedAt: new Date().toISOString(),
      readStatus: false,
    };

    storage.saveStory(storyA);
    // Slight pause to ensure distinct savedAt
    await new Promise((r) => setTimeout(r, 10));
    storage.saveStory(storyB);

    const all = storage.getAllSavedStories();
    expect(all.length).toBe(2);
    expect(all[0].id).toBe('sty_new');
    expect(all[1].id).toBe('sty_old');
  });

  it('toggles bookmarks and reports bookmark state accurately', () => {
    expect(storage.isBookmarked('sty_fav')).toBe(false);

    // Toggle ON
    const state1 = storage.toggleBookmark('sty_fav');
    expect(state1).toBe(true);
    expect(storage.isBookmarked('sty_fav')).toBe(true);

    // Toggle OFF
    const state2 = storage.toggleBookmark('sty_fav');
    expect(state2).toBe(false);
    expect(storage.isBookmarked('sty_fav')).toBe(false);
  });

  it('marks story read status accurately', () => {
    storage.saveStory({
      id: 'sty_read_test',
      slug: 'read-test',
      title: 'Unread News',
      summary: 'Testing read states',
      articleType: 'HARD_NEWS',
      currentVersionNumber: 1,
      blocks: [],
      savedAt: new Date().toISOString(),
      readStatus: false,
    });

    expect(storage.getStory('sty_read_test')?.readStatus).toBe(false);

    storage.markAsRead('sty_read_test');
    expect(storage.getStory('sty_read_test')?.readStatus).toBe(true);
  });

  it('removes story and clears associated bookmark', () => {
    storage.saveStory({
      id: 'sty_delete_me',
      slug: 'delete-me',
      title: 'Temporary dispatch',
      summary: 'To be removed',
      articleType: 'HARD_NEWS',
      currentVersionNumber: 1,
      blocks: [],
      savedAt: new Date().toISOString(),
      readStatus: false,
    });
    storage.toggleBookmark('sty_delete_me');

    expect(storage.isBookmarked('sty_delete_me')).toBe(true);
    expect(storage.getStory('sty_delete_me')).toBeDefined();

    const removed = storage.removeStory('sty_delete_me');
    expect(removed).toBe(true);
    expect(storage.getStory('sty_delete_me')).toBeUndefined();
    expect(storage.isBookmarked('sty_delete_me')).toBe(false);
  });

  it('clears all cached stories and bookmarks with clearAll()', () => {
    storage.saveStory({
      id: 'sty_1',
      slug: 's1',
      title: 'Story 1',
      summary: '1',
      articleType: 'HARD_NEWS',
      currentVersionNumber: 1,
      blocks: [],
      savedAt: new Date().toISOString(),
      readStatus: false,
    });
    storage.toggleBookmark('sty_1');

    storage.clearAll();
    expect(storage.getAllSavedStories().length).toBe(0);
    expect(storage.isBookmarked('sty_1')).toBe(false);
  });
});
