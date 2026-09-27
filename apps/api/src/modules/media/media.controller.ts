import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { QueueManager } from '@ai-news/jobs';
import { s3Storage } from '@ai-news/media';
import { generateId } from '@ai-news/shared';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

export interface RegisterMediaBody {
  url: string;
  mediaType: string;
  altText?: string;
  caption?: string;
  formats?: string[];
}

export interface MediaAsset {
  id: string;
  organizationId: string;
  url: string;
  mediaType: string;
  altText?: string;
  caption?: string;
  createdAt: string;
  s3Bucket: string;
  variants: Array<{ suffix: string; width: number; height: number; url: string }>;
}

const queue = new QueueManager(true);
const mediaRegistry = new Map<string, MediaAsset>();

@Controller('api/media')
@UseGuards(NestAuthGuard)
export class MediaController {
  @Post(['', 'assets'])
  @RequireScope('news:media')
  async registerMedia(
    @Body() body: RegisterMediaBody,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const orgId = principal.organizationId;
    const mediaId = generateId('med');
    const asset: MediaAsset = {
      id: mediaId,
      organizationId: orgId,
      url: body.url,
      mediaType: body.mediaType,
      altText: body.altText,
      caption: body.caption,
      createdAt: new Date().toISOString(),
      s3Bucket: s3Storage.getBucket(),
      variants: [
        { suffix: 'thumb', width: 320, height: 180, url: `${body.url}?w=320` },
        { suffix: 'card', width: 720, height: 405, url: `${body.url}?w=720` },
        { suffix: 'hero', width: 1920, height: 1080, url: `${body.url}?w=1920` },
      ],
    };

    mediaRegistry.set(mediaId, asset);

    // Queue background variant processing job (processed by worker into MinIO S3)
    await queue.enqueue('media.process_variant', {
      mediaId,
      sourceUrl: body.url,
      formats: body.formats || ['webp', 'jpeg'],
      dimensions: [
        { width: 320, height: 180, suffix: 'thumb' },
        { width: 720, height: 405, suffix: 'card' },
        { width: 1920, height: 1080, suffix: 'hero' },
      ],
      orgId,
    });

    reply.status(HttpStatus.CREATED);
    return ApiResponse.success(asset);
  }

  @Get([':id', 'assets/:id'])
  @RequireScope('news:read')
  async getMedia(@Param('id') id: string) {
    const asset = mediaRegistry.get(id);
    if (!asset) {
      throw new NotFoundException(`Media asset [${id}] not found`);
    }
    return ApiResponse.success(asset);
  }
}
