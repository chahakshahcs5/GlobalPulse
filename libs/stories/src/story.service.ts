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
import type { DatabaseService, StoryFilter, PaginatedStories } from '@ai-news/database';
import { validateBlocks, validateBlock, sanitizeBlock } from '@ai-news/content';
import {
  NotFoundError,
  ValidationError,
  generateId,
  slugify,
  computeStoryReadingMetrics,
} from '@ai-news/shared';
import { WhatChangedDiffService } from './what-changed';

/**
 * Optional SSE broadcaster — injected when running with the API server.
 * When null (e.g. in tests or MCP-only mode), events are silently skipped.
 */
export type BroadcastFn = (channel: string, eventName: string, data: unknown) => void;
let _broadcast: BroadcastFn | null = null;

export function setStoryBroadcaster(fn: BroadcastFn): void {
  _broadcast = fn;
}

function broadcast(eventName: string, data: unknown): void {
  if (_broadcast) {
    try {
      _broadcast('all', eventName, data);
    } catch {
      // SSE broadcast failure should never break story operations
    }
  }
}

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

    // 3. Process and sanitize blocks (XSS protection)
    const validatedBlocks: StoryBlock[] = validated.blocks
      ? validateBlocks(validated.blocks).map(sanitizeBlock)
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

    const metrics = computeStoryReadingMetrics({
      title: validated.title,
      summary: validated.summary,
      blocks: validatedBlocks,
    });

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
      wordCount: metrics.wordCount,
      readingTimeMinutes: metrics.readingTimeMinutes,
      createdVia: ctx.createdVia || 'mcp',
      createdByClient: ctx.clientType,
      authorId: ctx.authorId,
      idempotencyKey: validated.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };

    const savedStory = await this.db.runInTransaction(async () => {
      await this.db.stories.createVersion(initialVersion);
      const created = await this.db.stories.create(newStory);

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
          responseJson: created,
          createdAt: now,
        });
      }

      return created;
    });

    broadcast('story.created', { storyId: savedStory.id, title: savedStory.title, slug: savedStory.slug });

    return savedStory;
  }

  async listStories(filter?: StoryFilter, orgId: string = 'org_default'): Promise<Story[]> {
    return this.db.stories.list(filter, orgId);
  }

  async listStoriesPaginated(filter?: StoryFilter, orgId: string = 'org_default'): Promise<PaginatedStories> {
    return this.db.stories.listPaginated(filter, orgId);
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

    const metrics = computeStoryReadingMetrics({
      title: updated.title,
      summary: updated.summary,
      blocks: updated.blocks,
    });
    updated.wordCount = metrics.wordCount;
    updated.readingTimeMinutes = metrics.readingTimeMinutes;

    const result = await this.db.runInTransaction(async () => {
      const res = await this.db.stories.update(updated);

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

      return res;
    });

    return result;
  }

  async addBlock(storyId: string, rawBlock: unknown, ctx: StoryContext): Promise<StoryBlock> {
    await this.getStory(storyId, ctx.organizationId);
    const validated = validateBlock(rawBlock);
    const sanitized = sanitizeBlock(validated);

    const currentBlocks = await this.db.stories.getBlocks(storyId);
    sanitized.sortOrder = currentBlocks.length;
    currentBlocks.push(sanitized);

    await this.db.stories.saveBlocks(storyId, currentBlocks);

    await this.db.audit.log({
      id: generateId('aud'),
      organizationId: ctx.organizationId,
      userId: ctx.authorId,
      clientType: ctx.clientType,
      action: `${ctx.createdVia || 'mcp'}.add_story_block`,
      resourceType: 'story_block',
      resourceId: sanitized.id,
      payloadSummary: { storyId, blockType: sanitized.blockType },
      requestId: ctx.requestId,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    });

    return sanitized;
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

    story.currentVersionNumber = nextVersionNumber;
    story.currentVersionId = versionId;
    if (validated.title) story.title = validated.title;
    if (validated.summary) story.summary = validated.summary;
    story.blocks = newBlocks;
    story.updatedAt = now;

    await this.db.runInTransaction(async () => {
      await this.db.stories.createVersion(versionRecord);
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
    });

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

    broadcast('story.published', {
      storyId: saved.id,
      title: saved.title,
      slug: saved.slug,
      publishedAt: saved.publishedAt,
    });

    return saved;
  }

  async unpublishStory(storyId: string, ctx: StoryContext): Promise<Story> {
    const story = await this.getStory(storyId, ctx.organizationId);
    story.status = 'DRAFT';
    story.updatedAt = new Date().toISOString();
    const saved = await this.db.stories.update(story);
    broadcast('story.unpublished', { storyId: saved.id, title: saved.title });
    return saved;
  }

  async archiveStory(storyId: string, ctx: StoryContext): Promise<Story> {
    const story = await this.getStory(storyId, ctx.organizationId);
    story.status = 'ARCHIVED';
    story.updatedAt = new Date().toISOString();
    const saved = await this.db.stories.update(story);
    broadcast('story.archived', { storyId: saved.id, title: saved.title });
    return saved;
  }

  async submitForReview(storyId: string, ctx: StoryContext): Promise<Story> {
    const story = await this.getStory(storyId, ctx.organizationId);
    if (story.status === 'PUBLISHED') {
      throw new ValidationError('Story is already published.');
    }
    const blocks = await this.db.stories.getBlocks(storyId);
    if (blocks.length === 0) {
      throw new ValidationError('Cannot submit for review: story has no content blocks.');
    }

    const now = new Date().toISOString();
    story.status = 'IN_REVIEW';
    story.updatedAt = now;
    const saved = await this.db.runInTransaction(async () => {
      const res = await this.db.stories.update(story);

      await this.db.audit.log({
        id: generateId('aud'),
        organizationId: ctx.organizationId,
        userId: ctx.authorId,
        clientType: ctx.clientType,
        action: `${ctx.createdVia || 'api'}.submit_review`,
        resourceType: 'story',
        resourceId: storyId,
        payloadSummary: { title: story.title, status: 'IN_REVIEW' },
        requestId: ctx.requestId,
        status: 'SUCCESS',
        timestamp: now,
      });

      return res;
    });

    broadcast('story.in_review', { storyId: saved.id, title: saved.title });
    return saved;
  }

  async reviewStory(
    storyId: string,
    review: { action: 'approve' | 'reject'; feedback?: string },
    ctx: StoryContext
  ): Promise<Story> {
    const story = await this.getStory(storyId, ctx.organizationId);
    const now = new Date().toISOString();

    if (review.action === 'approve') {
      const blocks = await this.db.stories.getBlocks(storyId);
      if (blocks.length === 0) {
        throw new ValidationError('Cannot approve story: 0 content blocks.');
      }
      story.status = 'PUBLISHED';
      story.publishedAt = now;
      story.updatedAt = now;
      const saved = await this.db.runInTransaction(async () => {
        const res = await this.db.stories.update(story);

        await this.db.audit.log({
          id: generateId('aud'),
          organizationId: ctx.organizationId,
          userId: ctx.authorId,
          clientType: ctx.clientType,
          action: `${ctx.createdVia || 'api'}.approve_story`,
          resourceType: 'story',
          resourceId: storyId,
          payloadSummary: { title: story.title, approvedBy: ctx.authorId, feedback: review.feedback },
          requestId: ctx.requestId,
          status: 'SUCCESS',
          timestamp: now,
        });

        return res;
      });

      broadcast('story.published', {
        storyId: saved.id,
        title: saved.title,
        slug: saved.slug,
        publishedAt: saved.publishedAt,
      });
      return saved;
    } else {
      story.status = 'DRAFT';
      story.updatedAt = now;
      const saved = await this.db.runInTransaction(async () => {
        const res = await this.db.stories.update(story);

        await this.db.audit.log({
          id: generateId('aud'),
          organizationId: ctx.organizationId,
          userId: ctx.authorId,
          clientType: ctx.clientType,
          action: `${ctx.createdVia || 'api'}.reject_story`,
          resourceType: 'story',
          resourceId: storyId,
          payloadSummary: { title: story.title, rejectedBy: ctx.authorId, feedback: review.feedback },
          requestId: ctx.requestId,
          status: 'SUCCESS',
          timestamp: now,
        });

        return res;
      });

      broadcast('story.rejected', {
        storyId: saved.id,
        title: saved.title,
        feedback: review.feedback,
      });
      return saved;
    }
  }

  async getReviewQueue(orgId: string): Promise<Story[]> {
    return this.db.stories.list({ status: 'IN_REVIEW' }, orgId);
  }

  /**
   * Permanently deletes a story and all its blocks/versions.
   * Previously this was done directly via db.stories.delete() in the MCP
   * server, bypassing audit logging. Now it goes through the service layer.
   */
  async deleteStory(storyId: string, ctx: StoryContext): Promise<boolean> {
    const story = await this.db.stories.findById(storyId, ctx.organizationId);
    if (!story) {
      return false;
    }

    const deleted = await this.db.runInTransaction(async () => {
      const del = await this.db.stories.delete(storyId, ctx.organizationId);

      if (del) {
        await this.db.audit.log({
          id: generateId('aud'),
          organizationId: ctx.organizationId,
          userId: ctx.authorId,
          clientType: ctx.clientType,
          action: `${ctx.createdVia || 'mcp'}.delete_story`,
          resourceType: 'story',
          resourceId: storyId,
          payloadSummary: { title: story.title, permanently: true },
          requestId: ctx.requestId,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        });
      }

      return del;
    });

    if (deleted) {
      broadcast('story.deleted', { storyId, title: story.title });
    }

    return deleted;
  }
}
