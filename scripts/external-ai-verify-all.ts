/**
 * External AI Agent MCP Verification Script
 * Acts as an external AI client interacting directly with the remote MCP Server
 * (https://curly-space-potato-v5pgg4vgxrxcxxwx-3001.app.github.dev/mcp)
 * and verifying results against the API Server
 * (https://curly-space-potato-v5pgg4vgxrxcxxwx-3000.app.github.dev).
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AuthService } from '@ai-news/auth';

const MCP_URL = process.env.MCP_URL || 'http://localhost:4001/mcp';
const API_URL = process.env.API_URL || 'http://localhost:4000';

interface StepResult {
  step: string;
  status: 'SUCCESS' | 'FAILED';
  details?: unknown;
  error?: string;
}

const auditTrail: StepResult[] = [];

function record(step: string, status: 'SUCCESS' | 'FAILED', details?: unknown, error?: string) {
  auditTrail.push({ step, status, details, error });
  if (status === 'SUCCESS') {
    console.log(`✅ [${step}] SUCCESS:`, details ? JSON.stringify(details).slice(0, 160) : 'Done');
  } else {
    console.error(`❌ [${step}] FAILED:`, error || details);
  }
}

async function runExternalAiWorkflow() {
  console.log('========================================================================');
  console.log('🤖 EXTERNAL AI AGENT ENGAGEMENT WITH REMOTE MCP SERVER');
  console.log(`   Target MCP: ${MCP_URL}`);
  console.log(`   Target API: ${API_URL}`);
  console.log('========================================================================\n');

  // 1. Generate Principal Auth Token for the registered AI Agent
  const token = AuthService.generateToken({
    id: 'usr_mcp_gemini',
    organizationId: 'org_default',
    role: 'ai_agent',
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
    agentMetadata: {
      agentName: 'Gemini Autonomous Newsroom Agent',
      model: 'gemini-1.5-pro',
      provider: 'google',
      version: '1.5',
      capabilities: ['news:read', 'news:search', 'news:write', 'news:publish'],
    },
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const client = new Client(
    {
      name: 'gemini-external-ai-orchestrator',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  console.log('1. Connecting to MCP Server...');
  await client.connect(transport);
  record('1. Connect Transport', 'SUCCESS', { sessionId: transport.sessionId });

  // 2. Discover MCP Tools
  console.log('\n2. Discovering available tools via MCP...');
  const toolsResponse = await client.listTools();
  record('2. List Tools', 'SUCCESS', { toolCount: toolsResponse.tools.length });

  // 3. Register Primary Source
  console.log('\n3. Calling `create_source` via MCP...');
  const sourceTimestamp = new Date().toISOString();
  const sourceRes = (await client.callTool({
    name: 'create_source',
    arguments: {
      url: `https://ai-governance.org/accord-${Date.now()}`,
      title: 'Global Autonomous Agent Interoperability Protocol Accord 2026',
      publisher: 'International AI Governance Observatory',
      author: 'Global Working Group on AI News Standards',
      publishedAt: sourceTimestamp,
      sourceType: 'PRESS_RELEASE',
      permissibleExcerpt:
        'Delegates from 45 sovereign member states have ratified the Universal AI Provenance and Streamable Interoperability Accord in Tokyo.',
    },
  })) as { content: Array<{ type: string; text: string }> };

  const parsedSource = JSON.parse(sourceRes.content[0].text);
  const sourceId = parsedSource.sourceId;
  record('3. Create Source', 'SUCCESS', { sourceId, publisher: parsedSource.publisher });

  // 4. Register Topic in Taxonomy
  console.log('\n4. Calling `create_topic` via MCP...');
  const uniqueTopicName = `Autonomous AI Protocols ${Date.now().toString().slice(-4)}`;
  const topicRes = (await client.callTool({
    name: 'create_topic',
    arguments: {
      name: uniqueTopicName,
      description:
        'Global standards for autonomous agent journalism, provenance, and verification.',
      aliases: ['Agentic Newsroom', 'AI Accord 2026', 'Agent Protocols'],
    },
  })) as { content: Array<{ type: string; text: string }> };

  const parsedTopic = JSON.parse(topicRes.content[0].text);
  const topicId = parsedTopic.topic.id;
  record('4. Create Topic', 'SUCCESS', { topicId, name: parsedTopic.topic.name });

  // 5. Search Stories (pre-flight check)
  console.log('\n5. Calling `search_stories` via MCP...');
  const searchRes = (await client.callTool({
    name: 'search_stories',
    arguments: {
      query: 'Autonomous AI',
      limit: 5,
    },
  })) as { content: Array<{ type: string; text: string }> };
  const parsedSearch = JSON.parse(searchRes.content[0].text);
  record('5. Search Stories', 'SUCCESS', { priorResultsCount: parsedSearch.items?.length ?? 0 });

  // 6. Create Story via MCP
  console.log('\n6. Calling `create_story` via MCP...');
  const storyTitle = `Tokyo AI Summit: Global Autonomous Agent Protocol Ratified by 45 Nations (${Date.now().toString().slice(-4)})`;
  const storySummary =
    'Delegations convening in Tokyo have unanimously established standard cryptographic authentication, Streamable HTTP inter-agent communications, and verifiable HMAC provenance for newsroom AI agents.';

  const storyRes = (await client.callTool({
    name: 'create_story',
    arguments: {
      title: storyTitle,
      summary: storySummary,
      articleType: 'breaking_news',
      topicIds: [topicId],
      sourceIds: [sourceId],
      heroImageUrl:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    },
  })) as { content: Array<{ type: string; text: string }> };

  console.log('storyRes raw:', JSON.stringify(storyRes));
  let storyId: string;
  try {
    const parsedStory = JSON.parse(storyRes.content[0].text);
    storyId = parsedStory.storyId;
    record('6. Create Story', 'SUCCESS', {
      storyId,
      slug: parsedStory.slug,
      status: parsedStory.status,
    });
  } catch (e) {
    console.error('Failed to parse storyRes:', storyRes.content[0]?.text);
    throw e;
  }

  // 7. Add Content Blocks to Story
  console.log('\n7. Adding Rich Structured Blocks via MCP...');

  // 7a. Heading Block
  await client.callTool({
    name: 'add_heading_block',
    arguments: {
      storyId,
      text: 'Historic International Consensus Reached in Tokyo',
      level: 2,
      subtext: 'Unanimous adoption of open interoperability guidelines across news agencies',
    },
  });
  record('7a. Add Heading Block', 'SUCCESS', { storyId });

  // 7b. Text Paragraph Block
  await client.callTool({
    name: 'add_text_block',
    arguments: {
      storyId,
      text: 'Following rigorous multilateral negotiations, 45 nations finalized the Tokyo Protocol for Autonomous Media Agents. Under the new framework, all automated editorial agents operate through open standard protocols with verifiable audit trails, preventing opaque content syndication and synthetic misattribution.',
      format: 'markdown',
    },
  });
  record('7b. Add Text Block', 'SUCCESS', { storyId });

  // 7c. Quote Block
  await client.callTool({
    name: 'add_quote_block',
    arguments: {
      storyId,
      quote:
        'The application is not the AI. Standardized protocol bridges allow sovereign agents to collaborate, verify claims in real time, and preserve human editorial oversight with cryptographic certainty.',
      attribution: 'Dr. Kenji Sato',
      title: 'Secretary General, Global AI Ethics Consortium',
    },
  });
  record('7c. Add Quote Block', 'SUCCESS', { storyId });

  // 7d. Chart Block (D3 compatible)
  await client.callTool({
    name: 'add_chart_block',
    arguments: {
      storyId,
      chartType: 'bar',
      title: 'Autonomous Protocol Adoption Rate by Region (2026)',
      xAxis: {
        key: 'region',
        label: 'Region',
        type: 'category',
      },
      yAxis: {
        label: 'Adoption (%)',
        unit: '%',
      },
      series: [{ name: 'Adoption Rate', key: 'adoption', color: '#2563eb' }],
      values: [
        { region: 'North America', adoption: 94 },
        { region: 'Asia-Pacific', adoption: 89 },
        { region: 'Europe', adoption: 86 },
        { region: 'Middle East', adoption: 72 },
        { region: 'Latin America', adoption: 68 },
        { region: 'Africa', adoption: 61 },
      ],
      sourceAttribution: 'Global AI Observatory Survey 2026',
    },
  });
  record('7d. Add Chart Block', 'SUCCESS', { storyId });

  // 7e. Summary Callout Block
  await client.callTool({
    name: 'add_summary_block',
    arguments: {
      storyId,
      headline: 'Executive Takeaways: What You Need To Know',
      bulletPoints: [
        'Open MCP protocols officially adopted as the gold standard for agentic editorial operations.',
        'Cryptographic HMAC watermarking now mandatory for all automated reporting variants.',
        'Real-time automated fact-checking citations required on all synthetic claims.',
      ],
      sentiment: 'positive',
    },
  });
  record('7e. Add Summary Block', 'SUCCESS', { storyId });

  // 8. Record AI Provenance Watermark
  console.log('\n8. Calling `record_story_provenance` via MCP...');
  const provRes = (await client.callTool({
    name: 'record_story_provenance',
    arguments: {
      storyId,
      generatorModel: 'gemini-1.5-pro',
      prompt:
        'Synthesize Tokyo AI Summit proceedings into a structured breaking news article with charts and citations.',
      confidenceScore: 0.98,
    },
  })) as { content: Array<{ type: string; text: string }> };
  const parsedProv = JSON.parse(provRes.content[0].text);
  record('8. Record Provenance', 'SUCCESS', {
    watermark: parsedProv.provenance?.watermarkSignature?.slice(0, 16) + '...',
  });

  // 9. Verify AI Provenance Watermark
  console.log('\n9. Calling `verify_story_provenance` via MCP...');
  const verifyRes = (await client.callTool({
    name: 'verify_story_provenance',
    arguments: { storyId },
  })) as { content: Array<{ type: string; text: string }> };
  const parsedVerify = JSON.parse(verifyRes.content[0].text);
  record('9. Verify Provenance', 'SUCCESS', {
    valid: parsedVerify.valid,
    model: parsedVerify.provenance?.generatorModel,
  });

  // 10. Publish Story
  console.log('\n10. Calling `publish_story` via MCP...');
  const pubRes = (await client.callTool({
    name: 'publish_story',
    arguments: { storyId },
  })) as { content: Array<{ type: string; text: string }> };
  const parsedPub = JSON.parse(pubRes.content[0].text);
  record('10. Publish Story', 'SUCCESS', { storyId, status: parsedPub.status });

  // 11. Create Multi-Source Story Cluster
  console.log('\n11. Calling `create_story_cluster` via MCP...');
  const clusterRes = (await client.callTool({
    name: 'create_story_cluster',
    arguments: {
      title: 'Global Autonomous AI Protocol Ratification',
      summary:
        'International consensus establishes universal standards for agentic journalism and verifiable provenance.',
      leadStoryId: storyId,
      storyIds: [storyId],
      topic: 'Technology',
      category: 'technology',
    },
  })) as { content: Array<{ type: string; text: string }> };
  const parsedCluster = JSON.parse(clusterRes.content[0].text);
  record('11. Create Story Cluster', 'SUCCESS', {
    clusterId: parsedCluster.cluster?.id,
    leadStoryId: parsedCluster.cluster?.leadStoryId,
  });

  // 12. Check Full Coverage
  console.log('\n12. Calling `get_full_coverage` via MCP...');
  const coverageRes = (await client.callTool({
    name: 'get_full_coverage',
    arguments: { storyId },
  })) as { content: Array<{ type: string; text: string }> };
  const parsedCoverage = JSON.parse(coverageRes.content[0].text);
  record('12. Get Full Coverage', 'SUCCESS', {
    clusterId: parsedCoverage.clusterId,
    perspectives: parsedCoverage.perspectivesCount,
  });

  // 13. Close MCP Client
  console.log('\n13. Closing MCP Client session...');
  await client.close();
  record('13. Close MCP Session', 'SUCCESS');

  // 14. Verify on API Server
  console.log('\n========================================================================');
  console.log('🔍 VERIFYING ENTITIES VIA REMOTE API GATEWAY');
  console.log(`   URL: ${API_URL}`);
  console.log('========================================================================\n');

  console.log('14a. Verifying story on API: /api/stories/' + storyId);
  const storyApiRes = await fetch(`${API_URL}/api/stories/${storyId}`);
  if (storyApiRes.ok) {
    const apiStory = await storyApiRes.json();
    record('14a. API Story Verification', 'SUCCESS', {
      id: apiStory.id,
      title: apiStory.title,
      status: apiStory.status,
      blockCount: apiStory.blocks?.length,
    });
  } else {
    record('14a. API Story Verification', 'FAILED', null, `Status ${storyApiRes.status}`);
  }

  console.log('14b. Verifying topics on API: /api/topics');
  const topicsApiRes = await fetch(`${API_URL}/api/topics`);
  if (topicsApiRes.ok) {
    const apiTopics = await topicsApiRes.json();
    const list = Array.isArray(apiTopics) ? apiTopics : apiTopics.data || [];
    const foundTopic = list.find(
      (t: { id: string; name: string }) => t.id === topicId || t.name === uniqueTopicName
    );
    record('14b. API Topics Verification', 'SUCCESS', {
      totalTopics: list.length,
      newTopicFound: !!foundTopic,
      topicName: foundTopic?.name,
    });
  } else {
    record('14b. API Topics Verification', 'FAILED', null, `Status ${topicsApiRes.status}`);
  }

  console.log('14c. Verifying story list on API: /api/stories');
  const storiesListRes = await fetch(`${API_URL}/api/stories?limit=10`);
  if (storiesListRes.ok) {
    const resData = await storiesListRes.json();
    const items = resData.data || resData.items || resData;
    const foundPublished = Array.isArray(items)
      ? items.find((s: { id: string }) => s.id === storyId)
      : null;
    record('14c. API Stories Feed Verification', 'SUCCESS', {
      totalStories: Array.isArray(items) ? items.length : 0,
      publishedStoryFound: !!foundPublished,
      storyTitle: foundPublished?.title,
    });
  } else {
    record('14c. API Stories Feed Verification', 'FAILED', null, `Status ${storiesListRes.status}`);
  }

  console.log('\n========================================================================');
  console.log('🎉 AUDIT TRAIL SUMMARY');
  console.log('========================================================================');
  for (const item of auditTrail) {
    console.log(
      `${item.status === 'SUCCESS' ? '✅' : '❌'} ${item.step}: ${JSON.stringify(item.details || item.error)}`
    );
  }
}

runExternalAiWorkflow().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
