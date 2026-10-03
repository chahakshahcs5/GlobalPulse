import type { DatabaseService } from '@ai-news/database';
import {
  StoryService,
  SchedulingService,
  PersonalizationService,
  ClusteringService,
  LiveblogService,
  TemplateService,
  CollaborationService,
  FactCheckService,
  ProvenanceService,
  WebhookService,
  EngagementService,
  NewsletterService,
  CollectionService,
  PerspectivesService,
  CitizenTipsService,
  UserService,
  AnalyticsService,
  NotificationService,
} from '@ai-news/stories';
import { SearchService } from '@ai-news/search';
import { SourceService } from '@ai-news/sources';
import { TopicService } from '@ai-news/topics';
import { EventService } from '@ai-news/events';
import { EntityService } from '@ai-news/entities';

export interface ServiceContainer {
  db: DatabaseService;
  storyService: StoryService;
  schedulingService: SchedulingService;
  personalizationService: PersonalizationService;
  clusteringService: ClusteringService;
  liveblogService: LiveblogService;
  templateService: TemplateService;
  collaborationService: CollaborationService;
  factCheckService: FactCheckService;
  provenanceService: ProvenanceService;
  webhookService: WebhookService;
  engagementService: EngagementService;
  newsletterService: NewsletterService;
  collectionService: CollectionService;
  perspectivesService: PerspectivesService;
  citizenTipsService: CitizenTipsService;
  searchService: SearchService;
  sourceService: SourceService;
  topicService: TopicService;
  eventService: EventService;
  entityService: EntityService;
  userService: UserService;
  analyticsService: AnalyticsService;
  notificationService: NotificationService;
}

export function createServiceContainer(db: DatabaseService): ServiceContainer {
  return {
    db,
    storyService: new StoryService(db),
    schedulingService: new SchedulingService(db),
    personalizationService: new PersonalizationService(db),
    clusteringService: new ClusteringService(db),
    liveblogService: new LiveblogService(db),
    templateService: new TemplateService(db),
    collaborationService: new CollaborationService(db),
    factCheckService: new FactCheckService(db),
    provenanceService: new ProvenanceService(db),
    webhookService: new WebhookService(db),
    engagementService: new EngagementService(db),
    newsletterService: new NewsletterService(db),
    collectionService: new CollectionService(db),
    perspectivesService: new PerspectivesService(),
    citizenTipsService: new CitizenTipsService(),
    searchService: new SearchService(db),
    sourceService: new SourceService(db),
    topicService: new TopicService(db),
    eventService: new EventService(db),
    entityService: new EntityService(db),
    userService: new UserService(db),
    analyticsService: new AnalyticsService(db),
    notificationService: new NotificationService(db),
  };
}
