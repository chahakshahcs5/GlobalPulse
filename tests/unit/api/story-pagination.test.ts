import { describe, it, expect, afterEach, vi } from 'vitest';
import { listStories, listStoriesPage } from '@ai-news/api-client';

/**
 * The newsroom's stories are read a page at a time.
 *
 * The API answers with the page and a description of the whole — how many
 * stories there are, how many were asked for, and whether there is more.
 * A caller that only wants the stories can use `listStories`; a caller that
 * has to tell the reader how many there are needs the rest.
 */
describe('Story pagination', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const respondWith = (body: unknown) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => body,
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  };

  const story = (id: string) => ({
    id,
    title: `Story ${id}`,
    slug: `story-${id}`,
    status: 'PUBLISHED',
  });

  it('reads the page and the newsroom’s size from the API', async () => {
    respondWith({
      success: true,
      data: [story('a'), story('b')],
      meta: { total: 202, limit: 10, offset: 0, hasMore: true },
    });

    const page = await listStoriesPage({ limit: 10 });

    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(202);
    expect(page.limit).toBe(10);
    expect(page.offset).toBe(0);
    expect(page.hasMore).toBe(true);
  });

  it('asks for the page that was asked for', async () => {
    const fetchMock = respondWith({
      data: [story('k')],
      meta: { total: 202, limit: 10, offset: 20, hasMore: true },
    });

    await listStoriesPage({ limit: 10, offset: 20 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=20');
  });

  it('narrows the list by status, so the count is the API’s', async () => {
    const fetchMock = respondWith({
      data: [story('d')],
      meta: { total: 3, limit: 10, offset: 0, hasMore: false },
    });

    const page = await listStoriesPage({ status: 'DRAFT' });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('status=DRAFT');
    expect(page.total).toBe(3);
    expect(page.hasMore).toBe(false);
  });

  it('falls back to the page when the API does not say', async () => {
    respondWith({ data: [story('a')], meta: { total: 1, limit: 10 } });

    const page = await listStoriesPage({ limit: 10 });

    expect(page.total).toBe(1);
    expect(page.hasMore).toBe(false);
  });

  it('gives the callers that only want stories an array', async () => {
    respondWith({
      data: [story('a'), story('b')],
      meta: { total: 202, limit: 10, offset: 0, hasMore: true },
    });

    const stories = await listStories({ limit: 10 });

    expect(Array.isArray(stories)).toBe(true);
    expect(stories).toHaveLength(2);
  });
});
