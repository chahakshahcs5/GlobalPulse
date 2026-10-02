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
import {
  type Story,
  type StoryVersion,
  type Event,
  type StoryCluster,
  type LiveblogEntry,
  type Comment,
  type FactCheckClaim,
  type NewsroomUser,
  type Topic,
  type Entity,
  type Publisher,
  type Source,
  CANONICAL_CATEGORIES,
  BASELINE_NAV_TABS,
} from '@ai-news/schemas';

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

  // 1. Baseline Users (Admins, Managing Editors, Journalists, AI Agents & Readers)
  const baselineUsers: NewsroomUser[] = [
    {
      id: 'usr_admin',
      organizationId: 'org_default',
      name: 'Elena Rostova',
      email: 'admin@news.platform',
      role: 'admin',
      clientType: 'human_web',
      status: 'active',
      bio: 'Editor-in-Chief & Lead Newsroom Administrator with 18 years in investigative international journalism.',
      avatarUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr_editor',
      organizationId: 'org_default',
      name: 'Marcus Vance',
      email: 'editor@news.platform',
      role: 'editor',
      clientType: 'human_web',
      status: 'active',
      bio: 'Senior Managing Editor for Global & Macroeconomic Desks, specializing in diplomatic summit coverage.',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr_spark_agent',
      organizationId: 'org_default',
      name: 'Gemini Spark Wire Reporter',
      email: 'spark-agent@local.test',
      role: 'ai_agent',
      clientType: 'gemini_spark',
      status: 'active',
      bio: 'Autonomous investigative reporter powered by Gemini 2.5 Flash, specialized in high-throughput wire reporting.',
      avatarUrl:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr_chatgpt_agent',
      organizationId: 'org_default',
      name: 'ChatGPT Deep Research Agent',
      email: 'chatgpt-agent@local.test',
      role: 'ai_agent',
      clientType: 'chatgpt',
      status: 'active',
      bio: 'Deep-research and verification agent powered by OpenAI o3-mini for scientific and regulatory filings.',
      avatarUrl:
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr_claude_agent',
      organizationId: 'org_default',
      name: 'Claude Editorial Synthesis Agent',
      email: 'claude-agent@local.test',
      role: 'ai_agent',
      clientType: 'claude',
      status: 'active',
      bio: 'Multi-document perspective balancer and editorial synthesis agent powered by Claude 3.7 Sonnet.',
      avatarUrl:
        'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr_journalist_david',
      organizationId: 'org_default',
      name: 'David Chen',
      email: 'david.chen@news.platform',
      role: 'journalist',
      clientType: 'human_web',
      status: 'active',
      bio: 'Staff Technology & Silicon Correspondent covering High-NA EUV lithography, chip architecture, and quantum computing.',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-05T09:00:00Z',
      updatedAt: '2026-09-05T09:00:00Z',
    },
    {
      id: 'usr_journalist_amara',
      organizationId: 'org_default',
      name: 'Amara Okafor',
      email: 'amara.okafor@news.platform',
      role: 'journalist',
      clientType: 'human_web',
      status: 'active',
      bio: 'Global Energy, Grid Infrastructure, and Fusion Transition Correspondent.',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-05T09:00:00Z',
      updatedAt: '2026-09-05T09:00:00Z',
    },
    {
      id: 'usr_factchecker_priya',
      organizationId: 'org_default',
      name: 'Priya Sharma',
      email: 'priya.sharma@news.platform',
      role: 'editor',
      clientType: 'human_web',
      status: 'active',
      bio: 'Verification Desk Lead overseeing claims verification, primary source attribution, and truth ratings.',
      avatarUrl:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-05T09:00:00Z',
      updatedAt: '2026-09-05T09:00:00Z',
    },
    {
      id: 'usr_reader_sarah',
      organizationId: 'org_default',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@reader.test',
      role: 'reader',
      clientType: 'human_mobile',
      status: 'active',
      bio: 'Enterprise Tech Executive & Premium Subscriber interested in semiconductor policy and AI agents.',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-10T10:00:00Z',
      updatedAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'usr_reader_aravind',
      organizationId: 'org_default',
      name: 'Aravind Patel',
      email: 'aravind.patel@reader.test',
      role: 'reader',
      clientType: 'human_web',
      status: 'active',
      bio: 'Macroeconomics researcher focusing on South-South trade clearing corridors and sovereign wealth funds.',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
      createdAt: '2026-09-10T10:00:00Z',
      updatedAt: '2026-09-10T10:00:00Z',
    },
  ];

  for (const u of baselineUsers) {
    const existing = await db.users.findById(u.id);
    if (!existing) {
      await db.users.create(u);
    }
  }

  // 2. Taxonomy Topics (16 Structured Categories)
  const topics: Topic[] = [
    {
      id: 'top_geopolitics',
      organizationId: 'org_default',
      slug: 'geopolitics',
      name: 'Global Geopolitics',
      description:
        'International treaties, multilateral summits, diplomatic accords, and sovereign governance.',
      aliases: ['diplomacy', 'foreign-policy', 'summits', 'treaties'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_brics_2026',
      organizationId: 'org_default',
      slug: 'brics-2026',
      name: 'BRICS Summit 2026',
      parentTopicId: 'top_geopolitics',
      description:
        'Coverage of the 2026 New Delhi multilateral summit, accession protocols, and clearing architecture.',
      aliases: ['brics', 'brics-summit', 'new-delhi-accord', 'multilateral-trade'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_semiconductors',
      organizationId: 'org_default',
      slug: 'semiconductors',
      name: 'Semiconductors & Fabrication',
      description:
        'Advanced High-NA EUV lithography, 2nm gate-all-around foundry nodes, and chip packaging.',
      aliases: ['chips', 'lithography', 'euv', 'foundries', 'gate-all-around'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_energy_fusion',
      organizationId: 'org_default',
      slug: 'fusion-energy',
      name: 'Nuclear Fusion Energy',
      description:
        'Commercial net-energy gain milestones, high-temperature superconducting tokamaks, and plasma burning.',
      aliases: ['fusion', 'tokamak', 'plasma-physics', 'net-gain'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_ai_agents',
      organizationId: 'org_default',
      slug: 'autonomous-ai-agents',
      name: 'Autonomous AI Agents',
      description:
        'Multi-agent verification workflows, benchmark evaluations, code generation, and production telemetry.',
      aliases: ['agents', 'autonomous-systems', 'llm-agents', 'mcp-clients'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_macroeconomics',
      organizationId: 'org_default',
      slug: 'macroeconomics',
      name: 'Global Macroeconomics',
      description:
        'Central bank liquidity facilities, sovereign currency clearing, interest rate benchmarks, and FX corridors.',
      aliases: ['monetary-policy', 'central-banks', 'liquidity', 'currencies', 'forex'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_quantum_computing',
      organizationId: 'org_default',
      slug: 'quantum-computing',
      name: 'Quantum Computing & Cryptography',
      description:
        'Topological qubits, fault-tolerant quantum error correction, and post-quantum cryptographic standards.',
      aliases: ['quantum', 'qubits', 'pqc', 'quantum-supremacy'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_climate_transition',
      organizationId: 'org_default',
      slug: 'climate-transition',
      name: 'Clean Energy & Grid Transition',
      description:
        'Solid-state battery deployments, long-duration grid storage, HVDC interconnects, and decarbonization.',
      aliases: ['renewables', 'grid-storage', 'batteries', 'cleantech'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_space_exploration',
      organizationId: 'org_default',
      slug: 'space-exploration',
      name: 'Space Exploration & Orbital Infrastructure',
      description:
        'Lunar Gateway missions, Starship orbital cadence, satellite mega-constellations, and deep-space science.',
      aliases: ['space', 'starship', 'artemis', 'lunar-gateway', 'orbital'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_cybersecurity',
      organizationId: 'org_default',
      slug: 'cybersecurity',
      name: 'Cybersecurity & Infrastructure Defense',
      description:
        'Critical telemetry protection, zero-day mitigation, BGP routing defense, and cryptographic key governance.',
      aliases: ['infosec', 'zero-day', 'cisa', 'grid-security'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_biotech_crispr',
      organizationId: 'org_default',
      slug: 'biotech-and-genomics',
      name: 'Biotech & Synthetic Genomics',
      description:
        'Pan-pathogen mRNA therapeutics, targeted CRISPR gene editing, and synthetic protein design.',
      aliases: ['genomics', 'crispr', 'mrna', 'biomedicine'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_sovereign_wealth',
      organizationId: 'org_default',
      slug: 'sovereign-wealth',
      name: 'Sovereign Wealth & Capital Flows',
      description:
        'Global state-backed investment vehicles, infrastructure funds, and bilateral capital treaties.',
      aliases: ['swf', 'capital-flows', 'sovereign-investments'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_robotics',
      organizationId: 'org_default',
      slug: 'humanoid-robotics',
      name: 'Humanoid Robotics & Automation',
      description:
        'Next-generation embodied AI, bipedal humanoid manipulators, and automated assembly ecosystems.',
      aliases: ['robotics', 'humanoids', 'embodied-ai', 'automation'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_digital_currency',
      organizationId: 'org_default',
      slug: 'digital-currencies',
      name: 'Digital Currencies & Clearing',
      description:
        'Wholesale central bank digital currencies, tokenized sovereign bonds, and programmable settlement.',
      aliases: ['cbdc', 'programmable-money', 'digital-clearing'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_media_provenance',
      organizationId: 'org_default',
      slug: 'media-provenance',
      name: 'Information Provenance & Verification',
      description:
        'C2PA metadata standards, cryptographic content watermarks, fact-checking, and deepfake verification.',
      aliases: ['provenance', 'c2pa', 'verification', 'deepfakes'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'top_culture_cinema',
      organizationId: 'org_default',
      slug: 'culture-and-cinema',
      name: 'Culture & Synthetic Media',
      description:
        'Generative filmmaking, Venice Biennale showcases, digital performance arts, and creative intellectual property.',
      aliases: ['cinema', 'culture', 'filmmaking', 'generative-arts'],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
  ];

  for (const topic of topics) {
    const existing = await db.topics.findById(topic.id);
    if (!existing) {
      await db.topics.create(topic);
    }
  }

  // 3. Entities (14 Key Organizations, Countries, Technologies & People)
  const entities: Entity[] = [
    {
      id: 'ent_india',
      organizationId: 'org_default',
      slug: 'india',
      name: 'Republic of India',
      type: 'COUNTRY',
      aliases: ['Bharat', 'IN'],
      description:
        'Host nation of the 2026 multilateral economic summit and pioneer in unified instant payments.',
      metadata: { capital: 'New Delhi', region: 'South Asia' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_tsmc',
      organizationId: 'org_default',
      slug: 'tsmc',
      name: 'Taiwan Semiconductor Manufacturing Co.',
      type: 'ORGANIZATION',
      aliases: ['TSMC', 'Taiwan Semi'],
      description:
        'World leading semiconductor foundry and pioneer of 2nm gate-all-around nodes and advanced chiplet packaging.',
      metadata: { ticker: 'TSM', industry: 'Semiconductors' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_usa',
      organizationId: 'org_default',
      slug: 'united-states',
      name: 'United States of America',
      type: 'COUNTRY',
      aliases: ['USA', 'US'],
      description:
        'Major federal jurisdiction leading AI research, deep-space exploration, and advanced capital markets.',
      metadata: { capital: 'Washington, D.C.', region: 'North America' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_eu',
      organizationId: 'org_default',
      slug: 'european-union',
      name: 'European Union',
      type: 'INSTITUTION',
      aliases: ['EU', 'European Commission'],
      description:
        'Supranational confederation standardizing international digital services, privacy frameworks, and clean energy directives.',
      metadata: { headquarters: 'Brussels, Belgium' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_nvidia',
      organizationId: 'org_default',
      slug: 'nvidia',
      name: 'NVIDIA Corporation',
      type: 'ORGANIZATION',
      aliases: ['NVDA', 'Nvidia'],
      description:
        'Dominant designer of GPU accelerated computing architectures and AI datacenter interconnects.',
      metadata: { ticker: 'NVDA', industry: 'Accelerated Computing' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_deepmind',
      organizationId: 'org_default',
      slug: 'google-deepmind',
      name: 'Google DeepMind',
      type: 'ORGANIZATION',
      aliases: ['DeepMind', 'Gemini Team'],
      description:
        'Pioneering artificial intelligence research lab responsible for AlphaFold, Gemini, and frontier reasoning models.',
      metadata: { parent: 'Alphabet Inc.' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_openai',
      organizationId: 'org_default',
      slug: 'openai',
      name: 'OpenAI',
      type: 'ORGANIZATION',
      aliases: ['OpenAI Inc.'],
      description:
        'Frontier AI research and deployment enterprise developing multimodal reasoning models and operator agents.',
      metadata: { headquarters: 'San Francisco, CA' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_isro',
      organizationId: 'org_default',
      slug: 'isro',
      name: 'Indian Space Research Organisation',
      type: 'ORGANIZATION',
      aliases: ['ISRO'],
      description:
        'National space agency of India, renowned for cost-efficient lunar and interplanetary exploration.',
      metadata: { headquarters: 'Bengaluru, India' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_cern',
      organizationId: 'org_default',
      slug: 'cern',
      name: 'European Organization for Nuclear Research (CERN)',
      type: 'ORGANIZATION',
      aliases: ['CERN', 'LHC'],
      description:
        'Global particle physics laboratory operating the Large Hadron Collider in Geneva.',
      metadata: { location: 'Geneva, Switzerland' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_who',
      organizationId: 'org_default',
      slug: 'who',
      name: 'World Health Organization',
      type: 'ORGANIZATION',
      aliases: ['WHO'],
      description:
        'United Nations specialized agency coordinating international public health responses and pathogen surveillance.',
      metadata: { headquarters: 'Geneva, Switzerland' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_jensen_huang',
      organizationId: 'org_default',
      slug: 'jensen-huang',
      name: 'Jensen Huang',
      type: 'PERSON',
      aliases: ['Jen-Hsun Huang'],
      description:
        'Founder and Chief Executive Officer of NVIDIA Corporation, architect of GPU computing.',
      metadata: { role: 'CEO', company: 'NVIDIA' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_demis_hassabis',
      organizationId: 'org_default',
      slug: 'demis-hassabis',
      name: 'Demis Hassabis',
      type: 'PERSON',
      aliases: ['Sir Demis Hassabis'],
      description:
        'Nobel laureate, neuroscientist, and CEO of Google DeepMind, leading frontier AI science.',
      metadata: { role: 'CEO', company: 'Google DeepMind' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_sam_altman',
      organizationId: 'org_default',
      slug: 'sam-altman',
      name: 'Sam Altman',
      type: 'PERSON',
      aliases: ['Samuel H. Altman'],
      description:
        'Chief Executive Officer of OpenAI, advocate for global compute infrastructure investment.',
      metadata: { role: 'CEO', company: 'OpenAI' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'ent_iter',
      organizationId: 'org_default',
      slug: 'iter-tokamak',
      name: 'ITER Tokamak Reactor',
      type: 'TECHNOLOGY',
      aliases: ['ITER', 'International Thermonuclear Experimental Reactor'],
      description:
        'World largest magnetic confinement plasma physics experiment located in Saint-Paul-lez-Durance, France.',
      metadata: { location: 'Cadarache, France' },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
  ];

  for (const entity of entities) {
    const existing = await db.entities.findById(entity.id);
    if (!existing) {
      await db.entities.create(entity);
    }
  }

  // 4. Publishers (8 Reputable Wire & Journal Organizations)
  const publishers: Publisher[] = [
    {
      id: 'pub_the_hindu',
      organizationId: 'org_default',
      name: 'The Hindu',
      slug: 'the-hindu',
      domain: 'thehindu.com',
      logoUrl:
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=160&auto=format&fit=crop&q=80',
      description:
        "One of India's most respected English-language daily newspapers, founded in 1878.",
      category: 'general',
      country: 'India',
      language: 'en',
      websiteUrl: 'https://www.thehindu.com',
      biasRating: 'Center / Independent',
      credibilityScore: 96,
      isVerified: true,
      followerCount: 1840,
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'pub_reuters',
      organizationId: 'org_default',
      name: 'Reuters',
      slug: 'reuters',
      domain: 'reuters.com',
      logoUrl:
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=160&auto=format&fit=crop&q=80',
      description:
        'Global news agency and financial markets intelligence provider with worldwide editorial bureaus.',
      category: 'general',
      country: 'United Kingdom',
      language: 'en',
      websiteUrl: 'https://www.reuters.com',
      biasRating: 'Center',
      credibilityScore: 98,
      isVerified: true,
      followerCount: 5200,
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'pub_techcrunch',
      organizationId: 'org_default',
      name: 'TechCrunch',
      slug: 'techcrunch',
      domain: 'techcrunch.com',
      logoUrl:
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=160&auto=format&fit=crop&q=80',
      description:
        'Premier technology and venture publication covering AI breakthroughs, hardware foundries, and startup innovation.',
      category: 'technology',
      country: 'United States',
      language: 'en',
      websiteUrl: 'https://techcrunch.com',
      biasRating: 'Tech Analytical',
      credibilityScore: 92,
      isVerified: true,
      followerCount: 2600,
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'pub_bloomberg',
      organizationId: 'org_default',
      name: 'Bloomberg Markets',
      slug: 'bloomberg',
      domain: 'bloomberg.com',
      logoUrl:
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=160&auto=format&fit=crop&q=80',
      description:
        'Comprehensive international market data, bond yield curves, macro analyses, and central bank coverage.',
      category: 'business',
      country: 'United States',
      language: 'en',
      websiteUrl: 'https://www.bloomberg.com',
      biasRating: 'Center-Right Analytical',
      credibilityScore: 97,
      isVerified: true,
      followerCount: 4100,
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'pub_nature',
      organizationId: 'org_default',
      name: 'Nature Scientific Journal',
      slug: 'nature',
      domain: 'nature.com',
      logoUrl:
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=160&auto=format&fit=crop&q=80',
      description:
        'Preeminent peer-reviewed scientific journal publishing landmark discoveries in physics, biology, and materials science.',
      category: 'science',
      country: 'United Kingdom',
      language: 'en',
      websiteUrl: 'https://www.nature.com',
      biasRating: 'Scientific Nonpartisan',
      credibilityScore: 99,
      isVerified: true,
      followerCount: 3800,
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'pub_mit_tech_review',
      organizationId: 'org_default',
      name: 'MIT Technology Review',
      slug: 'mit-tech-review',
      domain: 'technologyreview.com',
      logoUrl:
        'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=160&auto=format&fit=crop&q=80',
      description:
        'Authoritative authority on the commercial, ethical, and societal impacts of emerging engineering systems.',
      category: 'technology',
      country: 'United States',
      language: 'en',
      websiteUrl: 'https://www.technologyreview.com',
      biasRating: 'Analytical Independent',
      credibilityScore: 98,
      isVerified: true,
      followerCount: 3100,
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'pub_financial_times',
      organizationId: 'org_default',
      name: 'Financial Times',
      slug: 'financial-times',
      domain: 'ft.com',
      logoUrl:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
      description:
        'International business daily providing rigorous coverage of foreign exchange, central bank policy, and diplomatic trade.',
      category: 'business',
      country: 'United Kingdom',
      language: 'en',
      websiteUrl: 'https://www.ft.com',
      biasRating: 'Center Independent',
      credibilityScore: 97,
      isVerified: true,
      followerCount: 4400,
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'pub_ap_news',
      organizationId: 'org_default',
      name: 'Associated Press',
      slug: 'ap-news',
      domain: 'apnews.com',
      logoUrl:
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=160&auto=format&fit=crop&q=80',
      description:
        'Independent global news cooperative dedicated to factual, nonpartisan journalism across 100 countries.',
      category: 'general',
      country: 'United States',
      language: 'en',
      websiteUrl: 'https://apnews.com',
      biasRating: 'Strictly Nonpartisan Wire',
      credibilityScore: 99,
      isVerified: true,
      followerCount: 6500,
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
  ];

  for (const pub of publishers) {
    const existing = await db.publishers.findById(pub.id);
    if (!existing) {
      await db.publishers.create(pub);
    }
  }

  // 5. Primary Sources & Documents (14 Verified Records)
  const sources: Source[] = [
    {
      id: 'src_hindu_01',
      organizationId: 'org_default',
      publisherId: 'pub_the_hindu',
      domain: 'thehindu.com',
      url: 'https://thehindu.com/news/national/india-multilateral-trade-accord-2026',
      canonicalUrl: 'https://thehindu.com/news/national/india-multilateral-trade-accord-2026',
      title: 'India Seals Multilateral Trade Settlement Framework at New Delhi Summit',
      publisher: 'The Hindu',
      author: 'Special Diplomatic Correspondent',
      publishedAt: '2026-09-26T09:00:00Z',
      retrievedAt: '2026-09-26T09:15:00Z',
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      permissibleExcerpt:
        'Negotiators in New Delhi agreed to the landmark accession protocols establishing direct local-currency exchange mechanisms.',
      createdAt: '2026-09-26T09:00:00Z',
      updatedAt: '2026-09-26T09:00:00Z',
    },
    {
      id: 'src_hindu_02',
      organizationId: 'org_default',
      publisherId: 'pub_the_hindu',
      domain: 'thehindu.com',
      url: 'https://thehindu.com/business/economy/cross-border-currency-clearing',
      canonicalUrl: 'https://thehindu.com/business/economy/cross-border-currency-clearing',
      title: 'Reserve Bank Unveils Sovereign Clearing Channels for Asian Bilateral Trade',
      publisher: 'The Hindu',
      author: 'Banking & Macroeconomics Desk',
      publishedAt: '2026-09-26T11:45:00Z',
      retrievedAt: '2026-09-26T12:00:00Z',
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      permissibleExcerpt:
        'The central bank issued operational directives permitting bilateral clearing accounts without third-party intermediary currencies.',
      createdAt: '2026-09-26T11:45:00Z',
      updatedAt: '2026-09-26T11:45:00Z',
    },
    {
      id: 'src_reuters_01',
      organizationId: 'org_default',
      publisherId: 'pub_reuters',
      domain: 'reuters.com',
      url: 'https://reuters.example.com/world/brics-summit-accord-2026',
      canonicalUrl: 'https://reuters.example.com/world/brics-summit-accord-2026',
      title: 'BRICS Leaders Reach Comprehensive Accession Accord',
      publisher: 'Reuters Global Wire',
      author: 'Diplomatic Affairs Bureau',
      publishedAt: '2026-09-26T08:00:00Z',
      retrievedAt: '2026-09-26T08:15:00Z',
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      permissibleExcerpt:
        'The member states formally adopt the New Delhi multilateral settlement framework.',
      createdAt: '2026-09-26T08:00:00Z',
      updatedAt: '2026-09-26T08:00:00Z',
    },
    {
      id: 'src_mea_gov',
      organizationId: 'org_default',
      domain: 'mea.gov.in',
      url: 'https://mea.gov.in/brics-declaration-2026.htm',
      canonicalUrl: 'https://mea.gov.in/brics-declaration-2026.htm',
      title: 'Official Treaty: 2026 New Delhi Declaration',
      publisher: 'Ministry of External Affairs',
      author: 'Summit Secretariat',
      publishedAt: '2026-09-26T09:30:00Z',
      retrievedAt: '2026-09-26T09:45:00Z',
      language: 'en',
      sourceType: 'OFFICIAL_DOCUMENT',
      permissibleExcerpt:
        'Article 4: Cross-border clearing among member states shall be denominated in local currencies.',
      createdAt: '2026-09-26T09:30:00Z',
      updatedAt: '2026-09-26T09:30:00Z',
    },
    {
      id: 'src_techcrunch_01',
      organizationId: 'org_default',
      publisherId: 'pub_techcrunch',
      domain: 'techcrunch.com',
      url: 'https://techcrunch.com/2026/09/27/semiconductor-consortium-2nm-patent-pool',
      canonicalUrl: 'https://techcrunch.com/2026/09/27/semiconductor-consortium-2nm-patent-pool',
      title: 'Global Chipmakers Form Unified 2nm Patent Alliance',
      publisher: 'TechCrunch',
      author: 'Silicon & Hardware Desk',
      publishedAt: '2026-09-27T11:00:00Z',
      retrievedAt: '2026-09-27T11:15:00Z',
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      permissibleExcerpt:
        'The consortium aligns High-NA EUV optical tolerances and chiplet packaging standards under a shared patent pool.',
      createdAt: '2026-09-27T11:00:00Z',
      updatedAt: '2026-09-27T11:00:00Z',
    },
    {
      id: 'src_bloomberg_01',
      organizationId: 'org_default',
      publisherId: 'pub_bloomberg',
      domain: 'bloomberg.com',
      url: 'https://bloomberg.com/news/articles/2026-09-29/central-banks-activate-liquidity-facility',
      canonicalUrl:
        'https://bloomberg.com/news/articles/2026-09-29/central-banks-activate-liquidity-facility',
      title: 'Central Banks Inaugurate Bilateral FX Clearing Grid',
      publisher: 'Bloomberg Markets',
      author: 'Global Financial Wire',
      publishedAt: '2026-09-29T13:30:00Z',
      retrievedAt: '2026-09-29T13:45:00Z',
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      permissibleExcerpt:
        'The multilateral liquidity architecture mitigates settlement risk across currency pairs through automated collateral pledging.',
      createdAt: '2026-09-29T13:30:00Z',
      updatedAt: '2026-09-29T13:30:00Z',
    },
    {
      id: 'src_nature_01',
      organizationId: 'org_default',
      publisherId: 'pub_nature',
      domain: 'nature.com',
      url: 'https://www.nature.com/articles/s41586-026-09823-1',
      canonicalUrl: 'https://www.nature.com/articles/s41586-026-09823-1',
      title: 'Steady-State Fusion Burning Plasma in High-Field Superconducting Tokamaks',
      publisher: 'Nature',
      author: 'Dr. Helen Thorne et al.',
      publishedAt: '2026-09-28T06:00:00Z',
      retrievedAt: '2026-09-28T07:00:00Z',
      language: 'en',
      sourceType: 'ACADEMIC_PAPER',
      permissibleExcerpt:
        'We report continuous plasma confinement exceeding 120 seconds with energy multiplication factor Q = 1.35.',
      createdAt: '2026-09-28T06:00:00Z',
      updatedAt: '2026-09-28T06:00:00Z',
    },
    {
      id: 'src_mit_tech_01',
      organizationId: 'org_default',
      publisherId: 'pub_mit_tech_review',
      domain: 'technologyreview.com',
      url: 'https://technologyreview.com/2026/09/30/verifiable-agent-verification-protocols',
      canonicalUrl:
        'https://technologyreview.com/2026/09/30/verifiable-agent-verification-protocols',
      title: 'Formal Verification Loops Enable Safe Deployment of Autonomous Software Agents',
      publisher: 'MIT Technology Review',
      author: 'Kavita Subramanian',
      publishedAt: '2026-09-30T08:00:00Z',
      retrievedAt: '2026-09-30T08:30:00Z',
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      permissibleExcerpt:
        'Multi-agent formal verification loops eliminated 99.98% of synthesized logic regressions before live promotion.',
      createdAt: '2026-09-30T08:00:00Z',
      updatedAt: '2026-09-30T08:00:00Z',
    },
    {
      id: 'src_ft_01',
      organizationId: 'org_default',
      publisherId: 'pub_financial_times',
      domain: 'ft.com',
      url: 'https://ft.com/content/sovereign-liquidity-grid-clearing-analysis-2026',
      canonicalUrl: 'https://ft.com/content/sovereign-liquidity-grid-clearing-analysis-2026',
      title: 'Global Reserve Realignment: The Rise of Multilateral Currency Clearing',
      publisher: 'Financial Times',
      author: 'Gillian Tett & Martin Wolf',
      publishedAt: '2026-09-29T15:00:00Z',
      retrievedAt: '2026-09-29T15:30:00Z',
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      permissibleExcerpt:
        'Central banks are prioritizing bilateral swap facilities as reserve diversification accelerates.',
      createdAt: '2026-09-29T15:00:00Z',
      updatedAt: '2026-09-29T15:00:00Z',
    },
    {
      id: 'src_esa_01',
      organizationId: 'org_default',
      domain: 'esa.int',
      url: 'https://esa.int/science/artemis-lunar-gateway-halo-insertion',
      canonicalUrl: 'https://esa.int/science/artemis-lunar-gateway-halo-insertion',
      title: 'International Lunar Gateway Insertion Telemetry Vector Finalized',
      publisher: 'European Space Agency',
      author: 'Mission Control Directorate',
      publishedAt: '2026-09-29T18:00:00Z',
      retrievedAt: '2026-09-29T18:30:00Z',
      language: 'en',
      sourceType: 'OFFICIAL_DOCUMENT',
      permissibleExcerpt:
        'The near-rectilinear halo orbit insertion burn completed at 18:22 UTC with nominal propellant margins.',
      createdAt: '2026-09-29T18:00:00Z',
      updatedAt: '2026-09-29T18:00:00Z',
    },
    {
      id: 'src_cern_01',
      organizationId: 'org_default',
      domain: 'cern.ch',
      url: 'https://cern.ch/press/releases/2026/quantum-entanglement-density',
      canonicalUrl: 'https://cern.ch/press/releases/2026/quantum-entanglement-density',
      title: 'CERN Confirms Record Quantum Correlation in High-Luminosity Collider Collisions',
      publisher: 'CERN Directorate',
      author: 'CMS Collaboration',
      publishedAt: '2026-09-28T14:00:00Z',
      retrievedAt: '2026-09-28T14:30:00Z',
      language: 'en',
      sourceType: 'PRESS_RELEASE',
      permissibleExcerpt:
        'Multiparticle quantum entanglement was measured at TeV scales, setting an empirical milestone for quantum field theory.',
      createdAt: '2026-09-28T14:00:00Z',
      updatedAt: '2026-09-28T14:00:00Z',
    },
    {
      id: 'src_who_01',
      organizationId: 'org_default',
      domain: 'who.int',
      url: 'https://who.int/publications/2026/pan-coronavirus-vaccine-phase3',
      canonicalUrl: 'https://who.int/publications/2026/pan-coronavirus-vaccine-phase3',
      title: 'Consensus Evaluation: Broad-Spectrum Synthetic Antigen Phase 3 Global Trial',
      publisher: 'World Health Organization',
      author: 'Strategic Advisory Group of Experts',
      publishedAt: '2026-09-27T10:00:00Z',
      retrievedAt: '2026-09-27T10:30:00Z',
      language: 'en',
      sourceType: 'OFFICIAL_DOCUMENT',
      permissibleExcerpt:
        'The targeted mRNA construct neutralized all circulating sublineages with a 94.2% efficacy profile.',
      createdAt: '2026-09-27T10:00:00Z',
      updatedAt: '2026-09-27T10:00:00Z',
    },
    {
      id: 'src_ap_01',
      organizationId: 'org_default',
      publisherId: 'pub_ap_news',
      domain: 'apnews.com',
      url: 'https://apnews.com/article/venice-film-festival-generative-ai-cinema-2026',
      canonicalUrl: 'https://apnews.com/article/venice-film-festival-generative-ai-cinema-2026',
      title: 'Venice Film Festival Unveils First Juried Synthetic Feature Film Showcase',
      publisher: 'Associated Press',
      author: 'Arts & Cultural Bureau',
      publishedAt: '2026-09-30T16:00:00Z',
      retrievedAt: '2026-09-30T16:20:00Z',
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      permissibleExcerpt:
        'Directors demonstrated real-time generative lighting, acoustic synthesis, and neural rendering in competition films.',
      createdAt: '2026-09-30T16:00:00Z',
      updatedAt: '2026-09-30T16:00:00Z',
    },
    {
      id: 'src_us_cert_01',
      organizationId: 'org_default',
      domain: 'cisa.gov',
      url: 'https://cisa.gov/news-events/cybersecurity-advisories/aa26-274a',
      canonicalUrl: 'https://cisa.gov/news-events/cybersecurity-advisories/aa26-274a',
      title: 'Mitigating Route Integrity Exploits Across Critical Infrastructure Networks',
      publisher: 'Cybersecurity and Infrastructure Security Agency',
      author: 'Joint Cyber Defense Collaborative',
      publishedAt: '2026-09-28T20:00:00Z',
      retrievedAt: '2026-09-28T20:15:00Z',
      language: 'en',
      sourceType: 'OFFICIAL_DOCUMENT',
      permissibleExcerpt:
        'Operational technology operators must enforce cryptographic route origin authorizations to prevent telemetry hijacking.',
      createdAt: '2026-09-28T20:00:00Z',
      updatedAt: '2026-09-28T20:00:00Z',
    },
  ];

  for (const source of sources) {
    const existing = await db.sources.findById(source.id);
    if (!existing) {
      await db.sources.create(source);
    }
  }

  // 6. Comprehensive Editorial Stories (12 Multi-Domain Stories with Rich Visual Blocks)
  const storiesToSeed: Array<{
    story: Story;
    versions: StoryVersion[];
  }> = [
    // Story 1: BRICS Flagship Story (4 blocks: what_changed, paragraph, D3 bar chart, timeline)
    {
      story: {
        id: 'sty_brics_flagship',
        organizationId: 'org_default',
        slug: 'brics-expansion-2026-global-economic-realignment',
        title: 'BRICS Expansion 2026: Historic Geoeconomic Shift Finalized in New Delhi',
        summary:
          'Ten member nations formally ratify expansion protocols and introduce a multi-currency trade clearing architecture.',
        status: 'PUBLISHED',
        articleType: 'breaking_news',
        authorId: 'usr_spark_agent',
        createdByClient: 'gemini_spark',
        createdVia: 'mcp',
        currentVersionNumber: 2,
        heroImageUrl:
          'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-09-26T10:00:00Z',
        createdAt: '2026-09-26T07:00:00Z',
        updatedAt: '2026-09-26T10:00:00Z',
        topicIds: ['top_brics_2026', 'top_geopolitics'],
        entityIds: ['ent_india'],
        sourceIds: ['src_reuters_01', 'src_mea_gov'],
        blocks: [
          {
            id: 'blk_what_changed',
            blockType: 'what_changed',
            sortOrder: 0,
            data: {
              previousVersionNumber: 1,
              updatedAt: '2026-09-26T10:00:00Z',
              items: [
                {
                  changeType: 'added',
                  description: 'Incorporated ratified New Delhi Declaration official excerpts.',
                },
                {
                  changeType: 'updated',
                  description:
                    'Updated D3 economic projection chart reflecting revised purchasing-power output.',
                },
              ],
            },
          },
          {
            id: 'blk_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'NEW DELHI — In a historic unanimous vote, member states formally ratified the accession of four partner economies, establishing a unified multilateral settlement mechanism.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_chart_gdp',
            blockType: 'chart',
            sortOrder: 2,
            data: {
              chartType: 'bar',
              title: 'Combined Economic Output ($ Trillion PPP)',
              xAxis: { key: 'year', label: 'Fiscal Year', type: 'category' },
              yAxis: { label: 'Trillion USD' },
              series: [{ name: 'Combined Output', key: 'gdp', color: '#3b82f6' }],
              values: [
                { year: '2022', gdp: 29.5 },
                { year: '2024', gdp: 35.2 },
                { year: '2026 Proj', gdp: 41.8 },
              ],
              sourceAttribution: 'World Bank & BRICS Secretariat 2026',
            },
          },
          {
            id: 'blk_timeline',
            blockType: 'timeline',
            sortOrder: 3,
            data: {
              title: 'Summit Progression',
              items: [
                {
                  date: '08:00 UTC',
                  headline: 'Draft Protocol Circulated',
                  body: 'Ministerial delegations finalized technical wording for bilateral clearing systems.',
                },
                {
                  date: '10:00 UTC',
                  headline: 'Declaration Ratified',
                  body: 'Heads of state executed signature protocols before the plenary assembly.',
                },
              ],
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_brics_v1',
          storyId: 'sty_brics_flagship',
          versionNumber: 1,
          title: 'BRICS Expansion 2026: Preliminary Consensus Reached',
          summary: 'Summit opens with draft agreement on expanded membership.',
          changeSummary: 'Initial breaking news dispatch.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-09-26T07:00:00Z',
        },
        {
          id: 'ver_brics_v2',
          storyId: 'sty_brics_flagship',
          versionNumber: 2,
          title: 'BRICS Expansion 2026: Historic Geoeconomic Shift Finalized in New Delhi',
          summary:
            'Ten member nations formally ratify expansion protocols and introduce a multi-currency trade clearing architecture.',
          changeSummary:
            'Added What-Changed summary, D3 economic projection chart, and ratified declaration citations.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-09-26T10:00:00Z',
        },
      ],
    },

    // Story 2: Semiconductors & Advanced Lithography (Summary, Paragraph, Table, Quote)
    {
      story: {
        id: 'sty_semi_01',
        organizationId: 'org_default',
        slug: 'global-semiconductor-consortium-formed',
        title: 'Global Semiconductor Consortium Establishes 2nm Lithography Standard',
        summary:
          'Leading fabrication foundries and research universities establish an open patent pool for advanced packaging and gate-all-around architectures.',
        status: 'PUBLISHED',
        articleType: 'technology',
        authorId: 'usr_chatgpt_agent',
        createdByClient: 'chatgpt',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-09-27T12:00:00Z',
        createdAt: '2026-09-27T08:00:00Z',
        updatedAt: '2026-09-27T12:00:00Z',
        topicIds: ['top_semiconductors', 'top_ai_agents'],
        isSubscriberOnly: true,
        entityIds: ['ent_tsmc', 'ent_nvidia'],
        sourceIds: ['src_techcrunch_01', 'src_reuters_01'],
        blocks: [
          {
            id: 'blk_semi_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Consortium Highlights',
              bulletPoints: [
                'Unification of High-NA EUV optical tolerances across major equipment vendors.',
                'Open-standard chiplet interconnect framework targeting under 0.8pJ/bit power dissipation.',
              ],
            },
          },
          {
            id: 'blk_semi_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'TAIPEI — In a strategic shift toward interoperable fabrication, a coalition of top semiconductor foundries and research institutes announced a shared framework for 2-nanometer process nodes, aiming to reduce multi-billion-dollar R&D redundancies.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_semi_table',
            blockType: 'table',
            sortOrder: 2,
            data: {
              title: '2nm Node Geometry Comparison Matrix',
              headers: [
                'Process Metric',
                '3nm FinFET Benchmark',
                '2nm GAA Standard',
                'Performance Delta',
              ],
              rows: [
                ['Logic Density (MTr/mm²)', '215', '310', '+44%'],
                ['Operating Voltage (V)', '0.75V', '0.62V', '-17%'],
                ['Interconnect Energy (pJ/bit)', '1.4', '0.78', '-44%'],
              ],
            },
          },
          {
            id: 'blk_semi_quote',
            blockType: 'quote',
            sortOrder: 3,
            data: {
              quote:
                'Accelerated computing and 2nm architecture represent the single largest performance inflection in semiconductor history.',
              attribution: 'Jensen Huang',
              title: 'CEO, NVIDIA',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_semi_v1',
          storyId: 'sty_semi_01',
          versionNumber: 1,
          title: 'Global Semiconductor Consortium Establishes 2nm Lithography Standard',
          summary:
            'Leading fabrication foundries and research universities establish an open patent pool for advanced packaging and gate-all-around architectures.',
          changeSummary: 'Initial publication of global lithography standard.',
          blocks: [],
          authorId: 'usr_chatgpt_agent',
          clientType: 'chatgpt',
          createdAt: '2026-09-27T12:00:00Z',
        },
      ],
    },

    // Story 3: Nuclear Fusion (Paragraph, D3 Line Chart, Statistic, Citation)
    {
      story: {
        id: 'sty_fusion_01',
        organizationId: 'org_default',
        slug: 'fusion-reactor-test-reaches-net-energy-gain',
        title: 'Magnetic Fusion Reactor Sustains Net Energy Gain for 120 Seconds',
        summary:
          'High-temperature superconducting magnets maintain steady-state fusion plasma at an unprecedented 1.35x Q-factor.',
        status: 'PUBLISHED',
        articleType: 'science',
        authorId: 'usr_spark_agent',
        createdByClient: 'gemini_spark',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-09-28T07:30:00Z',
        createdAt: '2026-09-28T07:30:00Z',
        updatedAt: '2026-09-28T07:30:00Z',
        topicIds: ['top_energy_fusion', 'top_climate_transition'],
        isSubscriberOnly: true,
        entityIds: ['ent_iter'],
        sourceIds: ['src_nature_01'],
        blocks: [
          {
            id: 'blk_fusion_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'OXFORD — Experimental physicists achieved a major milestone toward grid-scale nuclear fusion, maintaining a plasma burning phase for two full minutes with a net positive energy return.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_fusion_chart',
            blockType: 'chart',
            sortOrder: 1,
            data: {
              chartType: 'line',
              title: 'Steady-State Plasma Core Temperature (keV)',
              xAxis: { key: 'seconds', label: 'Confinement Duration (Seconds)', type: 'linear' },
              yAxis: { label: 'Core Temp (keV)' },
              series: [{ name: 'Plasma Temperature', key: 'temp', color: '#ef4444' }],
              values: [
                { seconds: '0', temp: 2.1 },
                { seconds: '30', temp: 12.8 },
                { seconds: '60', temp: 15.4 },
                { seconds: '90', temp: 15.9 },
                { seconds: '120', temp: 16.1 },
              ],
              sourceAttribution: 'Culham Centre for Fusion Energy & Nature 2026',
            },
          },
          {
            id: 'blk_fusion_stat',
            blockType: 'statistic',
            sortOrder: 2,
            data: {
              value: '1.35x Q-Factor',
              label: 'Empirical Net Energy Output Gain Ratio',
              trend: 'up',
              trendValue: '+35% above breakeven',
              context: 'Continuous high-temperature superconducting magnet stabilization',
            },
          },
          {
            id: 'blk_fusion_citation',
            blockType: 'citation',
            sortOrder: 3,
            data: {
              claim:
                'Steady-state deuterium-tritium plasma sustained continuously beyond 120s with positive Q-factor.',
              sourceIds: ['src_nature_01'],
              quoteExcerpt:
                'Continuous plasma confinement observed without disruptive edge-localized modes.',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_fusion_v1',
          storyId: 'sty_fusion_01',
          versionNumber: 1,
          title: 'Magnetic Fusion Reactor Sustains Net Energy Gain for 120 Seconds',
          summary:
            'High-temperature superconducting magnets maintain steady-state fusion plasma at an unprecedented 1.35x Q-factor.',
          changeSummary: 'First verified net-gain plasma containment run.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-09-28T07:30:00Z',
        },
      ],
    },

    // Story 4: Macroeconomics & FX Liquidity (Paragraph, D3 Area Chart, Quote)
    {
      story: {
        id: 'sty_markets_01',
        organizationId: 'org_default',
        slug: 'central-banks-multilateral-liquidity-facility-operational',
        title: 'Sovereign Central Banks Operationalize Multilateral Liquidity Facility',
        summary:
          'A consortium of emerging and G20 central banks activates cross-border settlement channels with automated risk-hedging corridors.',
        status: 'PUBLISHED',
        articleType: 'business',
        authorId: 'usr_admin',
        createdByClient: 'human_web',
        createdVia: 'admin',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-09-29T14:00:00Z',
        createdAt: '2026-09-29T11:00:00Z',
        updatedAt: '2026-09-29T14:00:00Z',
        topicIds: ['top_macroeconomics', 'top_geopolitics', 'top_digital_currency'],
        entityIds: ['ent_india', 'ent_eu'],
        sourceIds: ['src_bloomberg_01', 'src_hindu_02', 'src_ft_01'],
        blocks: [
          {
            id: 'blk_markets_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'BASEL — Central monetary authorities confirmed operational readiness for multi-currency clearing grids, providing real-time liquidity swaps without USD intermediary routing.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_markets_chart',
            blockType: 'chart',
            sortOrder: 1,
            data: {
              chartType: 'area',
              title: 'Daily Bilateral Currency Settlement Volume ($ Billions)',
              xAxis: { key: 'month', label: 'Month', type: 'category' },
              yAxis: { label: 'Billion USD Equivalent' },
              series: [{ name: 'Direct Bilateral Volume', key: 'volume', color: '#10b981' }],
              values: [
                { month: 'Apr 26', volume: 14.2 },
                { month: 'Jun 26', volume: 28.6 },
                { month: 'Aug 26', volume: 49.3 },
                { month: 'Sep 26', volume: 72.1 },
              ],
              sourceAttribution: 'Bank for International Settlements 2026',
            },
          },
          {
            id: 'blk_markets_quote',
            blockType: 'quote',
            sortOrder: 2,
            data: {
              quote:
                'Automated collateralized clearing corridors eliminate intermediate conversion friction and re-anchor sovereign trade settlement.',
              attribution: 'Secretariat for International Settlements',
              title: 'Basel Policy Declaration',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_markets_v1',
          storyId: 'sty_markets_01',
          versionNumber: 1,
          title: 'Sovereign Central Banks Operationalize Multilateral Liquidity Facility',
          summary:
            'A consortium of emerging and G20 central banks activates cross-border settlement channels with automated risk-hedging corridors.',
          changeSummary: 'Operational launch verification.',
          blocks: [],
          authorId: 'usr_admin',
          clientType: 'human_web',
          createdAt: '2026-09-29T14:00:00Z',
        },
      ],
    },

    // Story 5: Autonomous AI Agents & Verification (Paragraph, Interactive Poll, Document Viewer)
    {
      story: {
        id: 'sty_ai_01',
        organizationId: 'org_default',
        slug: 'autonomous-ai-agents-code-generation-benchmark',
        title:
          'Autonomous AI Agents Surpass Human Verification Benchmarks in Critical Infrastructure',
        summary:
          'Rigorous evaluations across telecommunications and power grids demonstrate multi-agent verification loops achieve 99.98% zero-defect rate.',
        status: 'PUBLISHED',
        articleType: 'technology',
        authorId: 'usr_spark_agent',
        createdByClient: 'gemini_spark',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-09-30T09:15:00Z',
        createdAt: '2026-09-30T08:00:00Z',
        updatedAt: '2026-09-30T09:15:00Z',
        topicIds: ['top_ai_agents', 'top_cybersecurity'],
        isSubscriberOnly: false,
        entityIds: ['ent_deepmind', 'ent_openai'],
        sourceIds: ['src_mit_tech_01', 'src_techcrunch_01'],
        blocks: [
          {
            id: 'blk_ai_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'SAN FRANCISCO — Autonomous agent teams operating under formal verification architectures have demonstrated zero-defect deployment across multi-tier production telemetry systems, surpassing human code-review benchmarks.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_ai_poll',
            blockType: 'poll',
            sortOrder: 1,
            data: {
              pollId: 'poll_ai_critical_infra',
              question:
                'Should power grid and telecommunications infrastructure allow direct autonomous agent deployments?',
              options: [
                {
                  id: 'opt_1',
                  text: 'Yes, if validated by formal mathematical verification',
                  voteCount: 420,
                },
                {
                  id: 'opt_2',
                  text: 'Hybrid only: Mandatory human air-gap signoff',
                  voteCount: 890,
                },
                {
                  id: 'opt_3',
                  text: 'No, mission-critical infrastructure must remain 100% human-operated',
                  voteCount: 310,
                },
              ],
              totalVotes: 1620,
              closed: false,
            },
          },
          {
            id: 'blk_ai_doc',
            blockType: 'document_viewer',
            sortOrder: 2,
            data: {
              documentUrl:
                'https://news.platform/docs/benchmarks/agent-verification-protocol-2026.pdf',
              title: 'Formal Multi-Agent Telemetry Verification Specification (v2.4)',
              pageCount: 24,
              documentType: 'whitepaper',
              description:
                'Peer-reviewed technical specification defining formal verification gates and automated test generation.',
              highlights: [
                {
                  page: 4,
                  excerpt:
                    'Zero-defect boundary criteria enforced via abstract interpretation and SMT-solver verification passes.',
                  note: 'Core safety theorem',
                },
              ],
              sourceAttribution: 'MIT Computer Science & AI Lab',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_ai_v1',
          storyId: 'sty_ai_01',
          versionNumber: 1,
          title:
            'Autonomous AI Agents Surpass Human Verification Benchmarks in Critical Infrastructure',
          summary:
            'Rigorous evaluations across telecommunications and power grids demonstrate multi-agent verification loops achieve 99.98% zero-defect rate.',
          changeSummary: 'Benchmark publication release.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-09-30T09:15:00Z',
        },
      ],
    },

    // Story 6: Quantum Computing Breakthrough (Paragraph, Audio Player Dispatch, D3 Scatter Chart)
    {
      story: {
        id: 'sty_quantum_01',
        organizationId: 'org_default',
        slug: 'topological-quantum-processor-10k-qubits-fault-tolerant',
        title: 'Topological Quantum Processor Surpasses 10,000 Fault-Tolerant Logical Qubits',
        summary:
          'Majorana zero-mode braiding achieves two orders of magnitude lower error rates, opening the pathway to full molecular simulations.',
        status: 'PUBLISHED',
        articleType: 'science',
        authorId: 'usr_journalist_david',
        createdByClient: 'human_web',
        createdVia: 'web',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-01T06:00:00Z',
        createdAt: '2026-10-01T04:30:00Z',
        updatedAt: '2026-10-01T06:00:00Z',
        topicIds: ['top_quantum_computing', 'top_semiconductors'],
        isSubscriberOnly: true,
        entityIds: ['ent_cern'],
        sourceIds: ['src_cern_01'],
        blocks: [
          {
            id: 'blk_quantum_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'COPENHAGEN — Quantum computing researchers announced a breakthrough architecture incorporating topological qubits, achieving over 10,000 fault-tolerant logical qubits without cryogenic error cascades.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_quantum_audio',
            blockType: 'audio',
            sortOrder: 1,
            data: {
              url: '/audio/quantum-topological-qubits-briefing.mp3',
              title: 'GlobalPulse Deep Dive: Inside the Majorana Topological Qubit Breakthrough',
              narrator: 'Elena Rostova & David Chen',
              durationSeconds: 245,
              transcript:
                'Welcome to this GlobalPulse Special Report. Today, we break down how topological braid protection neutralizes environmental decoherence without requiring thousands of redundant physical qubits per logical unit.',
              language: 'en',
            },
          },
          {
            id: 'blk_quantum_chart',
            blockType: 'chart',
            sortOrder: 2,
            data: {
              chartType: 'scatter',
              title: 'Logical Gate Error Rate vs. Operating Temperature',
              xAxis: { key: 'tempKelvin', label: 'Cryostat Temp (Kelvin)', type: 'linear' },
              yAxis: { label: 'Gate Error Rate (10^-6)' },
              series: [{ name: 'Topological Architecture', key: 'errorRate', color: '#8b5cf6' }],
              values: [
                { tempKelvin: '0.015', errorRate: 0.08 },
                { tempKelvin: '0.050', errorRate: 0.12 },
                { tempKelvin: '0.100', errorRate: 0.25 },
                { tempKelvin: '0.250', errorRate: 0.94 },
              ],
              sourceAttribution: 'Copenhagen Quantum Foundry & Physical Review Letters 2026',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_quantum_v1',
          storyId: 'sty_quantum_01',
          versionNumber: 1,
          title: 'Topological Quantum Processor Surpasses 10,000 Fault-Tolerant Logical Qubits',
          summary:
            'Majorana zero-mode braiding achieves two orders of magnitude lower error rates, opening the pathway to full molecular simulations.',
          changeSummary: 'Initial research dispatch.',
          blocks: [],
          authorId: 'usr_journalist_david',
          clientType: 'human_web',
          createdAt: '2026-10-01T06:00:00Z',
        },
      ],
    },

    // Story 7: Deep Space & Lunar Gateway (Paragraph, Map, Timeline, Gallery)
    {
      story: {
        id: 'sty_space_01',
        organizationId: 'org_default',
        slug: 'international-lunar-gateway-enters-polar-halo-orbit',
        title: 'International Lunar Gateway Completes Final Orbit Insertion Maneuver',
        summary:
          'Astronauts and autonomous robotics modules finalize docking protocols in the Moon’s near-rectilinear halo orbit ahead of crewed surface landings.',
        status: 'PUBLISHED',
        articleType: 'explainer',
        authorId: 'usr_editor',
        createdByClient: 'human_web',
        createdVia: 'web',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-01T12:00:00Z',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T12:00:00Z',
        topicIds: ['top_space_exploration'],
        entityIds: ['ent_usa', 'ent_eu', 'ent_isro'],
        sourceIds: ['src_esa_01'],
        blocks: [
          {
            id: 'blk_space_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'HOUSTON & DARMSTADT — Flight directors at NASA and ESA confirmed that the Lunar Gateway space station completed its high-precision trajectory correction burn, settling into its operational halo orbit.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_space_map',
            blockType: 'map',
            sortOrder: 1,
            data: {
              title: 'Artemis Surface Communications & Launch Tracking Network',
              center: [-80.6077, 28.3922], // Cape Canaveral
              zoom: 3,
              style: 'satellite',
              markers: [
                {
                  coordinates: [-80.6077, 28.3922],
                  title: 'Kennedy Space Center Launch Complex 39B',
                  description: 'Primary terrestrial heavy-lift departure point.',
                },
                {
                  coordinates: [8.65, 49.87],
                  title: 'European Space Operations Centre (Darmstadt)',
                  description: 'Gateway telemetry navigation & propulsion control.',
                },
              ],
            },
          },
          {
            id: 'blk_space_timeline',
            blockType: 'timeline',
            sortOrder: 2,
            data: {
              title: 'Gateway Insertion Flight Progression',
              items: [
                {
                  date: '14:20 UTC',
                  headline: 'Trans-Lunar Injection Verified',
                  body: 'Solar Electric Propulsion thrusters fired for 18 continuous hours.',
                },
                {
                  date: '18:22 UTC',
                  headline: 'Near-Rectilinear Halo Insertion (NRHO)',
                  body: 'Habitation and Logistics Outpost locked into 7-day lunar polar orbit.',
                },
              ],
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_space_v1',
          storyId: 'sty_space_01',
          versionNumber: 1,
          title: 'International Lunar Gateway Completes Final Orbit Insertion Maneuver',
          summary:
            'Astronauts and autonomous robotics modules finalize docking protocols in the Moon’s near-rectilinear halo orbit ahead of crewed surface landings.',
          changeSummary: 'Insertion confirmation bulletin.',
          blocks: [],
          authorId: 'usr_editor',
          clientType: 'human_web',
          createdAt: '2026-10-01T12:00:00Z',
        },
      ],
    },

    // Story 8: Clean Energy Grid Transition (Summary, Paragraph, D3 Donut Chart, Callout)
    {
      story: {
        id: 'sty_climate_01',
        organizationId: 'org_default',
        slug: 'global-grid-integrates-500gwh-solid-state-storage',
        title: 'Global Energy Grid Connects First 500 GWh of Solid-State Storage',
        summary:
          'Non-flammable solid electrolyte batteries overcome thermal runaways, enabling 24/7 baseload renewable integration across three continents.',
        status: 'PUBLISHED',
        articleType: 'analysis',
        authorId: 'usr_journalist_amara',
        createdByClient: 'human_web',
        createdVia: 'web',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-01T15:00:00Z',
        createdAt: '2026-10-01T13:00:00Z',
        updatedAt: '2026-10-01T15:00:00Z',
        topicIds: ['top_climate_transition', 'top_macroeconomics'],
        entityIds: ['ent_eu', 'ent_india'],
        sourceIds: ['src_reuters_01'],
        blocks: [
          {
            id: 'blk_climate_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Grid Transformation Milestones',
              bulletPoints: [
                'Commercial deployment of ceramic solid electrolyte cells operating at 99.4% round-trip efficiency.',
                'Total grid-scale battery storage capacity crosses the 500 Gigawatt-hour threshold.',
              ],
            },
          },
          {
            id: 'blk_climate_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'BRUSSELS & HYDERABAD — National transmission operators verified the synchronization of solid-state grid storage facilities, providing instantaneous frequency stabilization without reliance on peaking gas turbines.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_climate_chart',
            blockType: 'chart',
            sortOrder: 2,
            data: {
              chartType: 'donut',
              title: '2026 Global Grid Storage Technology Share',
              xAxis: { key: 'technology', label: 'Storage Technology', type: 'category' },
              yAxis: { label: 'Market Share (%)' },
              series: [{ name: 'Installed Share', key: 'share', color: '#10b981' }],
              values: [
                { technology: 'Solid-State Ceramic', share: 44 },
                { technology: 'Lithium-Iron-Phosphate (LFP)', share: 36 },
                { technology: 'Sodium-Ion', share: 14 },
                { technology: 'Flow Batteries', share: 6 },
              ],
              sourceAttribution: 'International Energy Agency 2026',
            },
          },
          {
            id: 'blk_climate_callout',
            blockType: 'callout',
            sortOrder: 3,
            data: {
              style: 'info',
              title: 'Grid Balancing Impact',
              text: 'Sub-cycle response times allow solid-state systems to damp transient frequency sags within 8 milliseconds of line trip events.',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_climate_v1',
          storyId: 'sty_climate_01',
          versionNumber: 1,
          title: 'Global Energy Grid Connects First 500 GWh of Solid-State Storage',
          summary:
            'Non-flammable solid electrolyte batteries overcome thermal runaways, enabling 24/7 baseload renewable integration across three continents.',
          changeSummary: 'First publication of 500GWh grid integration.',
          blocks: [],
          authorId: 'usr_journalist_amara',
          clientType: 'human_web',
          createdAt: '2026-10-01T15:00:00Z',
        },
      ],
    },

    // Story 9: Biotech & Genomics (Paragraph, WhatChanged Diff, Document Viewer)
    {
      story: {
        id: 'sty_health_01',
        organizationId: 'org_default',
        slug: 'pan-coronavirus-mrna-therapeutic-passes-phase3',
        title: 'Pan-Coronavirus mRNA Therapeutic Demonstrates 94% Efficacy in Global Phase 3 Trial',
        summary:
          'Universal synthetic antigen targets conserved viral stem proteins, offering broad neutralization against present and emerging respiratory lineages.',
        status: 'PUBLISHED',
        articleType: 'science',
        authorId: 'usr_spark_agent',
        createdByClient: 'gemini_spark',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T05:00:00Z',
        createdAt: '2026-10-02T03:00:00Z',
        updatedAt: '2026-10-02T05:00:00Z',
        topicIds: ['top_biotech_crispr'],
        entityIds: ['ent_who'],
        sourceIds: ['src_who_01'],
        blocks: [
          {
            id: 'blk_health_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'GENEVA — Clinical trial results published by international health authorities demonstrated that a computationally designed mRNA vaccine successfully neutralized across all documented respiratory viral mutations with zero serious adverse events.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_health_what_changed',
            blockType: 'what_changed',
            sortOrder: 1,
            data: {
              previousVersionNumber: 1,
              updatedAt: '2026-10-02T05:00:00Z',
              items: [
                {
                  changeType: 'added',
                  description:
                    'Included peer-reviewed multinational Phase 3 demographic breakdown.',
                },
                {
                  changeType: 'updated',
                  description: 'Refined neutralizing antibody geometric mean titer figures.',
                },
              ],
            },
          },
          {
            id: 'blk_health_doc',
            blockType: 'document_viewer',
            sortOrder: 2,
            data: {
              documentUrl: 'https://news.platform/docs/clinical/phase3-pan-coronavirus-results.pdf',
              title: 'Phase 3 Multicenter Randomized Clinical Evaluation Protocol (WHO-CT-2026-9)',
              pageCount: 68,
              documentType: 'regulatory_directive',
              description:
                'Primary statistical dossier filed with global pharmaceutical regulators.',
              highlights: [
                {
                  page: 12,
                  excerpt:
                    'Neutralizing antibody titers against conserved epitope regions remained steady at 180 days post-administration.',
                  note: 'Primary endpoint verification',
                },
              ],
              sourceAttribution: 'World Health Organization Strategic Committee',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_health_v1',
          storyId: 'sty_health_01',
          versionNumber: 1,
          title:
            'Pan-Coronavirus mRNA Therapeutic Demonstrates 94% Efficacy in Global Phase 3 Trial',
          summary:
            'Universal synthetic antigen targets conserved viral stem proteins, offering broad neutralization against present and emerging respiratory lineages.',
          changeSummary: 'Release of Phase 3 findings.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-10-02T05:00:00Z',
        },
      ],
    },

    // Story 10: Cybersecurity Zero-Day Defense (Paragraph, Timeline, Callout)
    {
      story: {
        id: 'sty_cyber_01',
        organizationId: 'org_default',
        slug: 'coordinated-zero-day-patch-deployed-across-power-grids',
        title: 'Coordinated Defensive Patch Deployed Across Global Power Grid Protocols',
        summary:
          'Cybersecurity agencies and utility alliances deploy automated mitigation preventing unauthorized packet injections into high-voltage telemetry relays.',
        status: 'PUBLISHED',
        articleType: 'investigation',
        authorId: 'usr_journalist_david',
        createdByClient: 'human_web',
        createdVia: 'web',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T08:00:00Z',
        createdAt: '2026-10-02T06:00:00Z',
        updatedAt: '2026-10-02T08:00:00Z',
        topicIds: ['top_cybersecurity', 'top_ai_agents'],
        entityIds: ['ent_usa', 'ent_eu'],
        sourceIds: ['src_us_cert_01'],
        blocks: [
          {
            id: 'blk_cyber_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'WASHINGTON — A coordinated international defense operation pushed cryptographic firmware patches to industrial control systems across twelve regional grids, closing an undocumented route spoofing vulnerability before exploitation.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_cyber_timeline',
            blockType: 'timeline',
            sortOrder: 1,
            data: {
              title: 'Coordinated Vulnerability Remediation Chronology',
              items: [
                {
                  date: 'T-72 Hours',
                  headline: 'Vulnerability Discovered via Whistleblower Tipline',
                  body: 'Cryptographic vulnerability flagged in legacy substation route advertisement protocols.',
                },
                {
                  date: 'T-24 Hours',
                  headline: 'Autonomous Formal Patch Verified',
                  body: 'AI agent synthesis teams developed and formally proved non-disruptive hot-patch.',
                },
                {
                  date: 'T-0 Hours',
                  headline: 'Global Air-Gapped Key Rollout Complete',
                  body: 'All tier-1 transmission relays updated with authenticated cryptographic firmware.',
                },
              ],
            },
          },
          {
            id: 'blk_cyber_callout',
            blockType: 'callout',
            sortOrder: 2,
            data: {
              style: 'warning',
              title: 'Security Operator Notice',
              text: 'Legacy supervisory systems utilizing unauthenticated border gateway protocol routing must enforce mandatory RPKI origin validation immediately.',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_cyber_v1',
          storyId: 'sty_cyber_01',
          versionNumber: 1,
          title: 'Coordinated Defensive Patch Deployed Across Global Power Grid Protocols',
          summary:
            'Cybersecurity agencies and utility alliances deploy automated mitigation preventing unauthorized packet injections into high-voltage telemetry relays.',
          changeSummary: 'Immediate security advisory.',
          blocks: [],
          authorId: 'usr_journalist_david',
          clientType: 'human_web',
          createdAt: '2026-10-02T08:00:00Z',
        },
      ],
    },

    // Story 11: Culture & Synthetic Cinema (Paragraph, Quote, Poll)
    {
      story: {
        id: 'sty_culture_01',
        organizationId: 'org_default',
        slug: 'venice-biennale-spotlights-fully-synthetic-feature-films',
        title: 'Venice Biennale Awards Jury Prize to Fully Neural Synthetic Feature Film',
        summary:
          'Cinematic critics celebrate groundbreaking emotional depth and lighting physics in entirely generated digital narrative, igniting global festival debates.',
        status: 'PUBLISHED',
        articleType: 'culture',
        authorId: 'usr_editor',
        createdByClient: 'human_web',
        createdVia: 'web',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T09:00:00Z',
        createdAt: '2026-10-02T07:30:00Z',
        updatedAt: '2026-10-02T09:00:00Z',
        topicIds: ['top_culture_cinema'],
        entityIds: ['ent_eu'],
        sourceIds: ['src_ap_01'],
        blocks: [
          {
            id: 'blk_culture_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'VENICE — In a defining moment for international filmmaking, the 83rd Venice International Film Festival awarded a special jury commendation to a feature-length production generated entirely through neural volume rendering.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_culture_quote',
            blockType: 'quote',
            sortOrder: 1,
            data: {
              quote:
                'We did not judge the pixels or the computation; we judged the ache in the human story it told.',
              attribution: 'Alberto Barbera',
              title: 'Venice Film Festival Artistic Director',
            },
          },
          {
            id: 'blk_culture_poll',
            blockType: 'poll',
            sortOrder: 2,
            data: {
              pollId: 'poll_culture_synthetic_cinema',
              question:
                'Should fully synthetic AI films be eligible to compete for major film academy awards alongside human-shot cinema?',
              options: [
                {
                  id: 'opt_c1',
                  text: 'Yes, evaluate based on creative merit and narrative impact',
                  voteCount: 680,
                },
                {
                  id: 'opt_c2',
                  text: 'Create a dedicated standalone category for synthetic cinema',
                  voteCount: 1420,
                },
                {
                  id: 'opt_c3',
                  text: 'No, traditional awards must be reserved for physical production',
                  voteCount: 890,
                },
              ],
              totalVotes: 2990,
              closed: false,
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_culture_v1',
          storyId: 'sty_culture_01',
          versionNumber: 1,
          title: 'Venice Biennale Awards Jury Prize to Fully Neural Synthetic Feature Film',
          summary:
            'Cinematic critics celebrate groundbreaking emotional depth and lighting physics in entirely generated digital narrative, igniting global festival debates.',
          changeSummary: 'Awards dispatch publication.',
          blocks: [],
          authorId: 'usr_editor',
          clientType: 'human_web',
          createdAt: '2026-10-02T09:00:00Z',
        },
      ],
    },

    // Story 12: Live Tracking Liveblog (Starship Flight 7 Orbital Flight Test)
    {
      story: {
        id: 'sty_liveblog_starship',
        organizationId: 'org_default',
        slug: 'live-starship-flight-7-orbital-test-tracking',
        title: 'LIVE: Starship Flight 7 Orbital Flight Test & Booster Recovery',
        summary:
          'Real-time live telemetry tracking, stage separation markers, and orbital propellant transfer demonstrations.',
        status: 'PUBLISHED',
        articleType: 'liveblog',
        authorId: 'usr_spark_agent',
        createdByClient: 'gemini_spark',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1517976487502-5f79b47e2c90?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T10:00:00Z',
        createdAt: '2026-10-02T08:00:00Z',
        updatedAt: '2026-10-02T10:30:00Z',
        topicIds: ['top_space_exploration'],
        entityIds: ['ent_usa'],
        sourceIds: ['src_reuters_01'],
        blocks: [
          {
            id: 'blk_starship_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'STARBASE, TEXAS — Teams are tracking the terminal countdown for Starship Flight 7. Follow this live dispatch feed for minute-by-minute trajectory confirmations.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_starship_v1',
          storyId: 'sty_liveblog_starship',
          versionNumber: 1,
          title: 'LIVE: Starship Flight 7 Orbital Flight Test & Booster Recovery',
          summary:
            'Real-time live telemetry tracking, stage separation markers, and orbital propellant transfer demonstrations.',
          changeSummary: 'Live tracking initiated.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-10-02T10:00:00Z',
        },
      ],
    },

    // Story 13: Picks For You — Humanoid Robotics (Summary, Lead, Quote, Chart)
    {
      story: {
        id: 'sty_pick_robotics_01',
        organizationId: 'org_default',
        slug: 'humanoid-robotics-factory-floor-deployment-automotive',
        title: 'Humanoid Robotics Accelerate 24/7 Factory Floor Deployment in Automotive Assembly',
        summary:
          'Autonomous bipedal robots achieve 99.4% task completion rates in high-precision battery pack assembly and chassis wiring.',
        status: 'PUBLISHED',
        articleType: 'technology',
        authorId: 'usr_spark_agent',
        createdByClient: 'gemini_spark',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T11:00:00Z',
        createdAt: '2026-10-02T09:00:00Z',
        updatedAt: '2026-10-02T11:00:00Z',
        topicIds: ['top_ai_agents', 'top_semiconductors'],
        entityIds: ['ent_demis_hassabis', 'ent_jensen_huang'],
        sourceIds: ['src_techcrunch_01', 'src_mit_tech_01'],
        blocks: [
          {
            id: 'blk_robotics_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Robotics Assembly Milestones',
              bulletPoints: [
                'Continuous 24-hour shift cycle validation across two commercial pilot plants.',
                'Sub-millimeter connector insertion precision using tactile feedback sensors.',
                'Zero safety halts recorded over 120,000 cumulative autonomous production hours.',
              ],
            },
          },
          {
            id: 'blk_robotics_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'STUTTGART/DETROIT — Commercial automotive manufacturing reached an autonomous inflection point as bipedal humanoid robots took over continuous battery module wiring across two high-volume assembly lines, operating without human intervention.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_robotics_quote',
            blockType: 'quote',
            sortOrder: 2,
            data: {
              quote:
                'Tactile reinforcement learning has closed the dexterity gap. Humanoid units are no longer laboratory curiosities; they are core capital equipment.',
              attribution: 'Dr. Clara Lindqvist',
              title: 'VP of Manufacturing Automation',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_robotics_v1',
          storyId: 'sty_pick_robotics_01',
          versionNumber: 1,
          title:
            'Humanoid Robotics Accelerate 24/7 Factory Floor Deployment in Automotive Assembly',
          summary:
            'Autonomous bipedal robots achieve 99.4% task completion rates in high-precision battery pack assembly and chassis wiring.',
          changeSummary: 'Initial publication.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-10-02T11:00:00Z',
        },
      ],
    },

    // Story 14: Picks For You — Neuromorphic Silicon (Summary, Lead, Quote)
    {
      story: {
        id: 'sty_pick_neuromorphic_01',
        organizationId: 'org_default',
        slug: 'neuromorphic-ai-chips-edge-inference-power-cut',
        title: 'Neuromorphic AI Chips Cut Edge Inference Power by 90% in Drone and Satellite Tests',
        summary:
          'Event-based spiking neural network silicon delivers sub-watt real-time computer vision without thermal throttling in extreme environments.',
        status: 'PUBLISHED',
        articleType: 'technology',
        authorId: 'usr_chatgpt_agent',
        createdByClient: 'chatgpt',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T11:15:00Z',
        createdAt: '2026-10-02T09:30:00Z',
        updatedAt: '2026-10-02T11:15:00Z',
        topicIds: ['top_semiconductors', 'top_ai_agents'],
        entityIds: ['ent_demis_hassabis'],
        sourceIds: ['src_nature_01', 'src_techcrunch_01'],
        blocks: [
          {
            id: 'blk_neuro_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Neuromorphic Benchmark Findings',
              bulletPoints: [
                'Dynamic energy consumption under 450 milliwatts at 120 frames per second.',
                'Asynchronous temporal event processing eliminates synchronous clock power loss.',
                'Seamless integration with satellite attitude-control optical navigation arrays.',
              ],
            },
          },
          {
            id: 'blk_neuro_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'ZURICH — In high-altitude orbital and atmospheric trials, neuromorphic silicon mimics the synaptic firing of biological retinas, slashing power consumption tenfold while outperforming standard GPU accelerators in high-speed visual tracking.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_neuro_v1',
          storyId: 'sty_pick_neuromorphic_01',
          versionNumber: 1,
          title:
            'Neuromorphic AI Chips Cut Edge Inference Power by 90% in Drone and Satellite Tests',
          summary:
            'Event-based spiking neural network silicon delivers sub-watt real-time computer vision without thermal throttling in extreme environments.',
          changeSummary: 'Initial publication.',
          blocks: [],
          authorId: 'usr_chatgpt_agent',
          clientType: 'chatgpt',
          createdAt: '2026-10-02T11:15:00Z',
        },
      ],
    },

    // Story 15: Picks For You — CRISPR Clinical Milestone (Summary, Lead, Quote)
    {
      story: {
        id: 'sty_pick_crispr_01',
        organizationId: 'org_default',
        slug: 'in-vivo-crispr-gene-therapy-cardiomyopathy-trial',
        title:
          'Targeted In-Vivo CRISPR Therapy Reverses Rare Hereditary Cardiomyopathy in Clinical Trials',
        summary:
          'Phase 3 clinical trial demonstrates 94% restoration of cardiac muscle protein expression without off-target double-strand breaks.',
        status: 'PUBLISHED',
        articleType: 'science',
        authorId: 'usr_journalist_amara',
        createdByClient: 'human_web',
        createdVia: 'web',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T11:30:00Z',
        createdAt: '2026-10-02T10:00:00Z',
        updatedAt: '2026-10-02T11:30:00Z',
        topicIds: ['top_biotechnology', 'top_healthcare'],
        entityIds: ['ent_who'],
        sourceIds: ['src_nature_01'],
        blocks: [
          {
            id: 'blk_crispr_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Therapeutic Trial Results',
              bulletPoints: [
                'Lipid nanoparticle delivery system achieves organ-specific cardiac tropism.',
                'Base editing repairs single-nucleotide pathogenic mutation with 94.2% efficiency.',
                'Longitudinal biopsies verify zero off-target genomic insertions across 12-month follow-up.',
              ],
            },
          },
          {
            id: 'blk_crispr_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'BOSTON — Genetic medicine marked a watershed triumph as researchers reported that systemic lipid-nanoparticle infusion successfully corrected hereditary cardiomyopathy in 48 trial patients, reversing progressive ventricular stiffness.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_crispr_v1',
          storyId: 'sty_pick_crispr_01',
          versionNumber: 1,
          title:
            'Targeted In-Vivo CRISPR Therapy Reverses Rare Hereditary Cardiomyopathy in Clinical Trials',
          summary:
            'Phase 3 clinical trial demonstrates 94% restoration of cardiac muscle protein expression without off-target double-strand breaks.',
          changeSummary: 'Initial clinical dispatch.',
          blocks: [],
          authorId: 'usr_journalist_amara',
          clientType: 'human_web',
          createdAt: '2026-10-02T11:30:00Z',
        },
      ],
    },

    // Story 16: Picks For You — Lunar Water-Ice Prospecting (Summary, Lead, Quote)
    {
      story: {
        id: 'sty_pick_space_mining_01',
        organizationId: 'org_default',
        slug: 'lunar-prospector-detects-water-ice-shackleton-rim',
        title:
          'Commercial Lunar Prospector Detects Massive Volatile Water-Ice Deposits at Shackleton Rim',
        summary:
          'Neutron spectrometer radar mapping confirms over 600 million metric tons of extractable water-ice reserves in permanently shadowed craters.',
        status: 'PUBLISHED',
        articleType: 'science',
        authorId: 'usr_journalist_david',
        createdByClient: 'human_web',
        createdVia: 'web',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T11:45:00Z',
        createdAt: '2026-10-02T10:15:00Z',
        updatedAt: '2026-10-02T11:45:00Z',
        topicIds: ['top_space_exploration'],
        entityIds: ['ent_isro'],
        sourceIds: ['src_reuters_01'],
        blocks: [
          {
            id: 'blk_lunar_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Prospecting Mission Discoveries',
              bulletPoints: [
                'Synthetic aperture radar penetrates 8 meters beneath lunar regolith.',
                'Estimated propellant production capacity equivalent to 1,200 Mars transit missions.',
                'International commercial mining consortium files joint extraction claims under Artemis Accords.',
              ],
            },
          },
          {
            id: 'blk_lunar_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'BENGALURU/HOUSTON — Deep orbital radar scans of the lunar south pole have confirmed subterranean glaciers exceeding 600 million tons of pure water ice, transforming long-term deep-space exploration economics.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_lunar_v1',
          storyId: 'sty_pick_space_mining_01',
          versionNumber: 1,
          title:
            'Commercial Lunar Prospector Detects Massive Volatile Water-Ice Deposits at Shackleton Rim',
          summary:
            'Neutron spectrometer radar mapping confirms over 600 million metric tons of extractable water-ice reserves in permanently shadowed craters.',
          changeSummary: 'Space exploration report.',
          blocks: [],
          authorId: 'usr_journalist_david',
          clientType: 'human_web',
          createdAt: '2026-10-02T11:45:00Z',
        },
      ],
    },

    // Story 17: Picks For You — Sodium-Ion Grid Megapacks (Summary, Lead, Quote)
    {
      story: {
        id: 'sty_pick_grid_storage_01',
        organizationId: 'org_default',
        slug: 'sodium-ion-megapacks-surpass-lithium-grid-storage',
        title:
          'Next-Gen Sodium-Ion Megapacks Surpass Lithium in Long-Duration Grid Frequency Balancing',
        summary:
          'Utility operators deploy 1.2 GWh non-flammable sodium-ion storage system, reducing Levelized Cost of Storage to $42 per megawatt-hour.',
        status: 'PUBLISHED',
        articleType: 'science',
        authorId: 'usr_editor',
        createdByClient: 'human_web',
        createdVia: 'web',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T12:00:00Z',
        createdAt: '2026-10-02T10:30:00Z',
        updatedAt: '2026-10-02T12:00:00Z',
        topicIds: ['top_clean_energy', 'top_climate_transition'],
        entityIds: ['ent_iter'],
        sourceIds: ['src_bloomberg_01'],
        blocks: [
          {
            id: 'blk_grid_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Storage Economics & Safety',
              bulletPoints: [
                'Abundant non-toxic raw material eliminates cobalt and nickel supply chain bottlenecks.',
                'Thermal runaway risk reduced to near zero through Prussian blue analogue cathode chemistry.',
                'Round-trip efficiency verified at 91.5% across 4,000 accelerated stress cycles.',
              ],
            },
          },
          {
            id: 'blk_grid_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'MELBOURNE/PHOENIX — In the largest non-lithium utility installation to date, electrical transmission operators interconnected a 1.2 gigawatt-hour sodium-ion battery park, proving that abundant sea-salt derivatives can reliably anchor renewable electrical grids.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_grid_v1',
          storyId: 'sty_pick_grid_storage_01',
          versionNumber: 1,
          title:
            'Next-Gen Sodium-Ion Megapacks Surpass Lithium in Long-Duration Grid Frequency Balancing',
          summary:
            'Utility operators deploy 1.2 GWh non-flammable sodium-ion storage system, reducing Levelized Cost of Storage to $42 per megawatt-hour.',
          changeSummary: 'Energy storage dispatch.',
          blocks: [],
          authorId: 'usr_editor',
          clientType: 'human_web',
          createdAt: '2026-10-02T12:00:00Z',
        },
      ],
    },

    // Story 18: Picks For You — Quantum Key Distribution (Summary, Lead, Quote)
    {
      story: {
        id: 'sty_pick_quantum_crypto_01',
        organizationId: 'org_default',
        slug: 'quantum-key-distribution-satellite-network-banking',
        title:
          'Quantum Key Distribution Satellite Network Shields Cross-Border Banking Settlements',
        summary:
          'Entangled photon downlinks achieve 1.2 Mbps secret key exchange across 7,000 kilometers, establishing post-quantum banking security.',
        status: 'PUBLISHED',
        articleType: 'technology',
        authorId: 'usr_spark_agent',
        createdByClient: 'gemini_spark',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-10-02T12:15:00Z',
        createdAt: '2026-10-02T10:45:00Z',
        updatedAt: '2026-10-02T12:15:00Z',
        topicIds: ['top_quantum_computing', 'top_macroeconomics'],
        entityIds: ['ent_cern'],
        sourceIds: ['src_ft_01', 'src_nature_01'],
        blocks: [
          {
            id: 'blk_qkd_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Quantum Encryption Highlights',
              bulletPoints: [
                'Information-theoretic security immune to Shor’s quantum algorithm attacks.',
                'Satellite-to-ground optical tracking locks beam drift within 1.4 microradians.',
                'Immediate failover adoption across 14 central and commercial clearing nodes.',
              ],
            },
          },
          {
            id: 'blk_qkd_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'GENEVA/LONDON — Multilateral clearing authorities have initiated the first continuous quantum-secured financial communications corridor, using low-Earth orbit satellites transmitting entangled photon pairs to secure inter-bank payment instructions.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_qkd_v1',
          storyId: 'sty_pick_quantum_crypto_01',
          versionNumber: 1,
          title:
            'Quantum Key Distribution Satellite Network Shields Cross-Border Banking Settlements',
          summary:
            'Entangled photon downlinks achieve 1.2 Mbps secret key exchange across 7,000 kilometers, establishing post-quantum banking security.',
          changeSummary: 'Quantum network deployment.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-10-02T12:15:00Z',
        },
      ],
    },
  ];

  for (const item of storiesToSeed) {
    const existingStory = await db.stories.findById(item.story.id);
    if (!existingStory) {
      await db.stories.create(item.story);
      for (const ver of item.versions) {
        await db.stories.createVersion(ver);
      }
    }
  }

  // 7. Global Ongoing Events (4 Structured Real-World Events)
  const events: Event[] = [
    {
      id: 'evt_brics_summit_2026',
      organizationId: 'org_default',
      slug: 'brics-new-delhi-summit-2026',
      title: '2026 New Delhi Multilateral Economic Accord & Expansion Plenary',
      summary:
        'Formal diplomatic summit of member nations negotiating cross-border trade clearing protocols and local currency reserves.',
      status: 'ACTIVE',
      occurredAt: '2026-09-26T08:00:00Z',
      location: 'Bharat Mandapam, New Delhi',
      coordinates: [77.209, 28.6139],
      topicIds: ['top_brics_2026', 'top_geopolitics'],
      entityIds: ['ent_india'],
      storyIds: ['sty_brics_flagship'],
      sourceIds: ['src_mea_gov', 'src_reuters_01'],
      createdAt: '2026-09-20T08:00:00Z',
      updatedAt: '2026-09-26T10:00:00Z',
    },
    {
      id: 'evt_cop31_climate',
      organizationId: 'org_default',
      slug: 'cop31-climate-summit',
      title: 'COP31 World Climate Action Summit & Grid Energy Integration',
      summary:
        'Global climate leaders ratify fast-track regulatory clearances for long-duration grid battery storage and fusion safety frameworks.',
      status: 'ACTIVE',
      occurredAt: '2026-10-01T09:00:00Z',
      location: 'Antalya Convention Centre, Turkey',
      coordinates: [30.7133, 36.8969],
      topicIds: ['top_climate_transition', 'top_energy_fusion'],
      entityIds: ['ent_eu'],
      storyIds: ['sty_climate_01', 'sty_fusion_01'],
      sourceIds: ['src_nature_01'],
      createdAt: '2026-09-25T08:00:00Z',
      updatedAt: '2026-10-01T12:00:00Z',
    },
    {
      id: 'evt_artemis_lunar',
      organizationId: 'org_default',
      slug: 'artemis-lunar-gateway-deployment',
      title: 'Artemis International Lunar Gateway Orbital Deployment',
      summary:
        'Multi-agency insertion of the permanent crew-tended station into lunar near-rectilinear halo orbit.',
      status: 'ACTIVE',
      occurredAt: '2026-10-01T14:00:00Z',
      location: 'Cape Canaveral / Lunar Halo',
      coordinates: [-80.6077, 28.3922],
      topicIds: ['top_space_exploration'],
      entityIds: ['ent_usa', 'ent_eu', 'ent_isro'],
      storyIds: ['sty_space_01'],
      sourceIds: ['src_esa_01'],
      createdAt: '2026-09-28T08:00:00Z',
      updatedAt: '2026-10-01T18:00:00Z',
    },
    {
      id: 'evt_ai_safety_summit',
      organizationId: 'org_default',
      slug: 'global-ai-safety-convention-geneva',
      title: 'Global Convention on Autonomous Agent Verification & Compute Governance',
      summary:
        'Treaty drafting conference establishing formal verification standards and non-proliferation protocols for frontier models.',
      status: 'ACTIVE',
      occurredAt: '2026-09-30T10:00:00Z',
      location: 'Palais des Nations, Geneva',
      coordinates: [6.1432, 46.2044],
      topicIds: ['top_ai_agents', 'top_cybersecurity'],
      entityIds: ['ent_deepmind', 'ent_openai'],
      storyIds: ['sty_ai_01'],
      sourceIds: ['src_mit_tech_01'],
      createdAt: '2026-09-25T08:00:00Z',
      updatedAt: '2026-09-30T10:00:00Z',
    },
  ];

  for (const evt of events) {
    const existing = await db.events.findById(evt.id, evt.organizationId);
    if (!existing) {
      await db.events.create(evt);
    }
  }

  // 8. Story Clusters & Multi-Perspective Coverage (2 Full Coverage Topics)
  const clusters: StoryCluster[] = [
    {
      id: 'cls_brics_trade',
      organizationId: 'org_default',
      title: 'BRICS Multi-Currency Trade Settlement Architecture',
      summary:
        'Comprehensive multi-angle coverage of international local-currency trade clearing protocols and sovereign foreign-exchange corridors.',
      leadStoryId: 'sty_brics_flagship',
      storyIds: ['sty_brics_flagship', 'sty_markets_01'],
      topic: 'top_brics_2026',
      category: 'business',
      perspectives: [
        {
          storyId: 'sty_brics_flagship',
          publisher: 'Reuters Global Wire',
          headline: 'Member States Enact Bilateral Clearing Accords with Immediate Ratification',
          excerpt:
            'Delegates emphasized that cross-border settlements in domestic currencies represent a strategic step in mitigating sovereign payment risks.',
          sourceType: 'wire',
          url: 'https://reuters.example.com/world/brics-summit-accord-2026',
          timeAgo: '4 hours ago',
          angle: 'institutional',
          stance: 'Ratification is a historic turning point for South-South trade liquidity.',
        },
        {
          storyId: 'sty_markets_01',
          publisher: 'Financial Times',
          headline: 'Western Currency Desks Evaluate De-Dollarization Trajectory',
          excerpt:
            'While local clearing agreements lower friction, structural reserve holding behavior will require deep liquidity guarantees.',
          sourceType: 'analysis',
          url: 'https://ft.com/content/sovereign-liquidity-grid-clearing-analysis-2026',
          timeAgo: '2 hours ago',
          angle: 'analytical',
          stance: 'Execution depends on currency volatility collars and market depth.',
        },
        {
          storyId: 'sty_brics_flagship',
          publisher: 'The Hindu',
          headline: 'Asian Clearing Corridors Remove Third-Party Settlement Friction',
          excerpt:
            'Reserve bank operational directives allow direct bank-to-bank ledger matching without dollar routing.',
          sourceType: 'regional',
          url: 'https://thehindu.com/news/national/india-multilateral-trade-accord-2026',
          timeAgo: '1 hour ago',
          angle: 'grassroots',
          stance: 'Exporters and manufacturers benefit from reduced hedging costs.',
        },
      ],
      timeline: [
        {
          date: 'Sep 26, 08:00 UTC',
          event: 'Draft Multilateral Clearing Protocol initialed by finance ministers',
          source: 'Summit Secretariat',
          storyId: 'sty_brics_flagship',
        },
        {
          date: 'Sep 26, 10:00 UTC',
          event: 'Heads of State execute New Delhi Declaration',
          source: 'Ministry of External Affairs',
          storyId: 'sty_brics_flagship',
        },
        {
          date: 'Sep 29, 14:00 UTC',
          event: 'Central monetary authorities activate bilateral clearing grid',
          source: 'Bloomberg Markets',
          storyId: 'sty_markets_01',
        },
      ],
      createdAt: '2026-09-26T08:00:00Z',
      updatedAt: '2026-09-29T15:00:00Z',
    },
    {
      id: 'cls_ai_workforce',
      organizationId: 'org_default',
      title: 'Autonomous AI Agent Governance & Infrastructure Adoption',
      summary:
        'Evaluating the rise of formally verified autonomous code-generation agents in mission-critical national infrastructure.',
      leadStoryId: 'sty_ai_01',
      storyIds: ['sty_ai_01', 'sty_semi_01'],
      topic: 'top_ai_agents',
      category: 'technology',
      perspectives: [
        {
          storyId: 'sty_ai_01',
          publisher: 'MIT Technology Review',
          headline: 'Formal Verification Eliminates Synthetic Hallucination in Code Gates',
          excerpt:
            'Testing algorithms mathematically provable invariants guarantees that autonomous software generates zero unhandled exceptions.',
          sourceType: 'academic',
          url: 'https://technologyreview.com/2026/09/30/verifiable-agent-verification-protocols',
          timeAgo: '6 hours ago',
          angle: 'scientific',
          stance: 'Rigorous SMT-solving overcomes historical safety concerns.',
        },
        {
          storyId: 'sty_semi_01',
          publisher: 'TechCrunch',
          headline: 'Foundries Accelerate Chiplet Tape-Outs Using AI Verification Teams',
          excerpt:
            'Semiconductor designers report 3x faster design-rule checking cycles using autonomous agent suites.',
          sourceType: 'industry',
          url: 'https://techcrunch.com/2026/09/27/semiconductor-consortium-2nm-patent-pool',
          timeAgo: '3 hours ago',
          angle: 'industry',
          stance: 'Efficiency gains are essential to meeting 2nm lithography deadlines.',
        },
      ],
      timeline: [
        {
          date: 'Sep 27, 11:00 UTC',
          event: 'Semiconductor coalition ratifies AI-assisted chiplet packaging framework',
          source: 'TechCrunch',
          storyId: 'sty_semi_01',
        },
        {
          date: 'Sep 30, 09:15 UTC',
          event: 'Benchmark proves 99.98% zero-defect rate in critical power grid telemetry',
          source: 'MIT Tech Review',
          storyId: 'sty_ai_01',
        },
      ],
      createdAt: '2026-09-27T11:00:00Z',
      updatedAt: '2026-09-30T10:00:00Z',
    },
    {
      id: 'cls_robotics_factory',
      organizationId: 'org_default',
      title: 'Humanoid Robotics Assembly & Factory Automation',
      summary:
        'Continuous 24-hour humanoid robotics operations transform automotive chassis and battery assembly lines.',
      leadStoryId: 'sty_pick_robotics_01',
      storyIds: ['sty_pick_robotics_01', 'sty_ai_01'],
      topic: 'top_ai_agents',
      category: 'technology',
      perspectives: [
        {
          storyId: 'sty_pick_robotics_01',
          publisher: 'TechCrunch',
          headline: 'Humanoid Robots Move from Lab Pilots to 24/7 Factory Work',
          excerpt: 'Automotive OEMs integrate tactile bipedal units into battery module assembly.',
          sourceType: 'industry',
          url: 'https://techcrunch.com/2026/10/02/humanoid-robotics-automotive-assembly',
          timeAgo: '2 hours ago',
          angle: 'industry',
          stance: 'Efficiency and dexterity milestones confirm long-term economic viability.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 09:00 UTC',
          event: 'Pilot plant completes 120,000 incident-free autonomous hours',
          source: 'Stuttgart Automation Consortium',
          storyId: 'sty_pick_robotics_01',
        },
      ],
      createdAt: '2026-10-02T09:00:00Z',
      updatedAt: '2026-10-02T11:00:00Z',
    },
    {
      id: 'cls_neuromorphic_silicon',
      organizationId: 'org_default',
      title: 'Neuromorphic Silicon & Sub-Watt Edge AI Intelligence',
      summary:
        'Event-based spiking neural network silicon delivers sub-watt real-time vision for drones and orbital satellites.',
      leadStoryId: 'sty_pick_neuromorphic_01',
      storyIds: ['sty_pick_neuromorphic_01', 'sty_semi_01'],
      topic: 'top_semiconductors',
      category: 'technology',
      perspectives: [
        {
          storyId: 'sty_pick_neuromorphic_01',
          publisher: 'Nature Electronics',
          headline: 'Bio-Inspired Spiking Silicon Cuts Sensor Power Draw 90%',
          excerpt:
            'Asynchronous event vision eliminates synchronous clock heat in extreme conditions.',
          sourceType: 'academic',
          url: 'https://nature.com/articles/s41928-026-00412-x',
          timeAgo: '3 hours ago',
          angle: 'scientific',
          stance: 'Physical emulation of mammalian retinal neurons solves edge power bottlenecks.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 09:30 UTC',
          event: 'Orbital and drone flight testing confirms sub-450mW real-time inference',
          source: 'Zurich AI Hardware Summit',
          storyId: 'sty_pick_neuromorphic_01',
        },
      ],
      createdAt: '2026-10-02T09:30:00Z',
      updatedAt: '2026-10-02T11:15:00Z',
    },
    {
      id: 'cls_crispr_therapeutics',
      organizationId: 'org_default',
      title: 'Precision In-Vivo Gene Editing Reverses Genetic Cardiomyopathy',
      summary:
        'Targeted lipid-nanoparticle base editing achieves 94% correction efficiency in clinical trials.',
      leadStoryId: 'sty_pick_crispr_01',
      storyIds: ['sty_pick_crispr_01'],
      topic: 'top_biotechnology',
      category: 'health',
      perspectives: [
        {
          storyId: 'sty_pick_crispr_01',
          publisher: 'The Lancet',
          headline: 'Systemic Lipid Nanoparticle In-Vivo Gene Correction Validated',
          excerpt:
            'Phase 3 multicenter trial demonstrates safety and cardiac muscle function restoration.',
          sourceType: 'academic',
          url: 'https://thelancet.com/journals/lancet/article/PIIS0140-6736(26)01982-3',
          timeAgo: '4 hours ago',
          angle: 'scientific',
          stance: 'Clean base-editing technology avoids risky double-strand DNA breaks.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 10:00 UTC',
          event: 'Phase 3 trial unblinds 12-month biopsy data confirming 94% correction',
          source: 'Global Health Consortium',
          storyId: 'sty_pick_crispr_01',
        },
      ],
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-02T11:30:00Z',
    },
    {
      id: 'cls_lunar_resources',
      organizationId: 'org_default',
      title: 'Lunar South Pole Volatile Water-Ice Commercialization',
      summary:
        'Neutron spectrometer radar mapping confirms 600 million metric tons of extractable water ice in Shackleton Crater.',
      leadStoryId: 'sty_pick_space_mining_01',
      storyIds: ['sty_pick_space_mining_01', 'sty_liveblog_starship'],
      topic: 'top_space_exploration',
      category: 'science',
      perspectives: [
        {
          storyId: 'sty_pick_space_mining_01',
          publisher: 'Aviation Week',
          headline: 'In-Situ Propellant Economics Transform Deep Space Architecture',
          excerpt: 'Extractable ice enables high-cadence refueling depots at lunar gateway orbits.',
          sourceType: 'industry',
          url: 'https://aviationweek.com/space/lunar-ice-reserves-prospecting-survey',
          timeAgo: '5 hours ago',
          angle: 'industry',
          stance:
            'Commercial extraction rights will determine next-generation interplanetary cadence.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 10:15 UTC',
          event: 'Synthetic aperture radar validates subterranean glaciers across 8m depth',
          source: 'Artemis Science Directorate',
          storyId: 'sty_pick_space_mining_01',
        },
      ],
      createdAt: '2026-10-02T10:15:00Z',
      updatedAt: '2026-10-02T11:45:00Z',
    },
    {
      id: 'cls_sodium_grid',
      organizationId: 'org_default',
      title: 'Long-Duration Sodium-Ion Grid Energy Storage Breakthrough',
      summary:
        'Interconnection of 1.2 GWh non-flammable sodium-ion megapacks demonstrates low-cost renewable grid stabilization.',
      leadStoryId: 'sty_pick_grid_storage_01',
      storyIds: ['sty_pick_grid_storage_01', 'sty_fusion_01'],
      topic: 'top_clean_energy',
      category: 'science',
      perspectives: [
        {
          storyId: 'sty_pick_grid_storage_01',
          publisher: 'Bloomberg Energy',
          headline: 'Sodium-Ion Battery Storage Undercuts Lithium on Utility Economics',
          excerpt: 'Levelized cost of storage falls to $42/MWh with non-toxic, abundant minerals.',
          sourceType: 'industry',
          url: 'https://bloomberg.com/energy/sodium-ion-grid-utility-revolution',
          timeAgo: '6 hours ago',
          angle: 'industry',
          stance: 'Prussian blue cathode design provides immune safety against thermal runaway.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 10:30 UTC',
          event: '1.2 GWh utility park completes 4,000-cycle frequency response validation',
          source: 'Energy Transition Registry',
          storyId: 'sty_pick_grid_storage_01',
        },
      ],
      createdAt: '2026-10-02T10:30:00Z',
      updatedAt: '2026-10-02T12:00:00Z',
    },
    {
      id: 'cls_quantum_security',
      organizationId: 'org_default',
      title: 'Quantum Key Distribution & Inter-Bank Settlement Protection',
      summary:
        'Entangled photon satellite links secure cross-border multilateral banking settlements against post-quantum decryptors.',
      leadStoryId: 'sty_pick_quantum_crypto_01',
      storyIds: ['sty_pick_quantum_crypto_01', 'sty_quantum_01'],
      topic: 'top_quantum_computing',
      category: 'technology',
      perspectives: [
        {
          storyId: 'sty_pick_quantum_crypto_01',
          publisher: 'Financial Times',
          headline: 'Central Banks Pilot Entangled Photon Crypto Links for Settlement Rails',
          excerpt:
            'QKD downlinks achieve 1.2 Mbps secret key rate across intercontinental gateways.',
          sourceType: 'industry',
          url: 'https://ft.com/technology/quantum-secured-interbank-settlement-clearing',
          timeAgo: '7 hours ago',
          angle: 'analytical',
          stance:
            'Physics-based encryption guarantees long-term immunity against algorithmic cryptanalysis.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 10:45 UTC',
          event: 'Satellite-to-ground downlink demonstrates 1.4 microradian beam lock',
          source: 'European Quantum Consortium',
          storyId: 'sty_pick_quantum_crypto_01',
        },
      ],
      createdAt: '2026-10-02T10:45:00Z',
      updatedAt: '2026-10-02T12:15:00Z',
    },
  ];

  for (const cluster of clusters) {
    const existing = await db.clusters.getById(cluster.id, cluster.organizationId);
    if (!existing) {
      await db.clusters.create(cluster);
    }
  }

  // 9. Liveblog Entries (5 Chronological Telemetry Updates for Starship Test Flight)
  const liveblogEntries: LiveblogEntry[] = [
    {
      id: 'live_entry_01',
      storyId: 'sty_liveblog_starship',
      headline: 'T-15m: Propellant Loading Complete Across Ship and Booster',
      content:
        'All 4,500 metric tons of densified liquid methane and sub-cooled liquid oxygen have loaded successfully into Super Heavy Booster 14 and Starship 31.',
      isKeyEvent: true,
      author: {
        id: 'usr_spark_agent',
        name: 'Gemini Spark Wire Reporter',
        avatarUrl:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
      },
      timestamp: '2026-10-02T10:15:00Z',
    },
    {
      id: 'live_entry_02',
      storyId: 'sty_liveblog_starship',
      headline: 'T-5m: Terminal Countdown Auto-Sequence Commences',
      content:
        'Ground launch sequencer has handed over primary countdown command to autonomous vehicle avionics computers.',
      isKeyEvent: false,
      author: {
        id: 'usr_editor',
        name: 'Marcus Vance',
      },
      timestamp: '2026-10-02T10:25:00Z',
    },
    {
      id: 'live_entry_03',
      storyId: 'sty_liveblog_starship',
      headline: 'LIFTOFF! All 33 Raptor 3 Engines Ignite Cleanly',
      content:
        'Starship clears the orbital launch mount at Starbase generating 16.7 million pounds of thrust. Acoustic suppression water deluge performed nominally.',
      isKeyEvent: true,
      author: {
        id: 'usr_spark_agent',
        name: 'Gemini Spark Wire Reporter',
      },
      timestamp: '2026-10-02T10:30:00Z',
    },
    {
      id: 'live_entry_04',
      storyId: 'sty_liveblog_starship',
      headline: 'T+2m 45s: Hot-Staging Ring Separation Verified Clean',
      content:
        'Ship stage engines ignited while still attached to the booster ring. Super Heavy executed flip maneuver toward the Gulf of Mexico return trajectory.',
      isKeyEvent: true,
      author: {
        id: 'usr_editor',
        name: 'Marcus Vance',
      },
      timestamp: '2026-10-02T10:32:45Z',
    },
    {
      id: 'live_entry_05',
      storyId: 'sty_liveblog_starship',
      headline: 'T+8m 10s: Super Heavy Booster Completes Soft Touchdown Catch Sequence',
      content:
        'The booster reignited center 3 Raptors for a precise landing burn and executed zero-velocity hover before touchdown.',
      isKeyEvent: true,
      author: {
        id: 'usr_spark_agent',
        name: 'Gemini Spark Wire Reporter',
      },
      timestamp: '2026-10-02T10:38:10Z',
    },
  ];

  for (const entry of liveblogEntries) {
    try {
      await db.liveblogs.addEntry(entry);
    } catch {
      // Best-effort for existing liveblog entry
    }
  }

  // 10. Curated Collections (3 Public Reading Anthologies)
  const collections = [
    {
      id: 'col_ai_revolution',
      name: 'The Autonomous Frontier: AI Agents & Advanced Silicon',
      slug: 'autonomous-frontier-ai-silicon',
      description:
        'A comprehensive dossier exploring the intersection of autonomous software agents, formal code verification, and 2nm gate-all-around fabrication.',
      curatorId: 'usr_admin',
      curatorName: 'Elena Rostova',
      isPublic: true,
      storyIds: ['sty_ai_01', 'sty_semi_01', 'sty_quantum_01'],
    },
    {
      id: 'col_geopolitics_macro',
      name: 'Geoeconomic Shifts: Multi-Currency Systems & Sovereign Alliances',
      slug: 'geoeconomic-shifts-sovereign-alliances',
      description:
        'Essential reporting on the 2026 New Delhi multilateral summit, bilateral liquidity facilities, and local currency trade settlement.',
      curatorId: 'usr_editor',
      curatorName: 'Marcus Vance',
      isPublic: true,
      storyIds: ['sty_brics_flagship', 'sty_markets_01'],
    },
    {
      id: 'col_clean_tech',
      name: 'Deep Science & Energy Horizons',
      slug: 'deep-science-energy-horizons',
      description:
        'Investigative accounts of magnetic confinement fusion milestones, topological quantum computing, and solid-state grid storage.',
      curatorId: 'usr_journalist_david',
      curatorName: 'David Chen',
      isPublic: true,
      storyIds: ['sty_fusion_01', 'sty_climate_01', 'sty_quantum_01'],
    },
  ];

  for (const col of collections) {
    const existing = await db.collections.findById(col.id);
    if (!existing) {
      await db.collections.create(col);
    }
  }

  // 11. Reader Engagement (Comments, Reactions, Bookmarks, and Reading Progress)
  const commentsToSeed: Comment[] = [
    {
      id: 'cmt_brics_01',
      storyId: 'sty_brics_flagship',
      organizationId: 'org_default',
      authorId: 'usr_reader_aravind',
      authorName: 'Aravind Patel',
      authorRole: 'reader',
      content:
        'The operationalization of bilateral currency clearing accounts directly addresses the hedging overhead that has constrained South-South trade for decades. Excellent D3 chart visualization!',
      status: 'approved',
      likesCount: 38,
      createdAt: '2026-09-26T11:00:00Z',
      updatedAt: '2026-09-26T11:00:00Z',
    },
    {
      id: 'cmt_brics_02',
      storyId: 'sty_brics_flagship',
      organizationId: 'org_default',
      authorId: 'usr_journalist_david',
      authorName: 'David Chen',
      authorRole: 'journalist',
      content:
        'Key detail to watch in Q4 will be the automated liquidity swap triggers between member central banks when bilateral balances cross agreed reserve thresholds.',
      status: 'approved',
      likesCount: 22,
      createdAt: '2026-09-26T12:30:00Z',
      updatedAt: '2026-09-26T12:30:00Z',
    },
    {
      id: 'cmt_ai_01',
      storyId: 'sty_ai_01',
      organizationId: 'org_default',
      authorId: 'usr_reader_sarah',
      authorName: 'Sarah Jenkins',
      authorRole: 'subscriber',
      content:
        'Mathematical formal verification (SMT solving) is the only realistic bridge between generative coding agents and critical infrastructure deployment. Glad to see the whitepaper highlights included.',
      status: 'approved',
      likesCount: 54,
      createdAt: '2026-09-30T10:15:00Z',
      updatedAt: '2026-09-30T10:15:00Z',
    },
    {
      id: 'cmt_fusion_01',
      storyId: 'sty_fusion_01',
      organizationId: 'org_default',
      authorId: 'usr_journalist_amara',
      authorName: 'Amara Okafor',
      authorRole: 'journalist',
      content:
        '120 seconds of continuous plasma confinement proves that high-temperature superconducting magnets can overcome the heat dissipation barriers that hindered earlier stellarators.',
      status: 'approved',
      likesCount: 45,
      createdAt: '2026-09-28T09:00:00Z',
      updatedAt: '2026-09-28T09:00:00Z',
    },
  ];

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

  // 13. Comprehensive Fact Checks (8 Claims across Truth Spectrum)
  const factChecks: FactCheckClaim[] = [
    {
      id: 'fc_01',
      claim: 'Solar storms completely dismantled international undersea internet cables.',
      claimant: 'Viral Social Media Posts & Unverified Threads',
      rating: 'FALSE',
      summary:
        'Undersea fiber-optic cables operate via optical photon pulses entirely immune to geomagnetic fluctuations. Only terrestrial repeater power units experienced minor transient surges.',
      checker: 'GlobalPulse Verification Desk',
      sources: ['NOAA Space Weather Prediction Center', 'International Cable Protection Committee'],
      url: 'https://news.platform/fact-checks/fc_01',
      checkedAt: '2026-09-27T14:00:00Z',
    },
    {
      id: 'fc_02',
      claim: 'Central Banks quietly agreed to eliminate physical cash currencies by 2027.',
      claimant: 'Financial Blog Speculation & Unverified Newsletters',
      rating: 'FALSE',
      summary:
        'Central Bank Digital Currencies (CBDCs) are experimental sovereign supplements. Official multilateral frameworks explicitly mandate cash availability for financial inclusion.',
      checker: 'Reuters Fact Check & GlobalPulse Verification Desk',
      sources: ['Bank for International Settlements', 'Federal Reserve Board Policy Release'],
      url: 'https://news.platform/fact-checks/fc_02',
      checkedAt: '2026-09-28T10:00:00Z',
    },
    {
      id: 'fc_03',
      claim: 'CERN set a new quantum entanglement record in particle collision density.',
      claimant: 'Physics Conference Dispatches & Science Journals',
      rating: 'TRUE',
      summary:
        'Peer-reviewed measurements at the Large Hadron Collider confirm unprecedented quantum correlation metrics at TeV energy scales.',
      checker: 'Science Verification Network',
      sources: ['Physical Review Letters', 'CERN Directorate'],
      url: 'https://news.platform/fact-checks/fc_03',
      checkedAt: '2026-09-28T16:00:00Z',
    },
    {
      id: 'fc_04',
      claim:
        'DeepMind AlphaFold enzyme breakdown completely dissolves marine microplastics in 48 hours.',
      claimant: 'Environmental Tech Forum Viral Clips',
      rating: 'MOSTLY_TRUE',
      summary:
        'Laboratory tests demonstrate accelerated polyethylene terephthalate (PET) ester bond hydrolysis within 48 hours; however, industrial scalable deployment in open oceanic salt water is still under phase 2 field trials.',
      checker: 'GlobalPulse Verification Desk',
      sources: ['Nature Catalysis', 'Google DeepMind BioSciences Lab'],
      url: 'https://news.platform/fact-checks/fc_04',
      checkedAt: '2026-09-29T11:00:00Z',
    },
    {
      id: 'fc_05',
      claim: 'Global atmospheric warming entered a multi-year pause period in 2026.',
      claimant: 'Pundit Commentary on Cable Broadcasts',
      rating: 'FALSE',
      summary:
        'Ocean heat content and surface atmospheric metrics recorded the three highest thermodynamic anomalies on record, with zero empirical evidence of a pause.',
      checker: 'World Meteorological Organization Verification Service',
      sources: ['Copernicus Climate Change Service', 'NOAA Climate Monitoring'],
      url: 'https://news.platform/fact-checks/fc_05',
      checkedAt: '2026-09-29T15:00:00Z',
    },
    {
      id: 'fc_06',
      claim:
        'Solid-state battery cells sustain 98% capacity after 3,000 continuous full discharge cycles.',
      claimant: 'Automotive Foundry Press Release',
      rating: 'TRUE',
      summary:
        'Independent lab testing by national laboratories confirms ceramic electrolyte structures eliminate lithium dendrite formation, maintaining 98.2% capacity over 3,000 cycles.',
      checker: 'Global Energy Storage Verification Panel',
      sources: ['National Renewable Energy Laboratory (NREL)', 'Fraunhofer Institute'],
      url: 'https://news.platform/fact-checks/fc_06',
      checkedAt: '2026-09-30T12:00:00Z',
    },
    {
      id: 'fc_07',
      claim: 'A single AI search query consumes five liters of clean drinking water for cooling.',
      claimant: 'Viral Infographics on Instagram & X',
      rating: 'MOSTLY_FALSE',
      summary:
        'Modern closed-loop datacenter liquid cooling cycles recirculate treated chilled water. Median net evaporated consumption per prompt is under 0.004 liters (approx. half a teaspoon), not five liters.',
      checker: 'GlobalPulse Tech Desk & Datacenter Institute',
      sources: ['Electric Power Research Institute', 'ACM Computing Surveys 2026'],
      url: 'https://news.platform/fact-checks/fc_07',
      checkedAt: '2026-10-01T09:00:00Z',
    },
    {
      id: 'fc_08',
      claim:
        'Commercial 2nm chips will begin high-volume consumer smartphone shipments in Q1 2027.',
      claimant: 'Supply Chain Leak Aggregators',
      rating: 'MIXTURE',
      summary:
        'While risk production wafers have completed tape-out, leading foundries confirmed that volume consumer shipments will occur in Q3 2027 for flagship nodes, with Q1 limited to pilot accelerator test chips.',
      checker: 'Semiconductor Industry Truth Council',
      sources: ['TSMC Investor Relations Disclosures', 'TrendForce Foundry Analysis'],
      url: 'https://news.platform/fact-checks/fc_08',
      checkedAt: '2026-10-01T14:00:00Z',
    },
    {
      id: 'fc_09',
      claim: 'Quantum computers cracked 4096-bit RSA cryptographic keys in 30 seconds.',
      claimant: 'Cybersecurity Rumor Threads & Hacker Forums',
      rating: 'FALSE',
      summary:
        "State-of-the-art quantum processors operate up to 1,200 noisy physical qubits, far below the estimated millions of fault-tolerant logical qubits required by Shor's algorithm for 4096-bit RSA factoring.",
      checker: 'National Cryptographic Verification Alliance',
      sources: ['NIST Post-Quantum Cryptography Consortium', 'MIT Quantum Lab'],
      url: 'https://news.platform/fact-checks/fc_09',
      checkedAt: '2026-10-02T11:00:00Z',
    },
    {
      id: 'fc_10',
      claim:
        'Formal mathematical verification guarantees zero logical flaws in autonomous software code deployment.',
      claimant: 'Enterprise DevOps Vendor Whitepapers',
      rating: 'MOSTLY_TRUE',
      summary:
        'SMT solvers mathematically prove boundary conditions and typed safety invariants; however, specifications written with flawed requirements or underspecified constraints can still yield logic errors.',
      checker: 'ACM Formal Methods Bureau',
      sources: ['Association for Computing Machinery', 'IEEE Software Engineering Journal'],
      url: 'https://news.platform/fact-checks/fc_10',
      checkedAt: '2026-10-02T09:30:00Z',
    },
    {
      id: 'fc_11',
      claim:
        'Advanced High-NA EUV lithography machines were secretly diverted to uncertified fabrication facilities.',
      claimant: 'Geopolitical Investigative Newsletter',
      rating: 'FALSE',
      summary:
        'Satellite logistics tracking, optical serial hashing, and multilateral Wassenaar treaty export telemetry confirm all High-NA tools are physically sealed and accounted for at certified foundries.',
      checker: 'Semiconductor Trade Compliance Bureau',
      sources: ['ASML Investor Disclosures', 'Wassenaar Arrangement Secretariat'],
      url: 'https://news.platform/fact-checks/fc_11',
      checkedAt: '2026-10-01T16:45:00Z',
    },
    {
      id: 'fc_12',
      claim:
        'Small Modular Nuclear Reactors (SMRs) are already powering commercial AI datacenters at gigawatt scale in 2026.',
      claimant: 'Tech Investor Keynote Presentations',
      rating: 'MIXTURE',
      summary:
        'Regulatory permits and site preparation agreements have been executed for datacenter co-location, but physical commercial power generation from SMRs will not reach the grid before late 2028.',
      checker: 'Global Energy & Datacenter Truth Project',
      sources: ['Nuclear Regulatory Commission (NRC)', 'International Energy Agency'],
      url: 'https://news.platform/fact-checks/fc_12',
      checkedAt: '2026-10-01T14:15:00Z',
    },
    {
      id: 'fc_13',
      claim:
        'Generative voice cloning breached biometric voice authentication at tier-1 international banks.',
      claimant: 'Financial Security Podcast',
      rating: 'MOSTLY_TRUE',
      summary:
        'Controlled red-team audits demonstrated synthetic voice models spoofed legacy 2G acoustic verification protocols, prompting banks to mandate multi-factor physical passkeys and behavioral liveness telemetry.',
      checker: 'Banking Cyber Fraud Task Force',
      sources: ['Financial Stability Board', 'European Banking Authority'],
      url: 'https://news.platform/fact-checks/fc_13',
      checkedAt: '2026-09-30T15:20:00Z',
    },
    {
      id: 'fc_14',
      claim:
        'A major orbital satellite collision cascade occurred in low Earth orbit between commercial constellations.',
      claimant: 'Anonymous Aviation Tracker Posts',
      rating: 'FALSE',
      summary:
        'Automated collision-avoidance thrusters performed nominal avoidance burns with minimum miss distances exceeding 4.2 km. Space Command radar logs confirm zero fragmentation events.',
      checker: 'Combined Space Operations Center',
      sources: ['US Space Command (USSPACECOM)', 'European Space Agency SSA'],
      url: 'https://news.platform/fact-checks/fc_14',
      checkedAt: '2026-09-30T10:00:00Z',
    },
    {
      id: 'fc_15',
      claim:
        'Automotive OEMs commenced deliveries of passenger EVs with 1,000-kilometer solid-state batteries.',
      claimant: 'Automotive Influencer Channels',
      rating: 'MIXTURE',
      summary:
        'Pilot test fleets equipped with semi-solid-state cells have achieved 1,000 km test routes, but mass-market commercial consumer deliveries with 100% solid-state ceramic electrolytes remain slated for 2027-2028.',
      checker: 'Automotive Technology Verification Council',
      sources: ['SAE International', 'Society of Motor Manufacturers'],
      url: 'https://news.platform/fact-checks/fc_15',
      checkedAt: '2026-09-29T17:30:00Z',
    },
    {
      id: 'fc_16',
      claim:
        'BRICS member states executed 85% of their mutual bilateral trade without third-party currency conversion in Q3 2026.',
      claimant: 'Economic Summit Commentary',
      rating: 'TRUE',
      summary:
        'Official central monetary balance audits confirm 84.7% of member-to-member merchandise trade cleared through local currency nostro accounts and national payment gateways during Q3 2026.',
      checker: 'GlobalPulse Economic Verification Desk',
      sources: ['Reserve Bank of India Monthly Bulletin', 'Bank for International Settlements'],
      url: 'https://news.platform/fact-checks/fc_16',
      checkedAt: '2026-09-29T11:45:00Z',
    },
    {
      id: 'fc_17',
      claim: 'Graphene sieve nanofiltration cut seawater desalination energy requirements by 70%.',
      claimant: 'Clean Water Innovation Press Releases',
      rating: 'MOSTLY_TRUE',
      summary:
        'Single-atom carbon membrane pilots demonstrated a 68% decrease in hydraulic pressure requirements compared to legacy polyamide reverse osmosis, though membrane durability under biofouling is undergoing 12-month endurance trials.',
      checker: 'International Desalination & Water Bureau',
      sources: ['Nature Water', 'International Desalination Association'],
      url: 'https://news.platform/fact-checks/fc_17',
      checkedAt: '2026-09-28T16:10:00Z',
    },
    {
      id: 'fc_18',
      claim:
        'An autonomous algorithmic trading agent loop triggered an emergency 15-minute trading halt on the Tokyo Stock Exchange.',
      claimant: 'Financial Social Feeds',
      rating: 'TRUE',
      summary:
        'Exchange regulators confirmed automated circuit breakers tripped after high-frequency cross-currency arbitrage agent clusters simultaneously liquidated leveraged yen positions within 42 milliseconds.',
      checker: 'Financial Markets Regulatory Surveillance',
      sources: ['Japan Financial Services Agency', 'Tokyo Stock Exchange Operational Disclosures'],
      url: 'https://news.platform/fact-checks/fc_18',
      checkedAt: '2026-09-28T07:15:00Z',
    },
  ];

  for (const fc of factChecks) {
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
    'Database seeded successfully with enterprise newsroom records (10 Users, 16 Topics, 14 Entities, 8 Publishers, 14 Sources, 18 Stories, 4 Events, 8 Clusters, 5 Liveblog Entries, 3 Collections, 4 Comments, Reactions, Bookmarks, and 18 Fact Checks).'
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
