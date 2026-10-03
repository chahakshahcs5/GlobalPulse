import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2]?.trim();
      }
    }
  }
}
loadEnvFile();

import { DatabaseService } from '../src/database.service';
import { prismaManager } from '../src/client/prisma-client';
import { logger } from '@ai-news/observability';
import { CANONICAL_CATEGORIES, BASELINE_NAV_TABS } from '@ai-news/schemas';
import {
  baselineUsers,
  baselineTopics,
  baselineEntities,
  baselinePublishers,
  baselineSources,
  storiesToSeed,
  baselineEvents,
  baselineClusters,
  baselineLiveblogEntries,
  baselineCollections,
  commentsToSeed,
  baselineFactChecks,
} from './seed-data';

export async function seedDatabase(db: DatabaseService): Promise<void> {
  logger.info('Starting enterprise database seed with canonical schema records...');

  // 0. Ensure Organization exists if running in Prisma mode
  if (db.isUsingPrisma()) {
    try {
      const client = await prismaManager.getClient();
      if (client) {
        const orgClient = (client as unknown as Record<string, unknown>).organization as
          | {
              upsert: (args: unknown) => Promise<unknown>;
            }
          | undefined;
        if (orgClient && typeof orgClient.upsert === 'function') {
          await orgClient.upsert({
            where: { id: 'org_default' },
            update: {},
            create: {
              id: 'org_default',
              name: 'GlobalPulse Newsroom',
              slug: 'globalpulse-newsroom',
            },
          });
        }
      }
    } catch (e) {
      logger.debug(`Organization upsert skipped or already present: ${String(e)}`);
    }
  }

  // 1. Baseline Users
  for (const u of baselineUsers) {
    const existing = await db.users.findById(u.id);
    if (!existing) {
      await db.users.create(u);
    }
  }

  // 2. Taxonomy Topics
  for (const topic of baselineTopics) {
    const existing = await db.topics.findById(topic.id);
    if (!existing) {
      await db.topics.create(topic);
    }
  }

  // 3. Entities
  for (const entity of baselineEntities) {
    const existing = await db.entities.findById(entity.id);
    if (!existing) {
      await db.entities.create(entity);
    }
  }

  // 4. Publishers
  for (const pub of baselinePublishers) {
    const existing = await db.publishers.findById(pub.id);
    if (!existing) {
      await db.publishers.create(pub);
    }
  }

  // 5. Primary Sources & Documents
  for (const source of baselineSources) {
    const existing = await db.sources.findById(source.id);
    if (!existing) {
      await db.sources.create(source);
    }
  }

  // 6. Comprehensive Editorial Stories
  for (const item of storiesToSeed) {
    const existing = await db.stories.findById(item.story.id);
    if (!existing) {
      await db.stories.create(item.story);
      for (const ver of item.versions) {
        await db.stories.createVersion(ver);
      }
    }
  }

  // 7. Global Ongoing Events
  for (const evt of baselineEvents) {
    const existing = await db.events.findById(evt.id);
    if (!existing) {
      await db.events.create(evt);
    }
  }

  // 8. Story Clusters & Multi-Perspective Coverage
  for (const cluster of baselineClusters) {
    const existing = await db.clusters.getById(cluster.id, cluster.organizationId);
    if (!existing) {
      await db.clusters.create(cluster);
    } else {
      await db.clusters.update(cluster);
    }
  }

  // 9. Liveblog Entries
  for (const entry of baselineLiveblogEntries) {
    try {
      await db.liveblogs.addEntry(entry);
    } catch {
      // Best-effort for existing liveblog entry
    }
  }

  // 10. Curated Collections
  for (const col of baselineCollections) {
    try {
      const existing = await db.collections.findById(col.id);
      if (!existing) {
        await db.collections.create(col);
      }
    } catch (err) {
      logger.debug(`Collection seeding notice for ${col.id}: ${String(err)}`);
    }
  }

  // 11. Reader Engagement (Comments, Reactions, Bookmarks, and Reading Progress)
  for (const c of commentsToSeed) {
    const existing = await db.engagement.findCommentById(c.id);
    if (!existing) {
      await db.engagement.createComment(c);
    }
  }

  // Story Reactions
  try {
    await db.engagement.toggleReaction(
      'sty_brics_flagship',
      'usr_reader_aravind',
      'org_default',
      'insightful'
    );
    await db.engagement.toggleReaction(
      'sty_brics_flagship',
      'usr_reader_sarah',
      'org_default',
      'like'
    );
    await db.engagement.toggleReaction('sty_ai_01', 'usr_reader_sarah', 'org_default', 'important');
    await db.engagement.toggleReaction(
      'sty_fusion_01',
      'usr_reader_aravind',
      'org_default',
      'heart'
    );
  } catch (err) {
    logger.debug(`Reactions seeding notice: ${String(err)}`);
  }

  // Reader Bookmarks
  try {
    await db.engagement.toggleBookmark('usr_reader_sarah', 'sty_ai_01', 'org_default');
    await db.engagement.toggleBookmark('usr_reader_sarah', 'sty_semi_01', 'org_default');
    await db.engagement.toggleBookmark('usr_reader_sarah', 'sty_pick_robotics_01', 'org_default');
    await db.engagement.toggleBookmark('usr_reader_sarah', 'sty_pick_crispr_01', 'org_default');
    await db.engagement.toggleBookmark('usr_reader_aravind', 'sty_brics_flagship', 'org_default');
    await db.engagement.toggleBookmark('usr_reader_aravind', 'sty_markets_01', 'org_default');
    await db.engagement.toggleBookmark(
      'usr_reader_aravind',
      'sty_pick_grid_storage_01',
      'org_default'
    );
    await db.engagement.toggleBookmark(
      'usr_reader_aravind',
      'sty_pick_quantum_crypto_01',
      'org_default'
    );
  } catch (err) {
    logger.debug(`Bookmarks seeding notice: ${String(err)}`);
  }

  // Reading History & Progress
  try {
    await db.engagement.saveReadingProgress('usr_reader_sarah', 'sty_brics_flagship', 100, true);
    await db.engagement.saveReadingProgress('usr_reader_sarah', 'sty_ai_01', 85, false);
    await db.engagement.saveReadingProgress(
      'usr_reader_sarah',
      'sty_pick_neuromorphic_01',
      100,
      true
    );
    await db.engagement.saveReadingProgress('usr_reader_sarah', 'sty_pick_robotics_01', 65, false);
    await db.engagement.saveReadingProgress('usr_reader_aravind', 'sty_brics_flagship', 100, true);
    await db.engagement.saveReadingProgress('usr_reader_aravind', 'sty_fusion_01', 50, false);
    await db.engagement.saveReadingProgress(
      'usr_reader_aravind',
      'sty_pick_space_mining_01',
      80,
      false
    );
    await db.engagement.saveReadingProgress(
      'usr_reader_aravind',
      'sty_pick_grid_storage_01',
      100,
      true
    );
  } catch (err) {
    logger.debug(`Reading progress seeding notice: ${String(err)}`);
  }

  // 12. Newsletter Subscriptions & Curated Digest
  try {
    await db.newsletters.subscribe('sarah.jenkins@reader.test', 'daily', ['technology', 'science']);
    await db.newsletters.subscribe('aravind.patel@reader.test', 'weekly', ['business', 'world']);
    await db.newsletters.saveDigest({
      id: 'dig_2026_10_02_morning',
      frequency: 'daily',
      date: '2026-10-02',
      category: 'technology',
      headline: 'GlobalPulse Executive Morning Briefing: Autonomous Agents & 2nm Silicon',
      curatedStoryIds: ['sty_ai_01', 'sty_semi_01', 'sty_quantum_01'],
      stories: [
        {
          id: 'sty_ai_01',
          title:
            'Autonomous AI Agents Surpass Human Verification Benchmarks in Critical Infrastructure',
          summary: 'Multi-agent verification loops achieve 99.98% zero-defect code deployment.',
          url: '/stories/autonomous-ai-agents-code-generation-benchmark',
          category: 'technology',
          publishedAt: '2026-09-30T09:15:00Z',
        },
        {
          id: 'sty_semi_01',
          title: 'Global Semiconductor Consortium Establishes 2nm Lithography Standard',
          summary: 'Foundries unify High-NA EUV optical tolerances and chiplet interconnects.',
          url: '/stories/global-semiconductor-consortium-formed',
          category: 'technology',
          publishedAt: '2026-09-27T12:00:00Z',
        },
      ],
      generatedAt: '2026-10-02T06:00:00Z',
    });
  } catch (err) {
    logger.debug(`Newsletter seeding notice: ${String(err)}`);
  }

  // 13. Comprehensive Fact Checks
  for (const fc of baselineFactChecks) {
    const existing = await db.factChecks.findById(fc.id);
    if (!existing) {
      await db.factChecks.create(fc);
    }
  }

  // 14. Canonical Categories
  for (const cat of CANONICAL_CATEGORIES) {
    const existing = await db.categories.findBySlug(cat.slug);
    if (!existing) {
      await db.categories.create(cat);
    } else {
      await db.categories.update({ ...existing, ...cat });
    }
  }

  // 15. Navigation Header Tabs
  for (const tab of BASELINE_NAV_TABS) {
    const existing = await db.navTabs.findById(tab.tabId);
    if (!existing) {
      await db.navTabs.create(tab);
    } else {
      await db.navTabs.update(tab);
    }
  }

  logger.info(
    'Database seeded successfully with enterprise newsroom records (10 Users, 16 Topics, 14 Entities, 8 Publishers, 14 Sources, 18 Stories, 4 Events, 18 Clusters, 5 Liveblog Entries, 3 Collections, 4 Comments, Reactions, Bookmarks, and 18 Fact Checks).'
  );
}

if (require.main === module) {
  const dbInstance = new DatabaseService();
  dbInstance
    .initialize()
    .then(() => seedDatabase(dbInstance))
    .then(() => {
      logger.info('Database seeding completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
