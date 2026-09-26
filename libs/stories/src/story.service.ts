import type {
  Story,
  StoryVersion,
  StoryBlock,
  CreateStoryInput,
  UpdateStoryInput,
  CreateStoryVersionInput,
  ClientType,
  CreatedVia,
} from '@ai-news/schemas';
import {
  CreateStoryInputSchema,
  UpdateStoryInputSchema,
  CreateStoryVersionInputSchema,
} from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { validateBlocks, validateBlock } from '@ai-news/content';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  generateId,
  slugify,
} from '@ai-news/shared';
import { WhatChangedDiffService } from './what-changed.js';

export interface StoryContext {
  organizationId: string;
  authorId: string;
  clientType: ClientType;
  createdVia?: CreatedVia;
  requestId?: string;
}

export class StoryService {
  constructor(private readonly db: DatabaseService) {}

  async createStory(input: CreateStoryInput, ctx: StoryContext): Promise<Story> {
    const validated = CreateStoryInputSchema.parse(input);

    // 1. Idempotency Check
    if (validated.idempotencyKey) {
      const existingRecord = await this.db.idempotency.get(validated.idempotencyKey, ctx.organizationId);
      if (existingRecord) {
        return existingRecord.responseJson as Story;
      }
    }

    // 2. Slug generation & uniqueness
    let baseSlug = slugify(validated.title);
    if (!baseSlug) baseSlug = `story-${Date.now()}`;
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await this.db.stories.findBySlug(uniqueSlug, ctx.organizationId)) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // 3. Process blocks
    const validatedBlocks: StoryBlock[] = validated.blocks
      ? validateBlocks(validated.blocks)
      : [];

    const storyId = generateId('sty');
    const versionId = generateId('ver');
    const now = new Date().toISOString();

    // 4. Create Initial Version (v1)
    const initialVersion: StoryVersion = {
      id: versionId,
      storyId,
      versionNumber: 1,
      title: validated.title,
      summary: validated.summary,
      blocks: validatedBlocks,
      changeSummary: 'Initial story creation',
      clientType: ctx.clientType,
      authorId: ctx.authorId,
      createdAt: now,
    };
    await this.db.stories.createVersion(initialVersion);

    // 5. Create Story entity
    const newStory: Story = {
      id: storyId,
      organizationId: ctx.organizationId,
      slug: uniqueSlug,
      title: validated.title,
      summary: validated.summary,
      status: 'DRAFT',
      articleType: validated.articleType,
      eventId: validated.eventId,
      currentVersionNumber: 1,
      currentVersionId: versionId,
      topicIds: validated.topicIds || [],
      entityIds: validated.entityIds || [],
      sourceIds: validated.sourceIds || [],
      blocks: validatedBlocks,
      heroImageUrl: validated.heroImageUrl,
      createdVia: ctx.createdVia || 'mcp',
      createdByClient: ctx.clientType,
      authorId: ctx.authorId,
      idempotencyKey: validated.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };

    const savedStory = await this.db.stories.create(newStory);

    // 6. Audit Log
    await this.db.audit.log({
      id: generateId('aud'),
      organizationId: ctx.organizationId,
      userId: ctx.authorId,
      clientType: ctx.clientType,
      action: `${ctx.createdVia || 'mcp'}.create_story`,
      resourceType: 'story',
      resourceId: storyId,
      payloadSummary: { title: validated.title, articleType: validated.articleType },
      requestId: ctx.requestId,
      status: 'SUCCESS',
      timestamp: now,
    });

    // 7. Save Idempotency Record
    if (validated.idempotencyKey) {
      await this.db.idempotency.save({
        id: generateId('idemp'),
        organizationId: ctx.organizationId,
        key: validated.idempotencyKey,
        action: 'create_story',
        responseJson: savedStory,
        createdAt: now,
      });
    }

