import { FastifyRequest, FastifyReply } from 'fastify';
import { QueueManager } from '@ai-news/jobs';
import { generateId } from '@ai-news/shared';
import { ApiResponse } from '../../common/response/api-response';

const queue = new QueueManager(true);

export interface RegisterMediaInput {
  url: string;
  mediaType: 'image' | 'video' | 'audio';
  altText?: string;
  caption?: string;
  formats?: ('webp' | 'avif' | 'jpeg')[];
}

const mediaRegistry = new Map<string, any>();

export class MediaController {
  static async registerMedia(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const body = request.body as RegisterMediaInput;

    const mediaId = generateId('med');
    const asset = {
      id: mediaId,
      organizationId: orgId,
      url: body.url,
      mediaType: body.mediaType,
      altText: body.altText,
      caption: body.caption,
      createdAt: new Date().toISOString(),
      variants: [
        { suffix: 'thumb', width: 320, height: 180, url: `${body.url}?w=320` },
        { suffix: 'card', width: 720, height: 405, url: `${body.url}?w=720` },
        { suffix: 'hero', width: 1920, height: 1080, url: `${body.url}?w=1920` },
      ],
    };

    mediaRegistry.set(mediaId, asset);

    // Queue background variant processing job
    await queue.enqueue('media.process_variant', {
      mediaId,
      sourceUrl: body.url,
      formats: body.formats || ['webp', 'jpeg'],
      dimensions: [
        { width: 320, height: 180, suffix: 'thumb' },
        { width: 720, height: 405, suffix: 'card' },
        { width: 1920, height: 1080, suffix: 'hero' },
      ],
    });

    return reply.status(201).send(ApiResponse.success(asset));
  }

  static async getMedia(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const asset = mediaRegistry.get(id);
    if (!asset) {
      return reply.status(404).send({ error: 'MediaNotFound', message: `Media asset ${id} not found` });
    }
    return reply.send(asset);
  }
}
