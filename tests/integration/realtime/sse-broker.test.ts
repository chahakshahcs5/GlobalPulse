import { describe, it, expect } from 'vitest';
import {
  RealtimeService,
  RealtimeMessageEvent,
} from '../../../apps/api/src/modules/realtime/realtime.service';
import { firstValueFrom } from 'rxjs';

describe('Realtime SSE Broker Integration Tests', () => {
  it('streams events to matching channel subscribers via RxJS Observables', async () => {
    const sse = RealtimeService.getInstance();
    const tradeStream$ = sse.getEventStream(['channel:trade']);

    const eventPromise = firstValueFrom(tradeStream$);

    sse.broadcast('channel:trade', 'story:published', {
      slug: 'brics-expansion-2026',
      headline: 'BRICS Finalizes Accord',
    });

    const received = await eventPromise;
    expect(received.type).toBe('story:published');
    const data = received.data as { slug?: string; headline?: string };
    expect(data.slug).toBe('brics-expansion-2026');
    sse.decrementSubscriberCount();
  });

  it('broadcasts messages to matching channel subscribers and isolates non-subscribers', async () => {
    const sse = RealtimeService.getInstance();

    const tradeEvents: RealtimeMessageEvent[] = [];
    const sportsEvents: RealtimeMessageEvent[] = [];
    const allEvents: RealtimeMessageEvent[] = [];

    const subTrade = sse.getEventStream(['channel:trade']).subscribe((e) => tradeEvents.push(e));
    const subSports = sse.getEventStream(['channel:sports']).subscribe((e) => sportsEvents.push(e));
    const subAll = sse.getEventStream(['all']).subscribe((e) => allEvents.push(e));

    // Broadcast on channel:trade
    sse.broadcast('channel:trade', 'story:breaking', {
      title: 'Quantum Advantage Milestone',
    });

    // Allow event loop cycle for RxJS Subject
    await new Promise((r) => setTimeout(r, 20));

    expect(tradeEvents.length).toBe(1);
    expect(tradeEvents[0].type).toBe('story:breaking');
    expect((tradeEvents[0].data as { title: string }).title).toBe('Quantum Advantage Milestone');

    expect(allEvents.length).toBe(1);
    expect((allEvents[0].data as { title: string }).title).toBe('Quantum Advantage Milestone');

    // Sports subscriber receives NOTHING
    expect(sportsEvents.length).toBe(0);

    subTrade.unsubscribe();
    subSports.unsubscribe();
    subAll.unsubscribe();
    sse.decrementSubscriberCount();
    sse.decrementSubscriberCount();
    sse.decrementSubscriberCount();
  });

  it('tracks subscriber counts accurately', () => {
    const sse = RealtimeService.getInstance();
    const before = sse.getConnectedClientsCount();

    const sub = sse.getEventStream(['stories']).subscribe();
    expect(sse.getConnectedClientsCount()).toBe(before + 1);

    sub.unsubscribe();
    sse.decrementSubscriberCount();
    expect(sse.getConnectedClientsCount()).toBe(before);
  });
});
