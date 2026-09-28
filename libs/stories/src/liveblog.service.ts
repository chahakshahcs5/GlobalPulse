import { randomUUID } from 'crypto';
import type { DatabaseService } from '@ai-news/database';
import type {
  LiveblogEntry,
  LiveblogAuthor,
  CreateLiveblogEntryInput,
} from '@ai-news/schemas';

export class LiveblogService {
  constructor(private readonly db: DatabaseService) {}

  async addEntry(
    storyId: string,
    input: CreateLiveblogEntryInput,
    author: LiveblogAuthor,
    orgId: string = 'org_default'
  ): Promise<LiveblogEntry> {
    const story = await this.db.stories.findById(storyId, orgId);
    if (!story) {
      throw new Error(`Story with id ${storyId} was not found`);
    }

    const now = new Date().toISOString();
    const entry: LiveblogEntry = {
      id: `lbe_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      storyId,
      headline: input.headline,
      content: input.content,
      isKeyEvent: input.isKeyEvent ?? false,
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatarUrl,
      },
      timestamp: now,
    };

    return this.db.liveblogs.addEntry(entry);
  }

  async listEntries(storyId: string, limit = 100): Promise<LiveblogEntry[]> {
    return this.db.liveblogs.listEntries(storyId, limit);
  }

  async deleteEntry(entryId: string): Promise<boolean> {
    return this.db.liveblogs.deleteEntry(entryId);
  }
}
