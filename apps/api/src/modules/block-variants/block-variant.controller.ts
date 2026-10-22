import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import { BlockVariantService } from '@ai-news/stories';
import {
  BlockVariantInputSchema,
  BlockVariantUpdateSchema,
  type BlockVariant,
  type BlockVariantInput,
  type BlockVariantUpdate,
} from '@ai-news/schemas';
import { ValidationError } from '@ai-news/shared';
import { db } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

/**
 * The variants a newsroom keeps.
 *
 * A variant is a named, ready-made payload for a block type. The studio
 * ships a set of them, but a newsroom that agrees on how its charts read
 * keeps that agreement here, and everybody editing a story sees the same
 * list.
 */
@Controller('api/block-variants')
@UseGuards(NestAuthGuard)
export class BlockVariantController {
  private readonly variants: BlockVariantService;

  constructor() {
    this.variants = new BlockVariantService(db);
  }

  @Get()
  @RequireScope('news:read')
  async list(
    @Query('blockType') blockType: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<BlockVariant[]> {
    return this.variants.list(blockType, { organizationId: principal.organizationId });
  }

  @Get(':id')
  @RequireScope('news:read')
  async get(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<BlockVariant> {
    const variant = await this.variants.get(id, { organizationId: principal.organizationId });
    if (!variant) {
      throw new ValidationError(`No block variant registered for id "${id}"`);
    }
    return variant;
  }

  /**
   * Save a variant.
   *
   * The payload is checked against the block type's own schema, so a
   * variant can never preview a block the platform would refuse.
   */
  @Post()
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async create(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<BlockVariant> {
    const parsed = BlockVariantInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        `Invalid block variant: ${parsed.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    return this.variants.create(parsed.data as BlockVariantInput, {
      organizationId: principal.organizationId,
      authorId: principal.id,
    });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<BlockVariant> {
    const parsed = BlockVariantUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        `Invalid block variant: ${parsed.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }

    const variant = await this.variants.update(id, parsed.data as BlockVariantUpdate, {
      organizationId: principal.organizationId,
    });
    if (!variant) {
      throw new ValidationError(`No block variant registered for id "${id}"`);
    }
    return variant;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async remove(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<void> {
    await this.variants.delete(id, { organizationId: principal.organizationId });
  }
}
