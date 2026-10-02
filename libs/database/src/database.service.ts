import type {
  IStoryRepository,
  IEventRepository,
  ITopicRepository,
  IEntityRepository,
  ISourceRepository,
  IPublisherRepository,
  IIdempotencyRepository,
  IAuditRepository,
  IEngagementRepository,
  IUserRepository,
  INotificationRepository,
  IClusterRepository,
  ILiveblogRepository,
  INewsletterRepository,
  ICollectionRepository,
  IWebhookRepository,
  IProvenanceRepository,
  IFactCheckRepository,
  ICategoryRepository,
  INavTabRepository,
} from './interfaces';
import {
  MemoryStoryRepository,
  MemoryEventRepository,
  MemoryTopicRepository,
  MemoryEntityRepository,
  MemorySourceRepository,
  MemoryPublisherRepository,
  MemoryIdempotencyRepository,
  MemoryAuditRepository,
  MemoryEngagementRepository,
  MemoryUserRepository,
  MemoryNotificationRepository,
  MemoryClusterRepository,
  MemoryLiveblogRepository,
  MemoryNewsletterRepository,
  MemoryCollectionRepository,
  MemoryWebhookRepository,
  MemoryProvenanceRepository,
  MemoryFactCheckRepository,
  MemoryCategoryRepository,
  MemoryNavTabRepository,
} from './repositories/memory';
import {
  PrismaStoryRepository,
  PrismaEventRepository,
  PrismaTopicRepository,
  PrismaEntityRepository,
  PrismaSourceRepository,
  PrismaPublisherRepository,
  PrismaIdempotencyRepository,
  PrismaAuditRepository,
  PrismaUserRepository,
  PrismaNotificationRepository,
  PrismaEngagementRepository,
  PrismaClusterRepository,
  PrismaLiveblogRepository,
  PrismaNewsletterRepository,
  PrismaCollectionRepository,
  PrismaWebhookRepository,
  PrismaProvenanceRepository,
  PrismaFactCheckRepository,
  PrismaCategoryRepository,
  PrismaNavTabRepository,
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
  public publishers: IPublisherRepository;
  public idempotency: IIdempotencyRepository;
  public audit: IAuditRepository;
  public engagement: IEngagementRepository;
  public users: IUserRepository;
  public notifications: INotificationRepository;
  public clusters: IClusterRepository;
  public liveblogs: ILiveblogRepository;
  public newsletters: INewsletterRepository;
  public collections: ICollectionRepository;
  public webhooks: IWebhookRepository;
  public provenance: IProvenanceRepository;
  public factChecks: IFactCheckRepository;
  public categories: ICategoryRepository;
  public navTabs: INavTabRepository;

  private memoryStories = new MemoryStoryRepository();
  private memoryEvents = new MemoryEventRepository();
  private memoryTopics = new MemoryTopicRepository();
  private memoryEntities = new MemoryEntityRepository();
  private memorySources = new MemorySourceRepository();
  private memoryPublishers = new MemoryPublisherRepository();
  private memoryIdempotency = new MemoryIdempotencyRepository();
  private memoryAudit = new MemoryAuditRepository();
  private memoryEngagement = new MemoryEngagementRepository();
  private memoryUsers = new MemoryUserRepository();
  private memoryNotifications = new MemoryNotificationRepository();
  private memoryClusters = new MemoryClusterRepository();
  private memoryLiveblogs = new MemoryLiveblogRepository();
  private memoryNewsletters = new MemoryNewsletterRepository();
  private memoryCollections = new MemoryCollectionRepository();
  private memoryWebhooks = new MemoryWebhookRepository();
  private memoryProvenance = new MemoryProvenanceRepository();
  private memoryFactChecks = new MemoryFactCheckRepository();
  private memoryCategories = new MemoryCategoryRepository();
  private memoryNavTabs = new MemoryNavTabRepository();

  private isPrismaActive = false;

  /**
   * Mutex for serializing in-memory transactions to prevent concurrent
   * transactions from seeing partial state (no real DB-level locking exists).
   */
  private _txMutexQueue: Array<() => void> = [];
  private _txLocked = false;

  private async acquireTransactionLock(): Promise<void> {
    if (!this._txLocked) {
      this._txLocked = true;
      return;
    }
    return new Promise<void>((resolve) => {
      this._txMutexQueue.push(resolve);
    });
  }

  private releaseTransactionLock(): void {
    if (this._txMutexQueue.length > 0) {
      const next = this._txMutexQueue.shift()!;
      next();
    } else {
      this._txLocked = false;
    }
  }

  constructor(_options?: DatabaseServiceOptions) {
    // Default to high-performance in-memory repositories
    this.stories = this.memoryStories;
    this.events = this.memoryEvents;
    this.topics = this.memoryTopics;
    this.entities = this.memoryEntities;
    this.sources = this.memorySources;
    this.publishers = this.memoryPublishers;
    this.idempotency = this.memoryIdempotency;
    this.audit = this.memoryAudit;
    this.engagement = this.memoryEngagement;
    this.users = this.memoryUsers;
    this.notifications = this.memoryNotifications;
    this.clusters = this.memoryClusters;
    this.liveblogs = this.memoryLiveblogs;
    this.newsletters = this.memoryNewsletters;
    this.collections = this.memoryCollections;
    this.webhooks = this.memoryWebhooks;
    this.provenance = this.memoryProvenance;
    this.factChecks = this.memoryFactChecks;
    this.categories = this.memoryCategories;
    this.navTabs = this.memoryNavTabs;
  }

  /**
   * Attempt to initialize and switch to PostgreSQL Prisma repositories if available
   */
  public async initialize(): Promise<boolean> {
    const isExplicitPrisma = process.env.DATABASE_ENGINE === 'prisma';
    const isProduction = process.env.NODE_ENV === 'production';
    const requiresPrisma =
      isExplicitPrisma || (isProduction && process.env.DATABASE_ENGINE !== 'memory');

    try {
      const client = await prismaManager.getClient();
      if (client) {
        const getPrisma = () => client;
        this.stories = new PrismaStoryRepository(getPrisma);
        this.events = new PrismaEventRepository(getPrisma);
        this.topics = new PrismaTopicRepository(getPrisma);
        this.entities = new PrismaEntityRepository(getPrisma);
        this.sources = new PrismaSourceRepository(getPrisma);
        this.publishers = new PrismaPublisherRepository(getPrisma);
        this.idempotency = new PrismaIdempotencyRepository(getPrisma);
        this.audit = new PrismaAuditRepository(getPrisma);
        this.users = new PrismaUserRepository(getPrisma);
        this.notifications = new PrismaNotificationRepository(getPrisma);
        this.engagement = new PrismaEngagementRepository(getPrisma);
        this.clusters = new PrismaClusterRepository(getPrisma);
        this.liveblogs = new PrismaLiveblogRepository(getPrisma);
        this.newsletters = new PrismaNewsletterRepository(getPrisma);
        this.collections = new PrismaCollectionRepository(getPrisma);
        this.webhooks = new PrismaWebhookRepository(getPrisma);
        this.provenance = new PrismaProvenanceRepository(getPrisma);
        this.factChecks = new PrismaFactCheckRepository(getPrisma);
        this.categories = new PrismaCategoryRepository(getPrisma);
        this.navTabs = new PrismaNavTabRepository(getPrisma);
        this.isPrismaActive = true;
        logger.info('DatabaseService initialized in PostgreSQL Prisma mode (all 16 domains).');
        return true;
      }

      if (requiresPrisma) {
        throw new Error(
          'DATABASE_ENGINE is configured as "prisma" or running in production, but PrismaClient could not be initialized (@prisma/client not generated or connection failed). In-memory fallback is disabled for production safety.'
        );
      }
    } catch (err: unknown) {
      if (requiresPrisma) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`Fatal database initialization failure: ${errorMsg}`);
        throw new Error(
          `DATABASE_ENGINE is configured as "prisma" or running in production, but PrismaClient could not be initialized (${errorMsg}). In-memory fallback is disabled for production safety.`
        );
      }
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

    // Serialize in-memory transactions via mutex to prevent partial reads
    await this.acquireTransactionLock();

    // High-fidelity in-memory atomic transaction with automatic rollback across all 16 domains
    const storySnap = this.memoryStories.snapshot();
    const eventSnap = this.memoryEvents.snapshot();
    const topicSnap = this.memoryTopics.snapshot();
    const entitySnap = this.memoryEntities.snapshot();
    const sourceSnap = this.memorySources.snapshot();
    const publisherSnap = this.memoryPublishers.snapshot();
    const idempSnap = this.memoryIdempotency.snapshot();
    const auditSnap = this.memoryAudit.snapshot();
    const engSnap = this.memoryEngagement.snapshot();
    const userSnap = this.memoryUsers.snapshot();
    const notifSnap = this.memoryNotifications.snapshot();
    const clusterSnap = this.memoryClusters.snapshot();
    const liveblogSnap = this.memoryLiveblogs.snapshot();
    const newsletterSnap = this.memoryNewsletters.snapshot();
    const collectionSnap = this.memoryCollections.snapshot();
    const webhookSnap = this.memoryWebhooks.snapshot();
    const provenanceSnap = this.memoryProvenance.snapshot();
    const factCheckSnap = this.memoryFactChecks.snapshot();
    const categorySnap = this.memoryCategories.snapshot();
    const navTabSnap = this.memoryNavTabs.snapshot();

    try {
      const result = await work(null);
      return result;
    } catch (err) {
      this.memoryStories.restore(storySnap);
      this.memoryEvents.restore(eventSnap);
      this.memoryTopics.restore(topicSnap);
      this.memoryEntities.restore(entitySnap);
      this.memorySources.restore(sourceSnap);
      this.memoryPublishers.restore(publisherSnap);
      this.memoryIdempotency.restore(idempSnap);
      this.memoryAudit.restore(auditSnap);
      this.memoryEngagement.restore(engSnap);
      this.memoryUsers.restore(userSnap);
      this.memoryNotifications.restore(notifSnap);
      this.memoryClusters.restore(clusterSnap);
      this.memoryLiveblogs.restore(liveblogSnap);
      this.memoryNewsletters.restore(newsletterSnap);
      this.memoryCollections.restore(collectionSnap);
      this.memoryWebhooks.restore(webhookSnap);
      this.memoryProvenance.restore(provenanceSnap);
      this.memoryFactChecks.restore(factCheckSnap);
      this.memoryCategories.restore(categorySnap);
      this.memoryNavTabs.restore(navTabSnap);
      throw err;
    } finally {
      this.releaseTransactionLock();
    }
  }

  public validateProductionConfiguration(): void {
    if (
      process.env.NODE_ENV === 'production' &&
      !this.isPrismaActive &&
      process.env.ALLOW_IN_MEMORY_PRODUCTION !== 'true'
    ) {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: DatabaseService is operating in in-memory mode in production. Configure DATABASE_URL and initialize Prisma persistence, or explicitly set ALLOW_IN_MEMORY_PRODUCTION=true if ephemeral storage is intended.'
      );
    }
  }

  public clear(): void {
    this.memoryStories.clear();
    this.memoryEvents.clear();
    this.memoryTopics.clear();
    this.memoryEntities.clear();
    this.memorySources.clear();
    this.memoryPublishers.clear();
    this.memoryIdempotency.clear();
    this.memoryAudit.clear();
    this.memoryEngagement.clear();
    this.memoryUsers.clear();
    this.memoryNotifications.clear();
    this.memoryClusters.clear();
    this.memoryLiveblogs.clear();
    this.memoryNewsletters.clear();
    this.memoryCollections.clear();
    this.memoryWebhooks.clear();
    this.memoryProvenance.clear();
    this.memoryFactChecks.clear();
    this.memoryCategories.clear();
    this.memoryNavTabs.clear();
  }
}

/**
 * Creates a new DatabaseService instance. Use this instead of the global singleton
 * when you need explicit lifecycle control (e.g. in tests or isolated processes).
 */
export function createDatabaseService(options?: DatabaseServiceOptions): DatabaseService {
  return new DatabaseService(options);
}

/**
 * Lazy-initialized singleton for backward compatibility.
 * Prefer `createDatabaseService()` for new code.
 */
let _dbSingleton: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!_dbSingleton) {
    _dbSingleton = new DatabaseService();
  }
  return _dbSingleton;
}

/**
 * @deprecated Use `getDatabaseService()` or `createDatabaseService()` instead.
 * Kept for backward compatibility — this is a lazy singleton accessor.
 */
export const db = getDatabaseService();
