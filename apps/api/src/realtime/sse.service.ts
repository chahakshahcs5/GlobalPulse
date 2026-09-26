import { FastifyReply, FastifyRequest } from 'fastify';
import { EventEmitter } from 'events';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('sse-service');

export interface SseClient {
  id: string;
  channels: Set<string>;
  reply: FastifyReply;
  connectedAt: Date;
}

export class RealtimeSseService {
  private static instance: RealtimeSseService;
  private clients: Map<string, SseClient> = new Map();
  private bus: EventEmitter = new EventEmitter();

  private constructor() {
    this.bus.setMaxListeners(100);
    // Periodic heartbeat to prevent proxy timeout
    setInterval(() => {
      this.broadcastRaw(': ping\n\n');
    }, 15000);
  }

  public static getInstance(): RealtimeSseService {
    if (!RealtimeSseService.instance) {
      RealtimeSseService.instance = new RealtimeSseService();
    }
    return RealtimeSseService.instance;
  }

  public registerClient(id: string, channels: string[], reply: FastifyReply): void {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.flushHeaders?.();

    const client: SseClient = {
      id,
      channels: new Set(channels.length > 0 ? channels : ['all']),
      reply,
      connectedAt: new Date(),
    };

    this.clients.set(id, client);
    logger.info(`SSE client [${id}] connected to channels: [${Array.from(client.channels).join(', ')}]`);

    // Send connection established event
    this.sendToClient(client, 'connected', { clientId: id, channels: Array.from(client.channels) });

    reply.raw.on('close', () => {
      this.clients.delete(id);
      logger.info(`SSE client [${id}] disconnected`);
    });
  }

  public broadcast(channel: string, eventName: string, data: any): void {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    let delivered = 0;

    for (const client of this.clients.values()) {
      if (client.channels.has(channel) || client.channels.has('all')) {
        client.reply.raw.write(payload);
        delivered++;
      }
    }

    logger.debug(`Broadcast event [${eventName}] on channel [${channel}] to ${delivered} clients`);
  }

  private sendToClient(client: SseClient, eventName: string, data: any): void {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    client.reply.raw.write(payload);
  }

  private broadcastRaw(rawText: string): void {
    for (const client of this.clients.values()) {
      try {
        client.reply.raw.write(rawText);
      } catch {
        // Ignored, client will be cleaned up on close
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const realtime = RealtimeSseService.getInstance();
