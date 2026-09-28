import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { AuthService } from '@ai-news/auth';

describe('GraphQL API Integration Tests (Section 10 & 36)', () => {
  let app: FastifyInstance;
  let authHeaders: Record<string, string>;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    const token = AuthService.generateToken({
      id: 'usr_editor_gql',
      organizationId: 'org_default',
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write', 'news:publish', 'news:media'],
    });

    authHeaders = {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GraphiQL IDE & Schema Introspection', () => {
    it('serves GraphiQL explorer on GET /graphiql', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/graphiql',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('GraphiQL');
    });

    it('executes schema introspection query on POST /graphql', async () => {
      const query = `
        query {
          __schema {
            queryType { name }
            mutationType { name }
            subscriptionType { name }
          }
        }
      `;
      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'Content-Type': 'application/json' },
        payload: { query },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.__schema.queryType.name).toBe('Query');
      expect(json.data.__schema.mutationType.name).toBe('Mutation');
      expect(json.data.__schema.subscriptionType.name).toBe('Subscription');
    });
  });

  describe('GraphQL Queries (§36)', () => {
    it('executes searchStories query', async () => {
      const query = `
        query {
          searchStories(input: { limit: 5 }) {
            id
            title
            slug
            status
          }
        }
      `;
      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'Content-Type': 'application/json' },
        payload: { query },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.errors).toBeUndefined();
      expect(Array.isArray(json.data.searchStories)).toBe(true);
    });

    it('executes getSources query', async () => {
      const query = `
        query {
          getSources {
            id
            title
            publisher
            url
          }
        }
      `;
      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'Content-Type': 'application/json' },
        payload: { query },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.errors).toBeUndefined();
      expect(Array.isArray(json.data.getSources)).toBe(true);
    });
  });

  describe('GraphQL Mutations (§36)', () => {
    let createdStoryId: string;

    it('rejects unauthenticated createMedia mutation with authentication error', async () => {
      const mediaRes = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'Content-Type': 'application/json' },
        payload: {
          query: `
            mutation {
              createMedia(input: { mediaType: "chart", title: "Yield Curve", url: "https://storage.platform/charts/1.svg" }) {
                id
                type
                title
                url
              }
            }
          `,
        },
      });

      const mediaJson = JSON.parse(mediaRes.body);
      expect(mediaJson.errors).toBeDefined();
      expect(mediaJson.errors.length).toBeGreaterThan(0);
      expect(mediaJson.errors[0].message).toMatch(/Authentication required|UNAUTHENTICATED/i);
      expect(mediaJson.data?.createMedia).toBeFalsy();
    });

    it('rejects unauthenticated createStory mutation with authentication error', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'Content-Type': 'application/json' },
        payload: {
          query: `
            mutation {
              createStory(input: { title: "Unauthenticated Story", summary: "Should fail", articleType: technology }) {
                id
                title
              }
            }
          `,
        },
      });

      const json = JSON.parse(res.body);
      expect(json.errors).toBeDefined();
      expect(json.errors.length).toBeGreaterThan(0);
      expect(json.errors[0].message).toMatch(/Authentication required|UNAUTHENTICATED/i);
      expect(json.data?.createStory).toBeFalsy();
    });

    it('executes createStory mutation when authenticated', async () => {
      const mutation = `
        mutation CreateStory($input: CreateStoryInput!) {
          createStory(input: $input) {
            id
            title
            status
            articleType
            currentVersionNumber
          }
        }
      `;
      const variables = {
        input: {
          title: 'Quantum Leap in Semiconductor Lithography',
          summary: 'High numerical aperture EUV technology achieves 1nm process nodes.',
          articleType: 'technology',
          blocks: [
            {
              id: 'blk_1',
              blockType: 'heading',
              sortOrder: 0,
              data: { text: 'Sub-Atomic Scale Lithography', level: 1 },
            },
            {
              id: 'blk_2',
              blockType: 'paragraph',
              sortOrder: 1,
              data: { text: 'Next-generation semiconductor fabs deploy high-NA EUV optics.' },
            },
          ],
        },
      };

      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: { query: mutation, variables },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.errors).toBeUndefined();
      expect(json.data.createStory.id).toBeDefined();
      expect(json.data.createStory.status).toBe('DRAFT');
      createdStoryId = json.data.createStory.id;
    });

    it('executes getStory query for newly created story', async () => {
      const query = `
        query GetStory($id: String!) {
          getStory(id: $id) {
            id
            title
            summary
            status
            blocks {
              id
              blockType
              sortOrder
            }
          }
        }
      `;

      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'Content-Type': 'application/json' },
        payload: { query, variables: { id: createdStoryId } },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.errors).toBeUndefined();
      expect(json.data.getStory.id).toBe(createdStoryId);
      expect(json.data.getStory.blocks.length).toBe(2);
    });

    it('executes addStoryBlock mutation', async () => {
      const mutation = `
        mutation AddBlock($storyId: String!, $block: StoryBlockInput!) {
          addStoryBlock(storyId: $storyId, block: $block) {
            id
            blockType
            sortOrder
          }
        }
      `;
      const variables = {
        storyId: createdStoryId,
        block: {
          id: 'blk_stat_1',
          blockType: 'statistic',
          sortOrder: 2,
          data: {
            value: '1.2 nm',
            label: 'Gate Pitch Size',
            trend: 'down',
            context: '35% reduction compared to previous node',
          },
        },
      };

      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: { query: mutation, variables },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.errors).toBeUndefined();
      expect(json.data.addStoryBlock.blockType).toBe('statistic');
    });

    it('executes createStoryVersion mutation', async () => {
      const mutation = `
        mutation CreateVersion($input: CreateStoryVersionInput!) {
          createStoryVersion(input: $input) {
            id
            versionNumber
            title
            changeSummary
          }
        }
      `;
      const variables = {
        input: {
          storyId: createdStoryId,
          title: 'Quantum Leap in Semiconductor Lithography (Revised)',
          summary: 'Updated with validation from leading foundry consortium.',
          changeSummary: 'Added foundry benchmark metrics and statistic block.',
          blocks: [
            {
              id: 'blk_1',
              blockType: 'heading',
              sortOrder: 0,
              data: { text: 'Sub-Atomic Scale Lithography', level: 1 },
            },
          ],
        },
      };

      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: { query: mutation, variables },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.errors).toBeUndefined();
      expect(json.data.createStoryVersion.versionNumber).toBe(2);
      expect(json.data.createStoryVersion.changeSummary).toBe(
        'Added foundry benchmark metrics and statistic block.'
      );
    });

    it('executes publishStory and unpublishStory mutations', async () => {
      // Publish
      const publishMutation = `
        mutation Publish($id: String!) {
          publishStory(id: $id) {
            id
            status
            publishedAt
          }
        }
      `;
      const pubRes = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: { query: publishMutation, variables: { id: createdStoryId } },
      });
      expect(pubRes.statusCode).toBe(200);
      const pubJson = JSON.parse(pubRes.body);
      expect(pubJson.data.publishStory.status).toBe('PUBLISHED');

      // Unpublish
      const unpublishMutation = `
        mutation Unpublish($id: String!) {
          unpublishStory(id: $id) {
            id
            status
          }
        }
      `;
      const unpubRes = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: { query: unpublishMutation, variables: { id: createdStoryId } },
      });
      expect(unpubRes.statusCode).toBe(200);
      const unpubJson = JSON.parse(unpubRes.body);
      expect(unpubJson.data.unpublishStory.status).toBe('DRAFT');
    });

    it('executes createTopic, createEvent, and createEntity mutations', async () => {
      // Topic
      const topicRes = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: {
          query: `
            mutation {
              createTopic(input: { name: "Nanotechnology", description: "Sub-micron materials" }) {
                id
                name
                slug
              }
            }
          `,
        },
      });
      expect(topicRes.statusCode).toBe(200);
      const topicJson = JSON.parse(topicRes.body);
      expect(topicJson.data.createTopic.slug).toBe('nanotechnology');

      // Event
      const eventRes = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: {
          query: `
            mutation {
              createEvent(input: { title: "Global Lithography Summit 2026", summary: "Annual photonics keynote" }) {
                id
                title
                status
              }
            }
          `,
        },
      });
      expect(eventRes.statusCode).toBe(200);
      const eventJson = JSON.parse(eventRes.body);
      expect(eventJson.data.createEvent.title).toBe('Global Lithography Summit 2026');

      // Entity
      const entityRes = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: {
          query: `
            mutation {
              createEntity(input: { name: "ASML Holding", type: ORGANIZATION, description: "Photolithography manufacturer" }) {
                id
                name
                type
              }
            }
          `,
        },
      });
      expect(entityRes.statusCode).toBe(200);
      const entityJson = JSON.parse(entityRes.body);
      expect(entityJson.data.createEntity.name).toBe('ASML Holding');
    });

    it('executes createMedia mutation when authenticated', async () => {
      const mediaRes = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: {
          query: `
            mutation {
              createMedia(input: { mediaType: "chart", title: "Yield Curve", url: "https://storage.platform/charts/1.svg" }) {
                id
                type
                title
                url
              }
            }
          `,
        },
      });
      expect(mediaRes.statusCode).toBe(200);
      const mediaJson = JSON.parse(mediaRes.body);
      expect(mediaJson.errors).toBeUndefined();
      expect(mediaJson.data.createMedia.title).toBe('Yield Curve');
    });
  });
});
