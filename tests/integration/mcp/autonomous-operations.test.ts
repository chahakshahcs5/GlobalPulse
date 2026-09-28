import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DatabaseService } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { registerStoryTools } from '../../../apps/mcp-server/src/tools/story.tools.js';
import { registerAnalyticsTools } from '../../../apps/mcp-server/src/tools/analytics.tools.js';
import { registerSchedulingTools } from '../../../apps/mcp-server/src/tools/scheduling.tools.js';
import { registerNotificationTools } from '../../../apps/mcp-server/src/tools/notification.tools.js';
import { registerUserTools } from '../../../apps/mcp-server/src/tools/user.tools.js';

function parseJson<T = Record<string, unknown>>(result: unknown): T {
  const content = (result as { content: Array<{ type?: string; text?: string }> }).content;
  return JSON.parse(content[0]?.text || '{}');
}

describe('Autonomous AI Newsroom Operations via MCP (Integration Tests)', () => {
  let db: DatabaseService;
  let server: McpServer;
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;
  let activePrincipal: AuthenticatedPrincipal;

  beforeAll(async () => {
    db = new DatabaseService({ memory: true });
    activePrincipal = {
      id: 'usr_gemini_lead_ai',
      organizationId: 'org_default',
      role: 'admin',
      clientType: 'gemini',
      scopes: [
        'news:read',
        'news:search',
        'news:write',
        'news:publish',
        'news:media',
        'news:sources',
        'news:topics',
        'news:admin',
      ],
    };

    server = new McpServer({
      name: 'autonomous-ai-newsroom-mcp',
      version: '1.0.0',
    });

    const getPrincipal = () => activePrincipal;

    registerStoryTools(server, db, getPrincipal);
    registerAnalyticsTools(server, db, getPrincipal);
    registerSchedulingTools(server, db, getPrincipal);
    registerNotificationTools(server, db, getPrincipal);
    registerUserTools(server, db, getPrincipal);

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: 'ai-lead-agent', version: '1.0.0' }, { capabilities: {} });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  let createdStoryId: string;

  it('creates a news story via MCP and queries real-time analytics', async () => {
    const createRes = await client.callTool({
      name: 'create_story',
      arguments: {
        title: 'Global Renewable Capacity Surpasses Coal for the First Time',
        summary: 'Milestone recorded in global electricity generation data.',
        articleType: 'science',
        blocks: [
          {
            id: 'b1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'Solar and wind accounted for 34% of global electrical generation this quarter.',
            },
          },
        ],
      },
    });

    const storyData = parseJson<{ storyId: string }>(createRes);
    expect(storyData.storyId).toBeDefined();
    createdStoryId = storyData.storyId;

    // AI queries story analytics via MCP
    const analyticsRes = await client.callTool({
      name: 'get_story_analytics',
      arguments: { story_id: createdStoryId },
    });

    const analytics = parseJson<{ storyId: string; viralityScore: number; viewsCount: number }>(
      analyticsRes
    );
    expect(analytics.storyId).toBe(createdStoryId);
    expect(analytics.viewsCount).toBeGreaterThan(0);
    expect(analytics.viralityScore).toBeGreaterThanOrEqual(0);
  });

  it('queries newsroom metrics and trending stories via MCP', async () => {
    const metricsRes = await client.callTool({
      name: 'get_newsroom_metrics',
      arguments: {},
    });

    const metrics = parseJson<{ totalStories: number; activeCategoriesCount: number }>(metricsRes);
    expect(metrics.totalStories).toBeGreaterThanOrEqual(1);

    const trendingRes = await client.callTool({
      name: 'get_trending_stories',
      arguments: { limit: 5 },
    });

    const trending = parseJson<{ count: number; trending: unknown[] }>(trendingRes);
    expect(trending.trending).toBeDefined();
  });

  it('schedules an approved story for automated publication via MCP', async () => {
    const futureTime = new Date(Date.now() + 7200000).toISOString(); // 2 hours from now

    const scheduleRes = await client.callTool({
      name: 'schedule_story_publish',
      arguments: {
        story_id: createdStoryId,
        publish_at: futureTime,
      },
    });

    const scheduled = parseJson<{ story_id: string; status: string; scheduled_publish_at: string }>(
      scheduleRes
    );
    expect(scheduled.story_id).toBe(createdStoryId);
    expect(scheduled.status).toBe('SCHEDULED');
    expect(scheduled.scheduled_publish_at).toBe(futureTime);

    const listRes = await client.callTool({
      name: 'list_scheduled_stories',
      arguments: {},
    });

    const list = parseJson<{ count: number; scheduled_stories: Array<{ id: string }> }>(listRes);
    expect(list.count).toBeGreaterThanOrEqual(1);
    expect(list.scheduled_stories.some((s) => s.id === createdStoryId)).toBe(true);
  });

  it('broadcasts breaking news alerts and editorial flags via MCP', async () => {
    const breakingRes = await client.callTool({
      name: 'broadcast_breaking_news',
      arguments: {
        story_id: createdStoryId,
        headline: 'BREAKING: Global Renewable Power Surpasses Coal Milestone',
        urgency: 'urgent',
      },
    });

    const breaking = parseJson<{ alert_id: string; severity: string; headline: string }>(
      breakingRes
    );
    expect(breaking.alert_id).toBeDefined();
    expect(breaking.severity).toBe('urgent');

    const editorialRes = await client.callTool({
      name: 'send_editorial_alert',
      arguments: {
        title: 'Fact Check Verification Alert',
        message: 'IEA verification pending on regional hydro data.',
        story_id: createdStoryId,
        severity: 'warning',
      },
    });

    const alert = parseJson<{ alert_id: string; title: string; type: string }>(editorialRes);
    expect(alert.alert_id).toBeDefined();
    expect(alert.type).toBe('fact_check_flag');

    const notifListRes = await client.callTool({
      name: 'list_editorial_notifications',
      arguments: { limit: 10 },
    });

    const notifs = parseJson<{ count: number; notifications: unknown[] }>(notifListRes);
    expect(notifs.count).toBeGreaterThanOrEqual(2);
  });

  it('governs newsroom staff and reassigns user roles via MCP', async () => {
    const listUsersRes = await client.callTool({
      name: 'list_newsroom_users',
      arguments: {},
    });

    const usersData = parseJson<{ count: number; users: Array<{ id: string; role: string }> }>(
      listUsersRes
    );
    expect(usersData.count).toBeGreaterThanOrEqual(1);

    // AI agent invites a specialized investigative reporter
    const inviteRes = await client.callTool({
      name: 'invite_newsroom_user',
      arguments: {
        name: 'DeepSeek Research Agent',
        email: 'deepseek@ai.globalpulse.news',
        role: 'ai_agent',
        bio: 'Reasoning and source verification agent.',
      },
    });

    const invited = parseJson<{ user_id: string; email: string; role: string }>(inviteRes);
    expect(invited.email).toBe('deepseek@ai.globalpulse.news');
    expect(invited.role).toBe('ai_agent');

    // AI admin updates a staff role
    const roleRes = await client.callTool({
      name: 'assign_user_role',
      arguments: {
        user_id: invited.user_id,
        role: 'editor',
      },
    });

    const updatedRole = parseJson<{ user_id: string; new_role: string }>(roleRes);
    expect(updatedRole.new_role).toBe('editor');
  });
});
