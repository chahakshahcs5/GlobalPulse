/**
 * Multi-Agent Remote MCP End-to-End Demonstration Script
 * Demonstrates:
 * 1. AI Agent (Gemini Spark) discovers OAuth protected resource metadata.
 * 2. Agent connects to Remote MCP Server over JSON-RPC 2.0.
 * 3. Agent searches existing editorial coverage via MCP (`search_stories`).
 * 4. Agent registers a new verified primary source (`create_source`).
 * 5. Agent creates version 2 with a WhatChangedBlock, D3 ChartBlock, and Citation.
 * 6. Agent publishes the story via MCP (`publish_story`).
 * 7. Background workers asynchronously process media variants, search index, and audio briefing.
 * 8. Verification across Database, Audit logs, Observability metrics, Web, and Mobile.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { registerSearchTools } from '../apps/mcp-server/src/tools/search.tools';
import { registerStoryTools } from '../apps/mcp-server/src/tools/story.tools';
import { registerBlockTools } from '../apps/mcp-server/src/tools/block.tools';
import { registerMediaTools } from '../apps/mcp-server/src/tools/media.tools';
import { registerSourceTools } from '../apps/mcp-server/src/tools/source.tools';
import { registerTaxonomyTools } from '../apps/mcp-server/src/tools/taxonomy.tools';
import { registerJobTools } from '../apps/mcp-server/src/tools/job.tools';
import { registerResources } from '../apps/mcp-server/src/resources/index';
import { registerPrompts } from '../apps/mcp-server/src/prompts/index';
import { defaultQueue } from '@ai-news/jobs';
import { WorkerService } from '../apps/worker/src/worker.service';
import { metrics } from '@ai-news/observability';
import { offlineStorage } from '../apps/mobile/src/services/storage';

export async function runEndToEndScenario() {
  console.log('\n=============================================================');
  console.log('🚀 RUNNING END-TO-END MULTI-AGENT PUBLISHING DEMONSTRATION');
  console.log('   "The Application is Not the AI"');
  console.log('=============================================================\n');

  // Initialize Core Services & Database
  const db = new DatabaseService();
  const storyService = new StoryService(db);
  new WorkerService(defaultQueue);

  // Authenticated Principal representing Gemini Spark
  const activePrincipal: AuthenticatedPrincipal = {
    id: 'usr_spark_agent',
    organizationId: 'org_default',
    role: 'ai_agent',
    clientType: 'gemini_spark',
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
    aiMetadata: {
      model: 'gemini-spark',
      provider: 'google',
    },
  };

  // Stand up MCP Server instance
  const server = new McpServer({
    name: 'ai-news-platform-mcp-demo',
    version: '1.0.0',
  });
  const getPrincipal = () => activePrincipal;

  registerSearchTools(server, db, getPrincipal);
  registerStoryTools(server, db, getPrincipal);
  registerBlockTools(server, db, getPrincipal);
  registerMediaTools(server, db, getPrincipal);
  registerSourceTools(server, db, getPrincipal);
  registerTaxonomyTools(server, db, getPrincipal);
  registerJobTools(server, db, getPrincipal);
  registerResources(server, db, getPrincipal);
  registerPrompts(server);

  // Link Client and Server over JSON-RPC 2.0 transport
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'gemini-spark-client', version: '1.0.0' }, { capabilities: {} });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  // 1. External AI Discovers RFC 8414 OAuth Metadata
  console.log('📡 [Step 1] AI Agent discovers RFC 8414 OAuth Protected Resource Metadata...');
  const oauthMeta = AuthService.getProtectedResourceMetadata('https://api.globalpulse.news');
  console.log('   Resource:', oauthMeta.resource);
  console.log('   Auth Server:', oauthMeta.authorization_servers[0]);
  console.log('   Required Scopes:', oauthMeta.scopes_supported.join(', '));

  // 2. Pre-seed Story Version 1 (Initial breaking dispatch)
  console.log('\n📰 [Step 2] Pre-seeding Story Version 1 in Database...');
  const storyV1 = await storyService.createStory(
    {
      title: 'BRICS Expansion 2026: Preliminary Talks Begin in New Delhi',
      summary: 'Delegates convene to discuss accession frameworks for emerging partner economies.',
      articleType: 'breaking_news',
      blocks: [
        {
          id: 'blk_intro',
          blockType: 'paragraph',
          sortOrder: 0,
          data: {
            text: 'NEW DELHI — High-level ministerial delegations from BRICS nations met this morning for preliminary consultations on expanded trade settlements.',
            format: 'markdown',
          },
        },
      ],
    },
    {
      organizationId: 'org_default',
      authorId: 'usr_spark_agent',
      clientType: 'gemini_spark',
      createdVia: 'mcp',
    }
  );
  await storyService.publishStory(storyV1.id, {
    organizationId: 'org_default',
    authorId: 'usr_spark_agent',
    clientType: 'gemini_spark',
    createdVia: 'mcp',
  });
  console.log(`   Created story: "${storyV1.title}" (ID: ${storyV1.id}, v${storyV1.currentVersionNumber})`);

  // 3. Agent Searches Existing Stories via Remote MCP
  console.log('\n🔍 [Step 3] Gemini Spark calls MCP [search_stories] to inspect current coverage...');
  const searchCall = await client.callTool({
    name: 'search_stories',
    arguments: { query: 'BRICS', limit: 5 },
  });
  const searchContent = searchCall.content as Array<{ type: string; text: string }>;
  const searchData = JSON.parse(searchContent[0]?.text || '{}');
  const matchedStories = (searchData.items as Array<Record<string, unknown>>) || [];
  console.log(`   MCP returned ${matchedStories.length} matching stories.`);
  const targetStory = matchedStories[0];
  const targetStoryId = (targetStory?.id as string) || (targetStory?.storyId as string) || storyV1.id;
  console.log(`   Target story found: "${targetStory?.title || 'BRICS'}" (ID: ${targetStoryId}, v${targetStory?.currentVersionNumber ?? 1})`);

  // 4. Agent Discovers New Facts & Registers Primary Source via MCP
  console.log('\n📚 [Step 4] Agent registers verified primary source via MCP [create_source]...');
  const sourceCall = await client.callTool({
    name: 'create_source',
    arguments: {
      url: 'https://mea.gov.in/brics-2026-declaration.htm',
      title: 'Official Declaration: 2026 BRICS New Delhi Summit Accord',
      publisher: 'Ministry of External Affairs',
      author: 'Summit Secretariat',
      sourceType: 'OFFICIAL_DOCUMENT',
      permissibleExcerpt: 'The member states formally adopt the 2026 New Delhi multilateral clearing mechanism.',
    },
  });
  const sourceContent = sourceCall.content as Array<{ type: string; text: string }>;
  const sourceData = JSON.parse(sourceContent[0]?.text || '{}');
  const sourceId = sourceData.sourceId;
  console.log(`   Source created via MCP: ID [${sourceId}]`);

  // Attach Source via MCP
  await client.callTool({
    name: 'attach_source',
    arguments: {
      storyId: targetStoryId,
      sourceId,
    },
  });
  console.log(`   Attached source [${sourceId}] to story [${targetStoryId}] via MCP`);

  // 5. Agent Creates Version 2 with WhatChangedBlock and D3 Chart via MCP
  console.log('\n✍️  [Step 5] Agent updates coverage with WhatChangedBlock and D3 Chart via MCP [create_story_version]...');
  const versionCall = await client.callTool({
    name: 'create_story_version',
    arguments: {
      storyId: targetStoryId,
      title: 'BRICS 2026 Accord Signed: 4 New Members Inducted in New Delhi',
      summary: 'Summit concludes with formal accession treaties and a $41T joint settlement pact.',
      changeSummary: 'Added finalized member accession details, D3 economic chart, and official treaty citations.',
      blocks: [
        {
          id: 'blk_what_changed_v2',
          blockType: 'what_changed',
          sortOrder: 0,
          data: {
            previousVersionNumber: 1,
            updatedAt: new Date().toISOString(),
            items: [
              {
                changeType: 'added',
                description: 'Full text of New Delhi Declaration accession protocol ratified by 10 member states.',
              },
              {
                changeType: 'updated',
                description: 'Updated combined economic output projections to $41 Trillion PPP.',
              },
            ],
          },
        },
        {
          id: 'blk_lead_p',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'NEW DELHI — In a landmark closing session, leaders formally signed accession documents expanding the multilateral bloc, accompanied by a new multilateral trade clearing framework.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_d3_chart',
          blockType: 'chart',
          sortOrder: 2,
          data: {
            chartType: 'bar',
            title: 'Combined Economic Output ($ Trillion PPP)',
            xAxis: { key: 'year', label: 'Fiscal Year', type: 'category' },
            yAxis: { label: 'Trillion USD' },
            series: [{ name: 'Economic Output', key: 'output', color: '#3b82f6' }],
            values: [
              { year: '2022', output: 28 },
              { year: '2024', output: 34 },
              { year: '2026 Proj', output: 41 },
            ],
            sourceAttribution: 'World Bank & BRICS Summit Secretariat',
          },
        },
      ],
    },
  });
  const versionContent = versionCall.content as Array<{ type: string; text: string }>;
  const versionData = JSON.parse(versionContent[0]?.text || '{}');
  console.log(`   Updated story via MCP to Version ${versionData.versionNumber}`);

  // 6. Agent Publishes the Story via MCP
  console.log('\n📢 [Step 6] Agent calls MCP [publish_story] to broadcast to Web & 4K Display Wall...');
  const publishCall = await client.callTool({
    name: 'publish_story',
    arguments: { storyId: targetStoryId },
  });
  const publishContent = publishCall.content as Array<{ type: string; text: string }>;
  const publishData = JSON.parse(publishContent[0]?.text || '{}');
  const publishedStory = await storyService.getStory(publishData.storyId);
  console.log(`   Story status is now: [${publishedStory.status}], version: [${publishedStory.currentVersionNumber}]`);

  // Close MCP Client & Server sessions
  await client.close();
  await server.close();

  // 7. Background Worker Processes Async Jobs
  console.log('\n⚙️  [Step 7] Background Worker processes asynchronous post-publication tasks...');
  const searchJob = await defaultQueue.enqueue('search.index_story', {
    storyId: publishedStory.id,
    versionNumber: publishedStory.currentVersionNumber,
    title: publishedStory.title,
    summary: publishedStory.summary,
    textContent: 'BRICS 2026 Accord Signed New Delhi Multilateral Trade $41T',
  });
  const mediaJob = await defaultQueue.enqueue('media.process_variant', {
    mediaId: 'med_brics_hero',
    sourceUrl: 'https://images.globalpulse.news/brics2026.jpg',
    formats: ['webp', 'avif'],
    dimensions: [
      { width: 1920, height: 1080, suffix: '1080p' },
      { width: 3840, height: 2160, suffix: '4k' },
    ],
  });
  const audioJob = await defaultQueue.enqueue('audio.generate_briefing', {
    storyId: publishedStory.id,
    voice: 'news_anchor_f',
    scriptText: `${publishedStory.title}. ${publishedStory.summary}`,
  });

  // Drain worker jobs
  await defaultQueue.drain();
  const searchRes = searchJob.result as Record<string, unknown> | undefined;
  const mediaRes = mediaJob.result as Record<string, unknown> | undefined;
  const audioRes = audioJob.result as Record<string, unknown> | undefined;
  console.log(`   ✓ Search index job completed: status=[${searchJob.status}], tokens=[${searchRes?.indexedTokens}]`);
  console.log(`   ✓ Media variants job completed: status=[${mediaJob.status}], variants=[${mediaRes?.totalVariants}]`);
  console.log(`   ✓ Audio briefing job completed: status=[${audioJob.status}], duration=[${audioRes?.durationSeconds}s]`);

  // 8. Mobile App Offline Caching Verification
  console.log('\n📱 [Step 8] Mobile App reads published story and saves to offline cache...');
  offlineStorage.saveStory({
    id: publishedStory.id,
    slug: publishedStory.slug,
    title: publishedStory.title,
    summary: publishedStory.summary,
    articleType: publishedStory.articleType,
    currentVersionNumber: publishedStory.currentVersionNumber,
    blocks: publishedStory.blocks,
    savedAt: new Date().toISOString(),
    readStatus: false,
  });
  const cachedStory = offlineStorage.getStory(publishedStory.id);
  console.log(`   ✓ Mobile cached story: "${cachedStory?.title}" (v${cachedStory?.currentVersionNumber})`);

  // 9. Observability & Audit Verification
  console.log('\n📊 [Step 9] Observability & Audit Verification:');
  const auditLogs = await db.audit.query('org_default');
  const agentLogs = auditLogs.filter((a) => a.clientType === 'gemini_spark');
  console.log(`   ✓ Total audit log entries recorded for gemini_spark: ${agentLogs.length}`);
  const counterVal = metrics.getCounterValue('worker_jobs_completed_total');
  console.log(`   ✓ Prometheus metrics counter worker_jobs_completed_total: ${counterVal}`);

  console.log('\n=============================================================');
  console.log('✅ MULTI-AGENT E2E PUBLISHING SCENARIO COMPLETED SUCCESSFULLY');
  console.log('=============================================================\n');

  return {
    story: publishedStory,
    auditCount: agentLogs.length,
    jobsCompleted: counterVal,
    sourceId,
  };
}

if (require.main === module) {
  runEndToEndScenario().catch((err) => {
    console.error('Scenario failed:', err);
    process.exit(1);
  });
}