    return savedStory;
  }

  async getStory(id: string, orgId?: string): Promise<Story> {
    const story = await this.db.stories.findById(id, orgId);
    if (!story) {
      throw new NotFoundError('Story', id);
    }
    return story;
  }

  async getStoryBySlug(slug: string, orgId: string): Promise<Story> {
    const story = await this.db.stories.findBySlug(slug, orgId);
    if (!story) {
      throw new NotFoundError('Story with slug', slug);
    }
    return story;
  }

  async updateStory(id: string, input: UpdateStoryInput, ctx: StoryContext): Promise<Story> {
    const validated = UpdateStoryInputSchema.parse(input);
    const existing = await this.getStory(id, ctx.organizationId);

    const updated: Story = {
      ...existing,
      title: validated.title ?? existing.title,
      summary: validated.summary ?? existing.summary,
      articleType: validated.articleType ?? existing.articleType,
      eventId: validated.eventId !== undefined ? validated.eventId : existing.eventId,
      topicIds: validated.topicIds ?? existing.topicIds,
      entityIds: validated.entityIds ?? existing.entityIds,
      heroImageUrl: validated.heroImageUrl !== undefined ? validated.heroImageUrl : existing.heroImageUrl,
      updatedAt: new Date().toISOString(),
    };

    const result = await this.db.stories.update(updated);

    await this.db.audit.log({
      id: generateId('aud'),
      organizationId: ctx.organizationId,
      userId: ctx.authorId,
      clientType: ctx.clientType,
      action: `${ctx.createdVia || 'mcp'}.update_story`,
      resourceType: 'story',
      resourceId: id,
      payloadSummary: validated as Record<string, unknown>,
      requestId: ctx.requestId,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async addBlock(storyId: string, rawBlock: unknown, ctx: StoryContext): Promise<StoryBlock> {
    const story = await this.getStory(storyId, ctx.organizationId);
    const validated = validateBlock(rawBlock);

    const currentBlocks = await this.db.stories.getBlocks(storyId);
    validated.sortOrder = currentBlocks.length;
    currentBlocks.push(validated);

    await this.db.stories.saveBlocks(storyId, currentBlocks);

    await this.db.audit.log({
      id: generateId('aud'),
      organizationId: ctx.organizationId,
      userId: ctx.authorId,
      clientType: ctx.clientType,
      action: `${ctx.createdVia || 'mcp'}.add_story_block`,
      resourceType: 'story_block',
      resourceId: validated.id,
      payloadSummary: { storyId, blockType: validated.blockType },
      requestId: ctx.requestId,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    });

    return validated;
  }

  async updateBlock(storyId: string, blockId: string, rawBlock: unknown, ctx: StoryContext): Promise<StoryBlock> {
    await this.getStory(storyId, ctx.organizationId);
    const validated = validateBlock(rawBlock);

    const currentBlocks = await this.db.stories.getBlocks(storyId);
    const index = currentBlocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      throw new NotFoundError('StoryBlock', blockId);
    }

    validated.sortOrder = currentBlocks[index].sortOrder;
    currentBlocks[index] = validated;

    await this.db.stories.saveBlocks(storyId, currentBlocks);
    return validated;
  }

  async removeBlock(storyId: string, blockId: string, ctx: StoryContext): Promise<boolean> {
    await this.getStory(storyId, ctx.organizationId);
    const currentBlocks = await this.db.stories.getBlocks(storyId);
    const filtered = currentBlocks.filter((b) => b.id !== blockId);
    if (filtered.length === currentBlocks.length) {
      return false;
    }

    // Re-index sort order
    filtered.forEach((b, idx) => {
      b.sortOrder = idx;
    });

    await this.db.stories.saveBlocks(storyId, filtered);
    return true;
  }

  async reorderBlocks(storyId: string, blockIdsInOrder: string[], ctx: StoryContext): Promise<StoryBlock[]> {
    await this.getStory(storyId, ctx.organizationId);
    const currentBlocks = await this.db.stories.getBlocks(storyId);
    const blockMap = new Map(currentBlocks.map((b) => [b.id, b]));

    const reordered: StoryBlock[] = [];
    blockIdsInOrder.forEach((id, idx) => {
      const block = blockMap.get(id);
      if (block) {
        block.sortOrder = idx;
        reordered.push(block);
      }
    });

    await this.db.stories.saveBlocks(storyId, reordered);
    return reordered;
  }

  async createStoryVersion(
    storyId: string,
    input: CreateStoryVersionInput,
    ctx: StoryContext
  ): Promise<StoryVersion> {
    const validated = CreateStoryVersionInputSchema.parse(input);

    // Idempotency check
    if (validated.idempotencyKey) {
      const existing = await this.db.idempotency.get(validated.idempotencyKey, ctx.organizationId);
      if (existing) {
        return existing.responseJson as StoryVersion;
      }
    }

    const story = await this.getStory(storyId, ctx.organizationId);
    const nextVersionNumber = story.currentVersionNumber + 1;
    const versionId = generateId('ver');
    const now = new Date().toISOString();

    const previousBlocks = await this.db.stories.getBlocks(storyId);
    let newBlocks: StoryBlock[] = previousBlocks;
    if (validated.blocks) {
      newBlocks = validateBlocks(validated.blocks);
      await this.db.stories.saveBlocks(storyId, newBlocks);
    }

    // Check if newBlocks has a WhatChangedBlock, if not, automatically prepend one!
    const hasWhatChanged = newBlocks.some((b) => b.blockType === 'what_changed');
    if (!hasWhatChanged) {
      const diffBlock = WhatChangedDiffService.computeDiff(
        story.currentVersionNumber,
        previousBlocks,
        newBlocks
      );
      // Prepend what_changed block
      newBlocks = [diffBlock, ...newBlocks];
      newBlocks.forEach((b, idx) => {
        b.sortOrder = idx;
      });
      await this.db.stories.saveBlocks(storyId, newBlocks);
    }

    const versionRecord: StoryVersion = {
      id: versionId,
      storyId,
      versionNumber: nextVersionNumber,
      title: validated.title || story.title,
      summary: validated.summary || story.summary,
      blocks: newBlocks,
      changeSummary: validated.changeSummary,
      clientType: ctx.clientType,
      authorId: ctx.authorId,
      createdAt: now,
    };

    await this.db.stories.createVersion(versionRecord);

    // Update story pointers
    story.currentVersionNumber = nextVersionNumber;
    story.currentVersionId = versionId;
    if (validated.title) story.title = validated.title;
    if (validated.summary) story.summary = validated.summary;
    story.blocks = newBlocks;
    story.updatedAt = now;
    await this.db.stories.update(story);

    await this.db.audit.log({
      id: generateId('aud'),
      organizationId: ctx.organizationId,
      userId: ctx.authorId,
      clientType: ctx.clientType,
      action: `${ctx.createdVia || 'mcp'}.create_story_version`,
      resourceType: 'story_version',
      resourceId: versionId,
      payloadSummary: { storyId, versionNumber: nextVersionNumber, changeSummary: validated.changeSummary },
      requestId: ctx.requestId,
      status: 'SUCCESS',
      timestamp: now,
    });

    if (validated.idempotencyKey) {
      await this.db.idempotency.save({
        id: generateId('idemp'),
        organizationId: ctx.organizationId,
        key: validated.idempotencyKey,
        action: 'create_story_version',
        responseJson: versionRecord,
        createdAt: now,
      });
    }

    return versionRecord;
  }

  async getStoryVersions(storyId: string, orgId?: string): Promise<StoryVersion[]> {
    await this.getStory(storyId, orgId);
    return this.db.stories.getVersions(storyId);
  }

  async getStoryVersion(storyId: string, versionNumber: number, orgId?: string): Promise<StoryVersion> {
    await this.getStory(storyId, orgId);
    const version = await this.db.stories.getVersion(storyId, versionNumber);
    if (!version) {
      throw new NotFoundError(`Story version ${versionNumber} for story`, storyId);
    }
    return version;
  }

  async publishStory(
    storyId: string,
    ctx: StoryContext,
    idempotencyKey?: string
  ): Promise<Story> {
    if (idempotencyKey) {
      const existing = await this.db.idempotency.get(idempotencyKey, ctx.organizationId);
      if (existing) {
        return existing.responseJson as Story;
      }
    }

    const story = await this.getStory(storyId, ctx.organizationId);
    const blocks = await this.db.stories.getBlocks(storyId);
    if (blocks.length === 0) {
      throw new ValidationError('Cannot publish a story with 0 content blocks.');
    }

    const now = new Date().toISOString();
    story.status = 'PUBLISHED';
    story.publishedAt = now;
    story.updatedAt = now;

    const saved = await this.db.stories.update(story);

    await this.db.audit.log({
      id: generateId('aud'),
      organizationId: ctx.organizationId,
      userId: ctx.authorId,
      clientType: ctx.clientType,
      action: `${ctx.createdVia || 'mcp'}.publish_story`,
      resourceType: 'story',
      resourceId: storyId,
      payloadSummary: { title: story.title, version: story.currentVersionNumber },
      requestId: ctx.requestId,
      status: 'SUCCESS',
      timestamp: now,
    });

    if (idempotencyKey) {
      await this.db.idempotency.save({
        id: generateId('idemp'),
        organizationId: ctx.organizationId,
        key: idempotencyKey,
        action: 'publish_story',
        responseJson: saved,
        createdAt: now,
      });
    }

    return saved;
  }

  async unpublishStory(storyId: string, ctx: StoryContext): Promise<Story> {
    const story = await this.getStory(storyId, ctx.organizationId);
    story.status = 'DRAFT';
    story.updatedAt = new Date().toISOString();
    return this.db.stories.update(story);
  }

  async archiveStory(storyId: string, ctx: StoryContext): Promise<Story> {
    const story = await this.getStory(storyId, ctx.organizationId);
    story.status = 'ARCHIVED';
    story.updatedAt = new Date().toISOString();
    return this.db.stories.update(story);
  }
}
