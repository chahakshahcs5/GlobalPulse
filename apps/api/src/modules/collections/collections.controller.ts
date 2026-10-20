import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CollectionService, isCollectionCurator } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { CreateCollectionInputSchema, AddStoryToCollectionInputSchema } from '@ai-news/schemas';
import type { StoryCollection, StoryCollectionWithStories } from '@ai-news/schemas';

@Controller('api/collections')
export class CollectionsController {
  private collectionService: CollectionService;

  constructor() {
    this.collectionService = new CollectionService(db);
  }

  @Post()
  @UseGuards(NestAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCollection(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryCollection> {
    const input = CreateCollectionInputSchema.parse(body);
    return await this.collectionService.createCollection(principal.id, input, principal.id);
  }

  @Get()
  async listPublicCollections(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<StoryCollection[]> {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return await this.collectionService.listPublicCollections(parsedLimit, parsedOffset);
  }

  @Get('user/me')
  @UseGuards(NestAuthGuard)
  async listMyCollections(
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryCollection[]> {
    return await this.collectionService.listUserCollections(principal.id);
  }

  @Get(':id')
  async getCollection(@Param('id') id: string): Promise<StoryCollectionWithStories> {
    const collection = await this.collectionService.getCollectionWithStories(id);
    if (!collection) {
      throw new NotFoundException(`Collection with id "${id}" was not found.`);
    }
    return collection;
  }

  private async assertCurator(
    collectionId: string,
    principal: AuthenticatedPrincipal
  ): Promise<void> {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) {
      throw new NotFoundException(`Collection with id "${collectionId}" was not found.`);
    }
    if (!isCollectionCurator(collection, principal)) {
      throw new ForbiddenException(
        'Only the collection curator (or an admin/editor) can modify a collection.'
      );
    }
  }

  @Post(':id/stories')
  @UseGuards(NestAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addStory(
    @Param('id') collectionId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryCollection> {
    const input = AddStoryToCollectionInputSchema.parse(body);
    await this.assertCurator(collectionId, principal);
    return await this.collectionService.addStory(collectionId, input.storyId);
  }

  @Delete(':id/stories/:storyId')
  @UseGuards(NestAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeStory(
    @Param('id') collectionId: string,
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryCollection> {
    await this.assertCurator(collectionId, principal);
    return await this.collectionService.removeStory(collectionId, storyId);
  }

  @Delete(':id')
  @UseGuards(NestAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteCollection(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<{ success: boolean }> {
    await this.assertCurator(id, principal);
    const success = await this.collectionService.deleteCollection(id);
    return { success };
  }
}
