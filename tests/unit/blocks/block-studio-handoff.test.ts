import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handoffKey, sendBlockToComposer, takeBlockFromComposer } from '@ai-news/block-studio';

/**
 * The studio hands a block to the composer through the browser.
 *
 * A story that is still being written does not exist on the server, so there
 * is nowhere for the studio to write a block into. The block travels through
 * the browser instead and lands in the composer's draft.
 */
describe('Block studio handoff', () => {
  /*
   * The suite runs in a node environment, so the browser's storage is stood
   * in for. The handoff only ever touches `localStorage`, so that is all
   * that needs to exist.
   */
  const store = new Map<string, string>();
  const localStorageStub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };

  beforeEach(() => {
    store.clear();
    (globalThis as { window?: unknown }).window = { localStorage: localStorageStub };
  });

  afterEach(() => {
    store.clear();
    delete (globalThis as { window?: unknown }).window;
  });

  it('carries a block from the studio to the composer', () => {
    sendBlockToComposer('session-1', {
      blockType: 'chart',
      data: { chartType: 'bar', title: 'A chart' },
    });

    const received = takeBlockFromComposer('session-1');

    expect(received).not.toBeNull();
    expect(received?.blockType).toBe('chart');
    expect(received?.data).toEqual({ chartType: 'bar', title: 'A chart' });
    expect(received?.sentAt).toBeTruthy();
  });

  it('carries the id of the block being replaced', () => {
    sendBlockToComposer('session-1', {
      blockType: 'image',
      data: { url: 'https://example.com/a.png' },
      blockId: 'blk_existing',
    });

    expect(takeBlockFromComposer('session-1')?.blockId).toBe('blk_existing');
  });

  it('only hands the block over once', () => {
    sendBlockToComposer('session-1', { blockType: 'image', data: {} });

    expect(takeBlockFromComposer('session-1')).not.toBeNull();
    // The same block must not be added to the draft twice.
    expect(takeBlockFromComposer('session-1')).toBeNull();
  });

  it('keeps sessions apart', () => {
    sendBlockToComposer('session-1', { blockType: 'image', data: { url: 'a' } });
    sendBlockToComposer('session-2', { blockType: 'chart', data: { title: 'b' } });

    expect(takeBlockFromComposer('session-1')?.blockType).toBe('image');
    expect(takeBlockFromComposer('session-2')?.blockType).toBe('chart');
  });

  it('has nothing to hand over for an unknown session', () => {
    expect(takeBlockFromComposer('never-opened')).toBeNull();
  });

  it('writes under a key scoped to the session', () => {
    sendBlockToComposer('session-1', { blockType: 'image', data: {} });

    expect(localStorageStub.getItem(handoffKey('session-1'))).not.toBeNull();
  });
});
