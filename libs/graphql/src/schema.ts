export const typeDefs = `#graphql
  scalar JSON
  scalar DateTime

  enum StoryStatus {
    DRAFT
    IN_REVIEW
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

  type Query {
    searchStories(input: SearchStoriesInput): [Story!]!
    getStory(id: String!): Story
    getStoryVersions(storyId: String!): [StoryVersion!]!
    getTopic(id: String!): Topic
    getEvent(id: String!): Event
    getEntity(id: String!): Entity
    getSources(query: String): [Source!]!
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
  }

  type Subscription {
    storyUpdated(storyId: String): Story!
    jobUpdated(jobId: String): Job!
  }
`;
