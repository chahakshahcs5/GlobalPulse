/**
 * Safe, typed application event bus for GlobalPulse.
 * Replaces ad-hoc, untyped window.dispatchEvent calls with an SSR-safe,
 * memory-backed pub/sub mechanism with automatic listener cleanup.
 */

export type AppEventType =
  | 'stories_updated'
  | 'taxonomy_updated'
  | 'bookmarks_updated'
  | 'sources_updated'
  | 'weather_location_updated';

type EventCallback<T = unknown> = (payload?: T) => void;

class AppEventBus {
  private listeners: Map<AppEventType, Set<EventCallback<unknown>>> = new Map();

  /**
   * Subscribe to an application event.
   * Returns an unsubscribe cleanup function.
   */
  subscribe<T = unknown>(event: AppEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    const cb = callback as EventCallback<unknown>;
    set.add(cb);

    return () => {
      set.delete(cb);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Emit an event to all registered in-memory listeners and bridge to window/DOM for backwards compatibility.
   */
  emit<T = unknown>(event: AppEventType, payload?: T): void {
    // 1. Notify typed memory listeners
    const set = this.listeners.get(event);
    if (set) {
      // Copy set to avoid mutations during iteration
      Array.from(set).forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in event bus listener for ${event}:`, err);
        }
      });
    }

    // 2. Backward compatibility: bridge to window if in browser environment
    if (typeof window !== 'undefined') {
      try {
        const domEventName = `globalpulse_${event}`;
        const customEvent =
          payload !== undefined
            ? new CustomEvent(domEventName, { detail: payload })
            : new Event(domEventName);
        window.dispatchEvent(customEvent);
      } catch {
        // Silently tolerate if DOM dispatch fails
      }
    }
  }
}

export const eventBus = new AppEventBus();

// Convenience action emitters
export const emitStoriesUpdated = () => eventBus.emit('stories_updated');
export const emitTaxonomyUpdated = () => eventBus.emit('taxonomy_updated');
export const emitBookmarksUpdated = () => eventBus.emit('bookmarks_updated');
export const emitSourcesUpdated = () => eventBus.emit('sources_updated');
export const emitWeatherLocationUpdated = (key: string) =>
  eventBus.emit('weather_location_updated', key);
