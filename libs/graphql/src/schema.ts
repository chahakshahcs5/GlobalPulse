export const typeDefs = `#graphql
  scalar JSON
  scalar DateTime

  enum StoryStatus {
    DRAFT
    IN_REVIEW
    SCHEDULED
    PUBLISHED
    ARCHIVED
  }

  enum ArticleType {
    breaking_news
    developing_story
    explainer
    analysis
    background
    deep_dive
    data_story
    visual_story
    timeline
    technology
    science
    business
    markets
    sports
    politics
    culture
    local
    weekly_digest
    topic_briefing
    liveblog
    fact_check
    opinion
    investigation
    india
    health
    world
    entertainment
  }

  enum ClientType {
    gemini
    gemini_spark
    chatgpt
    claude
    custom_mcp
    human_web
    human_mobile
    internal_service
  }

  enum EntityType {
    PERSON
    ORGANIZATION
    COUNTRY
    LOCATION
    TECHNOLOGY
    PRODUCT
    INSTITUTION
  }

  type StoryBlock {
    id: ID!
    blockType: String!
    sortOrder: Int!
    data: JSON!
    metadata: JSON
    citationIds: [String!]
  }

  type StoryVersion {
    id: ID!
    storyId: String!
    versionNumber: Int!
    title: String!
    summary: String!
    blocksJson: JSON!
    changeSummary: String
    clientType: ClientType!
    authorId: String!
    createdAt: String!
  }

  type Story {
    id: ID!
    organizationId: String!
    slug: String!
    title: String!
    summary: String!
    status: StoryStatus!
    articleType: ArticleType!
    eventId: String
    currentVersionNumber: Int!
    topicIds: [String!]!
    entityIds: [String!]!
    sourceIds: [String!]!
    heroImageUrl: String
    createdVia: String!
    createdByClient: ClientType!
    authorId: String!
    publishedAt: String
    createdAt: String!
    updatedAt: String!
    blocks: [StoryBlock!]!
    versions: [StoryVersion!]
  }

  type Topic {
    id: ID!
    organizationId: String!
    slug: String!
    name: String!
    description: String
    aliases: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type Event {
    id: ID!
    organizationId: String!
    title: String!
    summary: String!
    status: String!
    occurredAt: String!
    location: String
    coordinates: [Float!]
    topicIds: [String!]!
    entityIds: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type Entity {
    id: ID!
    organizationId: String!
    slug: String!
    name: String!
    type: EntityType!
    description: String
    aliases: [String!]!
    avatarUrl: String
    createdAt: String!
    updatedAt: String!
  }

  type Source {
    id: ID!
    organizationId: String!
    url: String!
    canonicalUrl: String
    title: String!
    publisher: String!
    author: String
    publishedAt: String
    sourceType: String!
    permissibleExcerpt: String
    createdAt: String!
  }

  type MediaAsset {
    id: ID!
    type: String!
    url: String!
    title: String
    metadata: JSON
    createdAt: String!
  }

  type Job {
    id: ID!
    type: String!
    status: String!
    progress: Int!
    result: JSON
    createdAt: String!
  }

  input SearchStoriesInput {
    query: String
    status: StoryStatus
    articleType: ArticleType
    topicId: String
    entityId: String
    sourceId: String
    limit: Int
  }

  input CreateStoryInput {
    title: String!
    summary: String!
    articleType: ArticleType
    eventId: String
    topicIds: [String!]
    entityIds: [String!]
    sourceIds: [String!]
    heroImageUrl: String
    idempotencyKey: String
    blocks: [JSON!]
  }

  input UpdateStoryInput {
    title: String
    summary: String
    status: StoryStatus
    heroImageUrl: String
    topicIds: [String!]
    entityIds: [String!]
    sourceIds: [String!]
  }

  input CreateStoryVersionInput {
    storyId: String!
    title: String!
    summary: String!
    blocks: [JSON!]!
    changeSummary: String
    clientType: ClientType
  }

  input StoryBlockInput {
    id: String
    blockType: String!
    sortOrder: Int
    data: JSON!
    metadata: JSON
    citationIds: [String!]
  }

  input CreateMediaInput {
    mediaType: String!
    title: String!
    url: String!
    metadata: JSON
  }

  input CreateTopicInput {
    name: String!
    description: String
    aliases: [String!]
  }

  input CreateEventInput {
    title: String!
    summary: String!
    status: String
    occurredAt: String
    location: String
    coordinates: [Float!]
  }

  input CreateEntityInput {
    name: String!
    type: EntityType!
    description: String
    aliases: [String!]
  }

  enum ClaimStatus {
    UNVERIFIED
    SUPPORTED
    PARTIALLY_SUPPORTED
    CONTRADICTED
    UNSUPPORTED
    DISPUTED
  }

  enum EvidenceStance {
    SUPPORTS
    CONTRADICTS
    CONTEXT
  }

  enum EvidenceType {
    DOCUMENT
    DATASET
    TESTIMONY
    EXPERT_ANALYSIS
    VIDEO
    AUDIO
    IMAGE
    STATISTIC
    OTHER
  }

  enum TimelineEventType {
    DEVELOPMENT
    OFFICIAL_STATEMENT
    LEGAL_ACTION
    ELECTION
    DISASTER
    SCIENCE
    ECONOMIC
    CONFLICT
    OTHER
  }

  enum PerspectiveStance {
    SUPPORTS
    OPPOSES
    NEUTRAL
    MIXED
    UNKNOWN
  }

  enum AlertSeverity {
    LOW
    MODERATE
    MAJOR
    CRITICAL
  }

  enum AlertChannel {
    in_app
    email
    push
    webhook
  }

  enum AlertResourceType {
    EVENT
    STORY
    INGESTION_ITEM
  }

  enum IngestionFeedType {
    rss
    atom
    json_api
    webhook
  }

  enum IngestionItemStatus {
    NEW
    DUPLICATE
    CLUSTERED
    PROMOTED
    REJECTED
  }

  enum CorrectionType {
    CORRECTION
    RETRACTION
    CLARIFICATION
    UPDATE
  }

  enum GraphNodeType {
    PERSON
    ORGANIZATION
    COMPANY
    COUNTRY
    TECHNOLOGY
    PRODUCT
    INSTITUTION
    ENTITY
    PUBLISHER
    SOURCE
    STORY
    EVENT
    TOPIC
    LOCATION
    CLAIM
    EVIDENCE
    CITATION
  }

  enum GraphRelation {
    works_for
    mentioned_in
    covers
    mentions
    supported_by
    contradicted_by
    originates_from
    published_by
    located_at
    part_of
    related_to
    has_claim
    has_evidence
    cites
    follows
    occurred_at
    custom
  }

  type Claim {
    id: ID!
    organizationId: String!
    storyId: String!
    text: String!
    status: ClaimStatus!
    confidence: Float
    confidenceMethodology: String
    methodology: String
    reviewerId: String
    reviewedAt: String
    reviewNotes: String
    sourceIds: [String!]!
    citationIds: [String!]!
    createdBy: String!
    createdAt: String!
    updatedAt: String!
    evidence: [Evidence!]!
  }

  type Evidence {
    id: ID!
    organizationId: String!
    storyId: String!
    claimId: String
    sourceId: String
    citationId: String
    type: EvidenceType!
    title: String!
    description: String
    url: String
    excerpt: String
    stance: EvidenceStance!
    strength: Float
    methodology: String
    retrievedAt: String
    publishedAt: String
    createdBy: String!
    createdAt: String!
    updatedAt: String!
  }

  type StoryTimelineEvent {
    id: ID!
    organizationId: String!
    storyId: String!
    title: String!
    description: String!
    eventType: TimelineEventType!
    occurredAt: String!
    location: String
    coordinates: [Float!]
    entityIds: [String!]!
    sourceIds: [String!]!
    citationIds: [String!]!
    mediaUrl: String
    authorId: String!
    createdAt: String!
    updatedAt: String!
  }

  type EditorialPerspective {
    id: ID!
    organizationId: String!
    storyId: String!
    label: String!
    summary: String!
    stance: PerspectiveStance!
    sourceIds: [String!]!
    citationIds: [String!]!
    quoteExcerpt: String
    createdBy: String!
    createdAt: String!
    updatedAt: String!
  }

  type WhatChangedItem {
    changeType: String!
    description: String!
    affectedSection: String
    occurredAt: String
    sourceIds: [String!]
  }

  type StoryWhatChanged {
    storyId: String!
    previousVersionNumber: Int!
    currentVersionNumber: Int!
    updatedAt: String!
    latestDevelopment: StoryTimelineEvent
    items: [WhatChangedItem!]!
    affectedEntityIds: [String!]!
    supportingSourceIds: [String!]!
  }

  type StoryIntelligenceMetrics {
    sourceCount: Int!
    claimCount: Int!
    supportedClaimCount: Int!
    contestedClaimCount: Int!
    evidenceCount: Int!
    timelineEventCount: Int!
    perspectiveCount: Int!
    updateCount: Int!
  }

  type StoryIntelligence {
    storyId: String!
    organizationId: String!
    title: String!
    summary: String!
    status: String!
    claims: [Claim!]!
    evidence: [Evidence!]!
    timeline: [StoryTimelineEvent!]!
    perspectives: [EditorialPerspective!]!
    whatChanged: StoryWhatChanged!
    metrics: StoryIntelligenceMetrics!
  }

  type KnowledgeEdge {
    id: ID!
    organizationId: String!
    fromType: GraphNodeType!
    fromId: String!
    relation: GraphRelation!
    toType: GraphNodeType!
    toId: String!
    weight: Float!
    metadata: JSON
    createdAt: String!
  }

  type GraphNode {
    type: GraphNodeType!
    id: String!
    label: String
    metadata: JSON
  }

  type GraphTraversal {
    root: GraphNode!
    depth: Int!
    nodes: [GraphNode!]!
    edges: [KnowledgeEdge!]!
    truncated: Boolean!
  }

  type AlertRule {
    id: ID!
    organizationId: String!
    name: String!
    description: String
    enabled: Boolean!
    conditions: JSON!
    channels: [AlertChannel!]!
    schedule: JSON
    cooldownMinutes: Int!
    createdBy: String!
    createdAt: String!
    updatedAt: String!
    lastTriggeredAt: String
  }

  type AlertTrigger {
    id: ID!
    organizationId: String!
    ruleId: String!
    resourceType: AlertResourceType!
    resourceId: String!
    severity: AlertSeverity!
    message: String!
    matchedConditions: [String!]!
    deliveredChannels: [AlertChannel!]!
    createdAt: String!
  }

  type EvaluateAlertsResult {
    resourceType: AlertResourceType!
    resourceId: String!
    evaluatedRules: Int!
    triggers: [AlertTrigger!]!
    skipped: [JSON!]!
  }

  type IngestionFeed {
    id: ID!
    organizationId: String!
    name: String!
    url: String!
    type: IngestionFeedType!
    active: Boolean!
    defaultTopicIds: [String!]!
    defaultEntityIds: [String!]!
    defaultSourceType: String!
    fetchIntervalMinutes: Int!
    lastFetchedAt: String
    lastStatus: String
    createdBy: String!
    createdAt: String!
    updatedAt: String!
  }

  type IngestionItem {
    id: ID!
    organizationId: String!
    feedId: String!
    externalId: String
    url: String!
    title: String!
    summary: String
    contentText: String
    author: String
    publishedAt: String
    retrievedAt: String!
    status: IngestionItemStatus!
    signals: JSON!
    claimTexts: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type IngestFeedResult {
    feedId: String!
    fetchedAt: String!
    fetched: Int!
    created: Int!
    duplicates: Int!
    clustered: Int!
    items: [IngestionItem!]!
  }

  type PromoteIngestionItemResult {
    item: IngestionItem!
    sourceId: String!
    storyId: String
    storySlug: String
  }

  type BreakingNewsCandidate {
    id: ID!
    organizationId: String!
    title: String!
    summary: String!
    eventId: String
    storyIds: [String!]!
    sourceIds: [String!]!
    independentSourceCount: Int!
    storyVelocity: Float!
    entityIds: [String!]!
    severity: String!
    lastUpdatedAt: String!
    confidenceMethodology: String!
    reviewStatus: String!
  }

  type SourceCorrection {
    id: ID!
    organizationId: String!
    publisherId: String
    sourceId: String
    storyId: String
    type: CorrectionType!
    description: String!
    issuedAt: String!
    url: String
    recordedBy: String!
    createdAt: String!
  }

  type PublisherSummary {
    id: ID!
    name: String!
    slug: String!
    domain: String!
    description: String
    country: String
    language: String!
    websiteUrl: String
    ownership: String
    methodology: String
    correctionPolicyUrl: String
    foundedYear: Int
    isVerified: Boolean!
  }

  type SourceIntelligenceMetrics {
    sourceCount: Int!
    citedSourceCount: Int!
    citationCount: Int!
    storyCount: Int!
    correctionCount: Int!
    retractionCount: Int!
    correctionRate: Float!
    languages: JSON!
    sourceTypes: JSON!
    coverageAreas: JSON!
    lastPublishedAt: String
  }

  type PublisherIntelligenceSource {
    id: ID!
    title: String!
    url: String!
    sourceType: String!
    publishedAt: String
    retrievedAt: String!
  }

  type PublisherIntelligence {
    publisher: PublisherSummary!
    metrics: SourceIntelligenceMetrics!
    corrections: [SourceCorrection!]!
    sources: [PublisherIntelligenceSource!]!
    methodologyNotes: [String!]!
  }

  type ClaimEvidenceChain {
    claim: Claim!
    evidence: [Evidence!]!
  }

  input GraphQueryInput {
    nodeType: GraphNodeType
    nodeId: String
    relation: GraphRelation
    query: String
    depth: Int
    limit: Int
  }

  input CreateClaimInput {
    text: String!
    status: ClaimStatus
    confidence: Float
    confidenceMethodology: String
    methodology: String
    sourceIds: [String!]
    citationIds: [String!]
  }

  input UpdateClaimStatusInput {
    status: ClaimStatus!
    confidence: Float
    confidenceMethodology: String
    methodology: String
    reviewNotes: String
    sourceIds: [String!]
    citationIds: [String!]
  }

  input CreateEvidenceInput {
    claimId: String
    sourceId: String
    citationId: String
    type: EvidenceType
    title: String!
    description: String
    url: String
    excerpt: String
    stance: EvidenceStance
    strength: Float
    methodology: String
    retrievedAt: String
    publishedAt: String
  }

  input CreateTimelineEventInput {
    title: String!
    description: String!
    eventType: TimelineEventType
    occurredAt: String
    location: String
    coordinates: [Float!]
    entityIds: [String!]
    sourceIds: [String!]
    citationIds: [String!]
    mediaUrl: String
  }

  input UpdateTimelineEventInput {
    title: String
    description: String
    eventType: TimelineEventType
    occurredAt: String
    location: String
    coordinates: [Float!]
    entityIds: [String!]
    sourceIds: [String!]
    citationIds: [String!]
    mediaUrl: String
  }

  input CreatePerspectiveInput {
    label: String!
    summary: String!
    stance: PerspectiveStance
    sourceIds: [String!]
    citationIds: [String!]
    quoteExcerpt: String
  }

  input CreateKnowledgeEdgeInput {
    fromType: GraphNodeType!
    fromId: String!
    relation: GraphRelation!
    toType: GraphNodeType!
    toId: String!
    weight: Float
    metadata: JSON
  }

  input CreateAlertRuleInput {
    name: String!
    description: String
    enabled: Boolean
    conditions: JSON!
    channels: [AlertChannel!]
    schedule: JSON
    cooldownMinutes: Int
  }

  input UpdateAlertRuleInput {
    name: String
    description: String
    enabled: Boolean
    conditions: JSON
    channels: [AlertChannel!]
    schedule: JSON
    cooldownMinutes: Int
  }

  input CreateIngestionFeedInput {
    name: String!
    url: String!
    type: IngestionFeedType
    active: Boolean
    defaultTopicIds: [String!]
    defaultEntityIds: [String!]
    defaultSourceType: String
    fetchIntervalMinutes: Int
  }

  input UpdateIngestionFeedInput {
    name: String
    url: String
    type: IngestionFeedType
    active: Boolean
    defaultTopicIds: [String!]
    defaultEntityIds: [String!]
    defaultSourceType: String
    fetchIntervalMinutes: Int
  }

  input PromoteIngestionItemInput {
    createDraftStory: Boolean
    topicIds: [String!]
    entityIds: [String!]
  }

  input CreateSourceCorrectionInput {
    publisherId: String
    sourceId: String
    storyId: String
    type: CorrectionType!
    description: String!
    issuedAt: String
    url: String
  }

  input EventMapInput {
    categories: [String!]
    severities: [AlertSeverity!]
    statuses: [String!]
    fromDate: String
    toDate: String
    bbox: [Float!]
    locatedOnly: Boolean
    limit: Int
  }

  type Query {
    searchStories(input: SearchStoriesInput): [Story!]!
    getStory(id: String!): Story
    getStoryVersions(storyId: String!): [StoryVersion!]!
    getTopic(id: String!): Topic
    getEvent(id: String!): Event
    getEntity(id: String!): Entity
    getSources(query: String): [Source!]!
    getStoryIntelligence(storyId: String!): StoryIntelligence
    getStoryWhatChanged(storyId: String!): StoryWhatChanged
    getStoryClaims(storyId: String!): [Claim!]!
    getStoryEvidence(storyId: String!): [Evidence!]!
    getStoryTimeline(storyId: String!): [StoryTimelineEvent!]!
    getStoryPerspectives(storyId: String!): [EditorialPerspective!]!
    getKnowledgeEdges(
      fromType: GraphNodeType
      fromId: String
      toType: GraphNodeType
      toId: String
      relation: GraphRelation
      limit: Int
    ): [KnowledgeEdge!]!
    getGraphNeighborhood(nodeType: GraphNodeType!, nodeId: String!, depth: Int, limit: Int): GraphTraversal!
    queryKnowledgeGraph(input: GraphQueryInput!): JSON!
    getAlertRules(enabled: Boolean): [AlertRule!]!
    getAlertRule(id: String!): AlertRule
    getAlertTriggers(limit: Int): [AlertTrigger!]!
    getIngestionFeeds: [IngestionFeed!]!
    getIngestionItems(
      feedId: String
      status: IngestionItemStatus
      query: String
      limit: Int
      offset: Int
    ): [IngestionItem!]!
    getBreakingNewsCandidates(limit: Int): [BreakingNewsCandidate!]!
    getSourceCorrections(publisherId: String, sourceId: String, storyId: String, limit: Int): [SourceCorrection!]!
    getPublisherIntelligence(publisherId: String!): PublisherIntelligence
    getBlockCatalog: JSON!
    getClaimEvidence(claimId: String!): ClaimEvidenceChain
    getSourceClaims(sourceId: String!): [Claim!]!
    getEntityStories(entityId: String!): [Story!]!
    getEventMap(input: EventMapInput): JSON!
    getEventHeatmap(input: EventMapInput, precision: Float): JSON!
  }

  type Mutation {
    createStory(input: CreateStoryInput!): Story!
    updateStory(id: String!, input: UpdateStoryInput!): Story!
    createStoryVersion(input: CreateStoryVersionInput!): StoryVersion!
    publishStory(id: String!): Story!
    unpublishStory(id: String!): Story!
    addStoryBlock(storyId: String!, block: StoryBlockInput!): StoryBlock!
    attachSource(storyId: String!, sourceId: String!): Story!
    createMedia(input: CreateMediaInput!): MediaAsset!
    createTopic(input: CreateTopicInput!): Topic!
    createEvent(input: CreateEventInput!): Event!
    createEntity(input: CreateEntityInput!): Entity!
    createClaim(storyId: String!, input: CreateClaimInput!): Claim!
    updateClaimStatus(storyId: String!, claimId: String!, input: UpdateClaimStatusInput!): Claim!
    deleteClaim(storyId: String!, claimId: String!): Boolean!
    addEvidence(storyId: String!, input: CreateEvidenceInput!): Evidence!
    deleteEvidence(storyId: String!, evidenceId: String!): Boolean!
    addTimelineEvent(storyId: String!, input: CreateTimelineEventInput!): StoryTimelineEvent!
    updateTimelineEvent(storyId: String!, eventId: String!, input: UpdateTimelineEventInput!): StoryTimelineEvent!
    deleteTimelineEvent(storyId: String!, eventId: String!): Boolean!
    addPerspective(storyId: String!, input: CreatePerspectiveInput!): EditorialPerspective!
    deletePerspective(storyId: String!, perspectiveId: String!): Boolean!
    addKnowledgeEdge(input: CreateKnowledgeEdgeInput!): KnowledgeEdge!
    deleteKnowledgeEdge(id: String!): Boolean!
    createAlertRule(input: CreateAlertRuleInput!): AlertRule!
    updateAlertRule(id: String!, input: UpdateAlertRuleInput!): AlertRule!
    deleteAlertRule(id: String!): Boolean!
    evaluateAlerts(resourceType: AlertResourceType!, resourceId: String!): EvaluateAlertsResult!
    createIngestionFeed(input: CreateIngestionFeedInput!): IngestionFeed!
    updateIngestionFeed(id: String!, input: UpdateIngestionFeedInput!): IngestionFeed!
    deleteIngestionFeed(id: String!): Boolean!
    ingestFeed(feedId: String!): IngestFeedResult!
    promoteIngestionItem(itemId: String!, input: PromoteIngestionItemInput): PromoteIngestionItemResult!
    addSourceCorrection(input: CreateSourceCorrectionInput!): SourceCorrection!
    deleteSourceCorrection(id: String!): Boolean!
  }

  type Subscription {
    storyUpdated(storyId: String): Story!
    jobUpdated(jobId: String): Job!
  }
`;
