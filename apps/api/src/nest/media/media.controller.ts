import { Controller, Post, Get, Param, Body, UseGuards, HttpStatus, Res, NotFoundException } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { QueueManager } from '@ai-news/jobs';
import { generateId } from '@ai-news/shared';
import { NestAuthGuard, RequireScope, Principal } from '../common/auth.guard';

const queue = new QueueManager(true);
const mediaRegistry = new Map<string, any>();

@Controller('api/media')
@UseGuards(NestAuthGuard)
export class MediaController {
  @Post('assets')
  @RequireScope('news:media')
  async registerMedia(
    @Body() body: any,
    @Principal() principal: any,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const orgId = principal.organizationId;
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

    await queue.enqueue('media.process_variant', {
      mediaId,
      sourceUrl: body.url,
      formats: body.formats || ['webp', 'jpeg'],
      orgId,
    });

    reply.status(HttpStatus.CREATED);
    return asset;
  }

  @Get('assets/:id')
  @RequireScope('news:read')
  async getMedia(@Param('id') id: string) {
    const asset = mediaRegistry.get(id);
    if (!asset) {
      throw new NotFoundException(`Media asset [${id}] not found`);
    }
    return asset;
  }
}
