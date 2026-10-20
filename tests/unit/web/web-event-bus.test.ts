import { describe, it, expect, vi } from 'vitest';
import {
  eventBus,
  emitStoriesUpdated,
  emitTaxonomyUpdated,
  emitBookmarksUpdated,
  emitSourcesUpdated,
  emitWeatherLocationUpdated,
  type AppEventType,
} from '../../../apps/web/src/lib/event-bus';

describe('Web App Event Bus', () => {
  it('delivers typed payloads to every active subscriber', () => {
    const received: Array<{ event: AppEventType; payload?: { headline?: string } | unknown }> = [];

    const unsubscribeA = eventBus.subscribe<{ headline: string }>('stories_updated', (payload) => {
      received.push({ event: 'stories_updated', payload });
    });
    const unsubscribeB = eventBus.subscribe('stories_updated', (payload) => {
      received.push({ event: 'stories_updated', payload });
    });

    eventBus.emit('stories_updated', { headline: 'BRICS Accord Signed' });

    expect(received.length).toBe(2);
    expect((received[0].payload as { headline?: string })?.headline).toBe('BRICS Accord Signed');
    unsubscribeA();
    unsubscribeB();
  });

  it('returns an unsubscribe function that stops further delivery and cleans up registries', () => {
    let calls = 0;
    const unsubscribe = eventBus.subscribe('bookmarks_updated', () => {
      calls++;
    });

    eventBus.emit('bookmarks_updated');
    expect(calls).toBe(1);

    unsubscribe();
    eventBus.emit('bookmarks_updated');
    expect(calls).toBe(1);
  });

  it('isolates listener failures and keeps notifying remaining subscribers', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const results: string[] = [];
    const unsubscribeBoom = eventBus.subscribe('weather_location_updated', () => {
      throw new Error('listener exploded');
    });
    const unsubscribeOk = eventBus.subscribe('weather_location_updated', () => {
      results.push('survived');
    });

    expect(() => emitWeatherLocationUpdated('lat/lon')).not.toThrow();

    expect(results).toEqual(['survived']);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('weather_location_updated'),
      expect.any(Error)
    );

    unsubscribeBoom();
    unsubscribeOk();
    errorSpy.mockRestore();
  });

  it('keeps channels isolated: an emit on one event does not reach other listeners', () => {
    const received: AppEventType[] = [];
    const unsubscribeA = eventBus.subscribe('taxonomy_updated', () => {
      received.push('taxonomy_updated');
    });
    const unsubscribeB = eventBus.subscribe('sources_updated', () => {
      received.push('sources_updated');
    });

    emitTaxonomyUpdated();

    expect(received).toEqual(['taxonomy_updated']);
    unsubscribeA();
    unsubscribeB();
  });

  it('bridges emissions to the window as globalpulse_* Custom Events in the browser', () => {
    const dispatched: Array<{ type: string; detail?: unknown }> = [];
    const originalWindow = (globalThis as Record<string, unknown>).window;

    class FakeCustomEvent {
      constructor(
        public type: string,
        public init?: { detail?: unknown }
      ) {}
    }
    class FakeEvent {
      constructor(public type: string) {}
    }

    (globalThis as Record<string, unknown>).window = {
      dispatchEvent: (event: FakeCustomEvent | FakeEvent) => {
        dispatched.push({
          type: event.type,
          detail: (event as FakeCustomEvent).init?.detail,
        });
      },
    };
    (globalThis as Record<string, unknown>).CustomEvent = FakeCustomEvent;
    (globalThis as Record<string, unknown>).Event = FakeEvent;

    try {
      emitSourcesUpdated();
      eventBus.emit('stories_updated', { version: 3 });

      expect(dispatched).toEqual([
        { type: 'globalpulse_sources_updated', detail: undefined },
        { type: 'globalpulse_stories_updated', detail: { version: 3 } },
      ]);
    } finally {
      delete (globalThis as Record<string, unknown>).CustomEvent;
      delete (globalThis as Record<string, unknown>).Event;
      if (originalWindow === undefined) {
        delete (globalThis as Record<string, unknown>).window;
      } else {
        (globalThis as Record<string, unknown>).window = originalWindow;
      }
    }
  });

  it('exposes convenience emitters for every application event type', () => {
    const events: AppEventType[] = [];
    const subscriptions = (
      ['stories_updated', 'taxonomy_updated', 'bookmarks_updated'] as const
    ).map((event) => eventBus.subscribe(event, () => events.push(event)));

    emitStoriesUpdated();
    emitTaxonomyUpdated();
    emitBookmarksUpdated();

    expect(events).toEqual(['stories_updated', 'taxonomy_updated', 'bookmarks_updated']);
    subscriptions.forEach((unsubscribe) => unsubscribe());
  });

  it('supports empty-payload emissions delivered as undefined', () => {
    const seen: Array<unknown | undefined> = [];
    const unsubscribe = eventBus.subscribe('stories_updated', (payload) => seen.push(payload));

    emitStoriesUpdated();

    expect(seen.length).toBe(1);
    expect(seen[0]).toBeUndefined();
    unsubscribe();
  });
});
