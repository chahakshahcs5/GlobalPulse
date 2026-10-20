import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, filter, map, finalize } from 'rxjs';
import Redis from 'ioredis';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('realtime-service');

export interface RealtimeMessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

export interface BroadcastPayload {
  channel: string;
  eventName: string;
  data: unknown;
  timestamp: string;
}

@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private static instance: RealtimeService;
  private messageSubject: Subject<BroadcastPayload> = new Subject<BroadcastPayload>();
  private redisPub: Redis | null = null;
  private redisSub: Redis | null = null;
  private activeSubscriptionsCount = 0;
  /**
   * Payloads broadcast locally over this process's Subject, waiting for the
   * Redis echo they also trigger. When the echo arrives we must NOT re-feed
   * the Subject, otherwise every connected SSE client receives the event
   * twice in Redis mode.
   */
  private pendingLocalBroadcasts = new Map<string, number>();

  constructor() {
    RealtimeService.instance = this;
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && process.env.NODE_ENV !== 'test') {
      try {
        const redisOptions = {
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        };
        this.redisPub = new Redis(redisUrl, redisOptions);
        this.redisSub = new Redis(redisUrl, redisOptions);

        this.redisPub.on('error', (err) => {
          logger.debug(`Redis SSE Pub error: ${err.message}`);
        });
        this.redisSub.on('error', (err) => {
          logger.debug(`Redis SSE Sub error: ${err.message}`);
        });

        Promise.all([this.redisPub.connect(), this.redisSub.connect()])
          .then(() => {
            const maskedUrl = redisUrl.replace(/:[^:@]*@/, ':****@');
            logger.info(`Connected to Redis Pub/Sub for distributed SSE at [${maskedUrl}]`);
            this.redisSub?.psubscribe('globalpulse:sse:*', (err) => {
              if (err) logger.debug(`Redis psubscribe error: ${err.message}`);
            });
            this.redisSub?.on('pmessage', (_pattern, channel, message) => {
              try {
                const parsedChannel = channel.replace('globalpulse:sse:', '');
                const { eventName, data, timestamp } = JSON.parse(message);
                const payload: BroadcastPayload = {
                  channel: parsedChannel,
                  eventName,
                  data,
                  timestamp: timestamp || new Date().toISOString(),
                };
                // Skip the echo of a broadcast we already delivered locally.
                const echoKey = RealtimeService.buildEchoKey(payload);
                if (echoKey && this.pendingLocalBroadcasts.has(echoKey)) {
                  this.pendingLocalBroadcasts.delete(echoKey);
                  return;
                }
                this.messageSubject.next(payload);
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                logger.debug(`Failed to parse distributed SSE message: ${msg}`);
              }
            });
          })
          .catch((err: Error) => {
            logger.info(
              `Redis SSE connection deferred (${err.message}). Operating in standalone local mode.`
            );
            this.teardownFailedRedisClients();
          });
      } catch {
        this.teardownFailedRedisClients();
      }
    }
  }

  private static buildEchoKey(payload: BroadcastPayload): string | undefined {
    try {
      return JSON.stringify(payload);
    } catch {
      return undefined;
    }
  }

  /** Close any half-open Redis sockets before dropping the references. */
  private teardownFailedRedisClients(): void {
    for (const client of [this.redisPub, this.redisSub]) {
      if (client) {
        try {
          void client.quit();
        } catch {
          // Socket may already be broken; ignore.
        }
        client.disconnect();
      }
    }
    this.redisPub = null;
    this.redisSub = null;
    this.pendingLocalBroadcasts.clear();
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public getEventStream(channels: string[]): Observable<RealtimeMessageEvent> {
    const channelSet = new Set(channels.length > 0 ? channels : ['all']);
    this.activeSubscriptionsCount++;

    return this.messageSubject.asObservable().pipe(
      filter(
        (msg) => channelSet.has(msg.channel) || channelSet.has('all') || msg.channel === 'all'
      ),
      map((msg) => ({
        type: msg.eventName,
        data: msg.data as object,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      })),
      finalize(() => {
        this.decrementSubscriberCount();
      })
    );
  }

  public broadcast(channel: string, eventName: string, data: unknown): void {
    const payload: BroadcastPayload = {
      channel,
      eventName,
      data,
      timestamp: new Date().toISOString(),
    };

    this.messageSubject.next(payload);

    if (this.redisPub && this.redisPub.status === 'ready') {
      const echoKey = RealtimeService.buildEchoKey(payload);
      if (echoKey) {
        this.prunePendingBroadcasts();
        // Keep only a small window; each entry lives until its echo arrives
        // (or a few seconds, whichever is shorter).
        this.pendingLocalBroadcasts.set(echoKey, Date.now());
      }
      try {
        this.redisPub.publish(`globalpulse:sse:${channel}`, JSON.stringify(payload));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown publish error';
        if (echoKey) this.pendingLocalBroadcasts.delete(echoKey);
        logger.debug(`Redis publish error: ${msg}`);
      }
    }
  }

  /** Drop stale pending-echo markers so the map cannot grow unbounded. */
  private prunePendingBroadcasts(): void {
    const now = Date.now();
    for (const [key, ts] of this.pendingLocalBroadcasts) {
      if (now - ts > 10_000) {
        this.pendingLocalBroadcasts.delete(key);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.activeSubscriptionsCount;
  }

  public decrementSubscriberCount(): void {
    if (this.activeSubscriptionsCount > 0) {
      this.activeSubscriptionsCount--;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.messageSubject.complete();
    if (this.redisSub) {
      await this.redisSub.quit();
    }
    if (this.redisPub) {
      await this.redisPub.quit();
    }
  }
}

export const realtime = RealtimeService.getInstance();
