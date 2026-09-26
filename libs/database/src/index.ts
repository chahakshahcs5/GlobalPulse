import {
  InMemoryStoryRepository,
  InMemoryEventRepository,
  InMemoryTopicRepository,
  InMemoryEntityRepository,
  InMemorySourceRepository,
  InMemoryIdempotencyRepository,
  InMemoryAuditRepository,
} from './in-memory-store';
import type {
  IStoryRepository,
  IEventRepository,
  ITopicRepository,
  IEntityRepository,
  ISourceRepository,
  IIdempotencyRepository,
  IAuditRepository,
} from './interfaces';

export * from './interfaces';
export * from './in-memory-store';

export class DatabaseService {
  public stories: IStoryRepository;
  public events: IEventRepository;
  public topics: ITopicRepository;
  public entities: IEntityRepository;
  public sources: ISourceRepository;
  public idempotency: IIdempotencyRepository;
  public audit: IAuditRepository;

  constructor() {
    this.stories = new InMemoryStoryRepository();
    this.events = new InMemoryEventRepository();
    this.topics = new InMemoryTopicRepository();
    this.entities = new InMemoryEntityRepository();
    this.sources = new InMemorySourceRepository();
    this.idempotency = new InMemoryIdempotencyRepository();
    this.audit = new InMemoryAuditRepository();
  }
}

// Global singleton instance for application use
export const db = new DatabaseService();
