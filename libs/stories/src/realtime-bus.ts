/**
 * Shared realtime broadcaster.
 *
 * The API server injects the SSE broker here so any service can publish to a
 * channel (`all`, `org_*`, `newsroom`, or a reader's personal `user_*`
 * channel) without importing the API layer.
 */
export type RealtimeBroadcaster = (channel: string, eventName: string, data: unknown) => void;

let _broadcaster: RealtimeBroadcaster | null = null;

export function setRealtimeBroadcaster(fn: RealtimeBroadcaster | null): void {
  _broadcaster = fn;
}

/**
 * Publishes an event to a channel. Returns false when no broadcaster is
 * configured or the publish failed — delivery never throws.
 */
export function broadcastRealtime(channel: string, eventName: string, data: unknown): boolean {
  if (!_broadcaster) return false;
  try {
    _broadcaster(channel, eventName, data);
    return true;
  } catch {
    return false;
  }
}
