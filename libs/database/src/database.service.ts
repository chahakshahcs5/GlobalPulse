import type {
  IStoryRepository,
  IEventRepository,
  ITopicRepository,
  IEntityRepository,
  ISourceRepository,
  IIdempotencyRepository,
  IAuditRepository,
  IEngagementRepository,
  IUserRepository,
  INotificationRepository,
} from './interfaces';
import {
  MemoryStoryRepository,
  MemoryEventRepository,
  MemoryTopicRepository,
  MemoryEntityRepository,
  MemorySourceRepository,
  MemoryIdempotencyRepository,
  MemoryAuditRepository,
  MemoryEngagementRepository,
  MemoryUserRepository,
  MemoryNotificationRepository,
} from './repositories/memory';
import {
  PrismaStoryRepository,
  PrismaEventRepository,
  PrismaTopicRepository,
  PrismaEntityRepository,
  PrismaSourceRepository,
  PrismaIdempotencyRepository,
  PrismaAuditRepository,
} from './repositories/prisma';
import { prismaManager } from './client/prisma-client';
import { checkDatabaseHealth, DatabaseHealthStatus } from './client/connection-status';
import { TransactionManager } from './transactions/transaction-manager';
import { logger } from '@ai-news/observability';

export interface DatabaseServiceOptions {
  memory?: boolean;
  engine?: 'memory' | 'prisma';
}

export class DatabaseService {
  public stories: IStoryRepository;
  public events: IEventRepository;
  public topics: ITopicRepository;
  public entities: IEntityRepository;
  public sources: ISourceRepository;
  public idempotency: IIdempotencyRepository;
  public audit: IAuditRepository;
  public engagement: IEngagementRepository;
  public users: IUserRepository;
  public notifications: INotificationRepository;

  private memoryStories = new MemoryStoryRepository();
  private memoryEvents = new MemoryEventRepository();
  private memoryTopics = new MemoryTopicRepository();
  private memoryEntities = new MemoryEntityRepository();
  private memorySources = new MemorySourceRepository();
  private memoryIdempotency = new MemoryIdempotencyRepository();
  private memoryAudit = new MemoryAuditRepository();
  private memoryEngagement = new MemoryEngagementRepository();
  private memoryUsers = new MemoryUserRepository();
  private memoryNotifications = new MemoryNotificationRepository();

  private isPrismaActive = false;

  constructor(_options?: DatabaseServiceOptions) {
    // Default to high-performance in-memory repositories
    this.stories = this.memoryStories;
    this.events = this.memoryEvents;
    this.topics = this.memoryTopics;
    this.entities = this.memoryEntities;
    this.sources = this.memorySources;
    this.idempotency = this.memoryIdempotency;
    this.audit = this.memoryAudit;
    this.engagement = this.memoryEngagement;
    this.users = this.memoryUsers;
    this.notifications = this.memoryNotifications;
  }

  /**
   * Attempt to initialize and switch to PostgreSQL Prisma repositories if available
   */
  public async initialize(): Promise<boolean> {
    try {
      const client = await prismaManager.getClient();
      if (client) {
        const getPrisma = () => client;
        this.stories = new PrismaStoryRepository(getPrisma);
        this.events = new PrismaEventRepository(getPrisma);
        this.topics = new PrismaTopicRepository(getPrisma);
        this.entities = new PrismaEntityRepository(getPrisma);
        this.sources = new PrismaSourceRepository(getPrisma);
        this.idempotency = new PrismaIdempotencyRepository(getPrisma);
        this.audit = new PrismaAuditRepository(getPrisma);
        this.isPrismaActive = true;
        logger.info('DatabaseService initialized in PostgreSQL Prisma mode.');
        return true;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn(`Prisma initialization failed: ${errorMsg}. Operating in Memory mode.`);
    }

    this.isPrismaActive = false;
    logger.info('DatabaseService operating in High-Fidelity Memory mode.');
    return false;
  }

  public isUsingPrisma(): boolean {
    return this.isPrismaActive;
  }

  public async getHealth(): Promise<DatabaseHealthStatus> {
    return checkDatabaseHealth();
  }

  public async runInTransaction<T>(work: (tx: unknown) => Promise<T>): Promise<T> {
    if (this.isPrismaActive) {
      return TransactionManager.execute(work);
    }

    // High-fidelity in-memory atomic transaction with automatic rollback
    const storySnap = this.memoryStories.snapshot();
    const auditSnap = this.memoryAudit.snapshot();
    const idempSnap = this.memoryIdempotency.snapshot();
    const userSnap = this.memoryUsers.snapshot();
    const notifSnap = this.memoryNotifications.snapshot();
    try {
      const result = await work(null);
      return result;
    } catch (err) {
      this.memoryStories.restore(storySnap);
      this.memoryAudit.restore(auditSnap);
      this.memoryIdempotency.restore(idempSnap);
      this.memoryUsers.restore(userSnap);
      this.memoryNotifications.restore(notifSnap);
      throw err;
    }
  }

  public clear(): void {
    this.memoryStories.clear();
    this.memoryEvents.clear();
    this.memoryTopics.clear();
    this.memoryEntities.clear();
    this.memorySources.clear();
    this.memoryIdempotency.clear();
    this.memoryAudit.clear();
    this.memoryUsers.clear();
    this.memoryNotifications.clear();
  }
}

// Global database singleton
export const db = new DatabaseService();
