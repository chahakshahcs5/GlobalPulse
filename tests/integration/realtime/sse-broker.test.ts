import { describe, it, expect, vi } from 'vitest';
import { RealtimeSseService } from '../../../apps/api/src/realtime/sse.service';
import { EventEmitter } from 'events';

describe('Realtime SSE Broker Integration Tests', () => {
  function createMockReply() {
    const rawEmitter = new EventEmitter();
    const headers: Record<string, string> = {};
    const writtenChunks: string[] = [];

    const mockRaw: any = {
      setHeader: vi.fn((key: string, value: string) => {
        headers[key] = value;
      }),
      flushHeaders: vi.fn(),
      write: vi.fn((chunk: string) => {
        writtenChunks.push(chunk);
        return true;
      }),
      on: vi.fn((event: string, listener: (...args: any[]) => void) => {
        rawEmitter.on(event, listener);
        return mockRaw;
      }),
      emitClose: () => {
        rawEmitter.emit('close');
      },
    };

    const mockReply: any = {
      raw: mockRaw,
      headers,
      writtenChunks,
    };

    return mockReply;
  }

  it('registers client, sets SSE headers, and sends initial connected event', () => {
    const sse = RealtimeSseService.getInstance();
    const reply = createMockReply();

    sse.registerClient('client_test_1', ['stories:published'], reply);

    expect(reply.headers['Content-Type']).toBe('text/event-stream');
    expect(reply.headers['Cache-Control']).toBe('no-cache, no-transform');
    expect(reply.headers['Connection']).toBe('keep-alive');

    // Initial connected event should be written
    expect(reply.writtenChunks.length).toBeGreaterThanOrEqual(1);
    expect(reply.writtenChunks[0]).toContain('event: connected');
    expect(reply.writtenChunks[0]).toContain('stories:published');

    // Cleanup client
    reply.raw.emitClose();
  });

  it('broadcasts messages to matching channel subscribers and isolates non-subscribers', () => {
    const sse = RealtimeSseService.getInstance();
    const replyTrade = createMockReply();
    const replySports = createMockReply();
    const replyAll = createMockReply();

    sse.registerClient('client_trade', ['channel:trade'], replyTrade);
    sse.registerClient('client_sports', ['channel:sports'], replySports);
    sse.registerClient('client_all', ['all'], replyAll);

    // Clear initial handshake chunks
    replyTrade.writtenChunks.length = 0;
    replySports.writtenChunks.length = 0;
    replyAll.writtenChunks.length = 0;

    // Broadcast on channel:trade
    sse.broadcast('channel:trade', 'story:published', {
      slug: 'brics-expansion-2026',
      headline: 'BRICS Finalizes Accord',
    });

    // Trade client receives event
    expect(replyTrade.writtenChunks.length).toBe(1);
    expect(replyTrade.writtenChunks[0]).toContain('event: story:published');
    expect(replyTrade.writtenChunks[0]).toContain('brics-expansion-2026');

    // All client receives event
    expect(replyAll.writtenChunks.length).toBe(1);
    expect(replyAll.writtenChunks[0]).toContain('brics-expansion-2026');

    // Sports client receives NOTHING
    expect(replySports.writtenChunks.length).toBe(0);

    // Cleanup
    replyTrade.raw.emitClose();
    replySports.raw.emitClose();
    replyAll.raw.emitClose();
  });

  it('cleans up client registration on socket close to prevent memory leaks', () => {
    const sse = RealtimeSseService.getInstance();
    const countBefore = sse.getConnectedClientsCount();

    const reply = createMockReply();
    sse.registerClient('client_disconnect_test', ['stories'], reply);
    expect(sse.getConnectedClientsCount()).toBe(countBefore + 1);

    // Simulate client closing the connection
    reply.raw.emitClose();
    expect(sse.getConnectedClientsCount()).toBe(countBefore);
  });
});
