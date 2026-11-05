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
  BadRequestException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { defaultQueue } from '@ai-news/jobs';
import { s3Storage, sharedMediaRegistry, validateMediaUpload } from '@ai-news/media';
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
  /** Optional inline upload. The signature must match `mediaType`. */
  dataBase64?: string;
  filename?: string;
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

// Share the process-wide queue so registered worker handlers (or, in Redis
// mode, the worker service) can consume media jobs. A detached QueueManager
// instance would enqueue jobs that nothing ever processes.
const queue = defaultQueue;

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

    let sourceUrl = body.url;
    let mediaType = body.mediaType;

    if (body.dataBase64) {
      let buffer: Buffer;
      try {
        buffer = Buffer.from(body.dataBase64, 'base64');
      } catch {
        throw new BadRequestException('dataBase64 is not valid base64.');
      }
      const validation = validateMediaUpload(buffer, body.mediaType);
      if (!validation.valid || !validation.detected) {
        throw new BadRequestException(
          validation.reason || 'The uploaded file signature is not allowed.'
        );
      }
      mediaType = validation.detected.mimeType;
      const key = `uploads/${orgId}/${mediaId}.${validation.detected.extension}`;
      const stored = await s3Storage.upload(key, buffer, validation.detected.mimeType);
      sourceUrl = stored.url;
    }

    if (!sourceUrl) {
      throw new BadRequestException('Either url or dataBase64 is required.');
    }

    const asset: MediaAsset = {
      id: mediaId,
      organizationId: orgId,
      url: sourceUrl,
      mediaType,
      altText: body.altText,
      caption: body.caption,
      createdAt: new Date().toISOString(),
      s3Bucket: s3Storage.getBucket(),
      variants: [
        { suffix: 'thumb', width: 320, height: 180, url: `${sourceUrl}?w=320` },
        { suffix: 'card', width: 720, height: 405, url: `${sourceUrl}?w=720` },
        { suffix: 'hero', width: 1920, height: 1080, url: `${sourceUrl}?w=1920` },
      ],
    };

    sharedMediaRegistry.set(mediaId, asset);

    // Queue background variant processing job (processed by worker into MinIO S3)
    await queue.enqueue('media.process_variant', {
      mediaId,
      sourceUrl,
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
  async getMedia(@Param('id') id: string, @Principal() principal: AuthenticatedPrincipal) {
    const asset = sharedMediaRegistry.get(id);
    if (!asset || asset.organizationId !== principal.organizationId) {
      throw new NotFoundException(`Media asset [${id}] not found`);
    }
    return ApiResponse.success(asset);
  }
}
