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
    // Story 1: BRICS Flagship Story (13 blocks: summary, what_changed, 5 paragraphs, 2 headings, chart, timeline, quote, document_viewer)
    {
      story: {
        id: 'sty_brics_flagship',
        organizationId: 'org_default',
        slug: 'brics-expansion-2026-global-economic-realignment',
        title: 'BRICS Expansion 2026: Historic Geoeconomic Shift Finalized in New Delhi',
        summary:
          'Ten member nations formally ratify expansion protocols and introduce a multi-currency trade clearing architecture, reshaping the global economic order.',
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
        topicIds: ['top_brics_2026', 'top_geopolitics', 'top_macroeconomics'],
        entityIds: ['ent_india', 'ent_eu'],
        sourceIds: ['src_reuters_01', 'src_mea_gov', 'src_hindu_01', 'src_ft_01'],
        blocks: [
          {
            id: 'blk_brics_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Executive Briefing: New Delhi Declaration Takeaways',
              bulletPoints: [
                'Ten member nations ratify the 2026 accession protocols, welcoming four new strategic emerging economies into the bloc.',
                'Introduction of the Multilateral Currency Clearing Mesh (MCCM), establishing direct sovereign central bank liquidity swap channels without intermediary third-party conversion.',
                'Combined member GDP now surpasses $41.8 trillion in purchasing-power-parity terms, accounting for 38.4% of total global economic output.',
              ],
            },
          },
          {
            id: 'blk_brics_what_changed',
            blockType: 'what_changed',
            sortOrder: 1,
            data: {
              previousVersionNumber: 1,
              updatedAt: '2026-09-26T10:00:00Z',
              items: [
                {
                  changeType: 'added',
                  description:
                    'Incorporated ratified New Delhi Declaration official excerpts and legal settlement protocols.',
                },
                {
                  changeType: 'updated',
                  description:
                    'Updated D3 economic projection chart reflecting revised purchasing-power output figures.',
                },
                {
                  changeType: 'added',
                  description:
                    'Included interactive timeline of ministerial negotiations and plenary voting results.',
                },
              ],
            },
          },
          {
            id: 'blk_brics_p1',
            blockType: 'paragraph',
            sortOrder: 2,
            data: {
              text: 'NEW DELHI — In a historic unanimous vote at the Bharat Mandapam convention complex, member states of the expanded BRICS alliance formally ratified their comprehensive accession protocols on Saturday morning, concluding twelve months of intensive diplomatic haggling. The landmark accord not only brings four major energy and manufacturing powerhouses into the multilateral fold, but also enacts the long-anticipated New Delhi Declaration, establishing an autonomous local-currency trade clearing architecture designed to insulate South-South commercial corridors from external monetary volatility.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_brics_h1',
            blockType: 'heading',
            sortOrder: 3,
            data: { text: 'Multilateral Clearing Mechanics and Sovereign Swaps', level: 2 },
          },
          {
            id: 'blk_brics_p2',
            blockType: 'paragraph',
            sortOrder: 4,
            data: {
              text: 'At the heart of the technical annexes is the Multilateral Currency Clearing Mesh (MCCM), a distributed interbank messaging and collateral system linking member central banks. Under the ratified framework, bilateral trade contracts in crude energy, industrial fertilizers, and agricultural staples will settle directly across designated sovereign nostro accounts, bypassing legacy correspondent banking corridors in Western financial centers. Participating central monetary authorities will maintain bilateral swap lines backed by pledged sovereign securities, minimizing foreign exchange hedging overhead that has historically burdened emerging market trade.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_brics_chart',
            blockType: 'chart',
            sortOrder: 5,
            data: {
              chartType: 'bar',
              title: 'Combined Member Economic Output ($ Trillion PPP)',
              xAxis: { key: 'year', label: 'Fiscal Year', type: 'category' },
              yAxis: { label: 'Trillion USD Equivalent' },
              series: [{ name: 'Purchasing-Power Output', key: 'gdp', color: '#3b82f6' }],
              values: [
                { year: '2020', gdp: 24.8 },
                { year: '2022', gdp: 29.5 },
                { year: '2024', gdp: 35.2 },
                { year: '2026 Proj', gdp: 41.8 },
              ],
              sourceAttribution: 'World Bank & BRICS Secretariat New Delhi 2026',
            },
          },
          {
            id: 'blk_brics_p3',
            blockType: 'paragraph',
            sortOrder: 6,
            data: {
              text: 'Trade ministers highlighted that merchandise trade between participating economies expanded by 26% year-on-year over the past eighteen months, creating urgent structural demand for friction-free clearing mechanisms. Independent macroeconomic models published by the Bank for International Settlements indicate that avoiding third-currency conversion steps will compress settlement transaction costs by an estimated 140 basis points on volume merchandise shipments, yielding tens of billions in annual working capital efficiencies for participating enterprises.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_brics_timeline',
            blockType: 'timeline',
            sortOrder: 7,
            data: {
              title: 'Summit Progression & Ratification Milestones',
              items: [
                {
                  date: '07:30 UTC',
                  headline: 'Ministerial Legal Drafting Finalized',
                  body: 'Diplomatic envoys reconciled final language across the 48-page technical annex regarding sovereign liquidity swap dispute resolution.',
                },
                {
                  date: '08:45 UTC',
                  headline: 'Central Bank Governors Endorse Clearing Mesh',
                  body: 'The heads of member central monetary authorities executed the operational liquidity protocols behind closed doors.',
                },
                {
                  date: '10:00 UTC',
                  headline: 'Heads of State Ratify New Delhi Declaration',
                  body: 'Unanimous signing ceremony concluded at the plenary hall, formally activating the multilateral accession provisions.',
                },
              ],
            },
          },
          {
            id: 'blk_brics_h2',
            blockType: 'heading',
            sortOrder: 8,
            data: { text: 'Global Capital Repercussions and Currency Dynamics', level: 2 },
          },
          {
            id: 'blk_brics_p4',
            blockType: 'paragraph',
            sortOrder: 9,
            data: {
              text: 'While summit leaders stressed that the initiative does not seek to establish a single synthetic reserve currency, international financial markets responded swiftly. Sovereign bond yields across member nations compressed between 12 and 18 basis points, reflecting anticipated declines in cross-border liquidity risk. Commercial banks in London and Singapore noted an immediate surge in inquiries from institutional trade desks preparing to configure direct bilateral clearing accounts across Asian and Middle Eastern financial nodes.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_brics_quote',
            blockType: 'quote',
            sortOrder: 10,
            data: {
              quote:
                'The operationalization of bilateral currency clearing accounts directly addresses the structural hedging overhead that has constrained South-South trade for decades. This is an evolutionary upgrade to global commercial infrastructure.',
              attribution: 'Aravind Patel',
              title: 'Senior Macroeconomics Fellow, New Delhi Center for Global Policy',
            },
          },
          {
            id: 'blk_brics_p5',
            blockType: 'paragraph',
            sortOrder: 11,
            data: {
              text: 'Looking ahead to the implementation roadmap, the New Delhi Secretariat announced that the first commercial transactions on the Multilateral Currency Clearing Mesh will commence in Q1 2027, starting with maritime energy and fertilizer contracts. A standing technical committee will convene monthly in Mumbai and Dubai to oversee liquidity reserve ratios, ensuring that cross-border clearing balances remain fully collateralized and resistant to speculative foreign exchange contagion.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_brics_doc',
            blockType: 'document_viewer',
            sortOrder: 12,
            data: {
              documentUrl: 'https://mea.gov.in/brics-declaration-2026.htm',
              title: 'Official Treaty: 2026 New Delhi Declaration & Settlement Protocols',
              pageCount: 48,
              documentType: 'treaty',
              description:
                'Certified diplomatic declaration ratified by the plenary heads of state establishing the multilateral currency clearing architecture.',
              highlights: [
                {
                  page: 12,
                  excerpt:
                    'Article 4.2: Cross-border settlements among participating central monetary authorities shall be denominated in sovereign currencies of the contracting parties.',
                  note: 'Core legal basis for local currency clearing',
                },
                {
                  page: 29,
                  excerpt:
                    'Annex C: Standing swap facilities shall automatically execute liquidity injections when net settlement imbalances exceed five billion SDR-equivalent.',
                  note: 'Automated liquidity stabilization rule',
                },
              ],
              sourceAttribution: 'Ministry of External Affairs Secretariat',
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
              headline: 'Consortium Highlights & Technical Breakthroughs',
              bulletPoints: [
                'Unification of High-NA EUV optical tolerances across major equipment vendors and commercial foundries.',
                'Open-standard chiplet interconnect framework targeting under 0.78 pJ/bit power dissipation at multi-terabit bandwidths.',
                'Shared patent pool of 1,400 process patents covers nanosheet gate-all-around (GAA) channel release techniques.',
              ],
            },
          },
          {
            id: 'blk_semi_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'TAIPEI — In a strategic shift toward interoperable silicon fabrication, an unprecedented coalition of premier semiconductor foundries, tool manufacturers, and materials science institutes announced the formal ratification of the 2-Nanometer GAA Open Lithography Standard on Sunday. The alliance brings together global foundry titans alongside European optics leaders and American fabless chip architects to establish a unified design-technology co-optimization (DTCO) specification, seeking to curb multi-billion-dollar R&D redundancies as node shrink physics approaches sub-atomic quantum barriers.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_semi_h1',
            blockType: 'heading',
            sortOrder: 2,
            data: { text: 'Gate-All-Around Physics and High-NA Optics', level: 2 },
          },
          {
            id: 'blk_semi_p2',
            blockType: 'paragraph',
            sortOrder: 3,
            data: {
              text: 'Transitioning from three-dimensional FinFETs to horizontal nanosheet Gate-All-Around (GAA) structures represents the most radical device architecture overhaul since the introduction of high-k metal gates in 2007. By enclosing the conducting silicon channel on all four sides, GAA eliminates subthreshold leakage currents that plague sub-3nm geometries. Under the newly ratified standard, foundries agreed to align their anamorphic High-NA EUV 0.55 numerical aperture optical settings, standardizing reticle magnification splits to prevent wafer distortion across disparate international production lines.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_semi_table',
            blockType: 'table',
            sortOrder: 4,
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
                ['Interconnect Energy (pJ/bit)', '1.40', '0.78', '-44%'],
                ['Static Gate Leakage (nA/µm)', '4.2', '0.6', '-86%'],
              ],
            },
          },
          {
            id: 'blk_semi_p3',
            blockType: 'paragraph',
            sortOrder: 5,
            data: {
              text: 'The shared specifications also govern advanced 2.5D and 3D heterogeneous packaging, codifying micro-bump pitches down to 10 micrometers and monolithic hybrid bonding interfaces. In practical computing applications, this will allow hyperscale AI accelerator designers to combine high-density 2nm compute dies directly with high-bandwidth memory stacks using standard interconnect protocols, reducing thermal throttling and memory-wall latencies that currently throttle large-language model training workloads.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_semi_diagram',
            blockType: 'diagram',
            sortOrder: 6,
            data: {
              title: 'Unified 2nm GAAFET Transistor & Chiplet Interconnect Topology',
              format: 'mermaid',
              definition:
                'flowchart LR\n  EUV[High-NA EUV Scanner] -->|Pattern Transfer| NS[Nanosheet Channel Growth]\n  NS -->|Channel Release| HK[High-k Gate Dielectric]\n  NS -->|Buried Power Rail| BSPDN[Backside Power Delivery]\n  HK -->|Die-to-Wafer| HYB[Hybrid Direct-Bond Interconnect]',
              caption: 'Process flow for 2nm nanosheet transistors and backside power rails.',
            },
          },
          {
            id: 'blk_semi_h2',
            blockType: 'heading',
            sortOrder: 7,
            data: { text: 'Venture Capital and Supply Chain Ecosystems', level: 2 },
          },
          {
            id: 'blk_semi_p4',
            blockType: 'paragraph',
            sortOrder: 8,
            data: {
              text: 'Industry reaction to the standard was overwhelmingly positive across technology capitals. By decoupling proprietary IP blocks from rigid fab-specific lithography constraints, fabless startup ecosystems in Europe, the United States, and East Asia gain predictable tape-out targets. Equipment vendors project that standardization will accelerate volume wafer yields by as much as three quarters, dramatically lowering the financial barrier to producing custom silicon for autonomous edge devices and robotics.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_semi_quote',
            blockType: 'quote',
            sortOrder: 9,
            data: {
              quote:
                'Accelerated computing and 2nm architecture represent the single largest performance inflection in semiconductor history. Standardizing nanosheet lithography ensures our next-generation AI architectures deploy at unprecedented energy efficiency.',
              attribution: 'Jensen Huang',
              title: 'Chief Executive Officer, NVIDIA Corporation',
            },
          },
          {
            id: 'blk_semi_p5',
            blockType: 'paragraph',
            sortOrder: 10,
            data: {
              text: 'Pilot wafer runs utilizing the standardized GAA design rules are scheduled to begin in Hsinchu and Dresden in early 2027, with high-volume consumer smartphone and hyperscale datacenter silicon deliveries slated for the second half of that year. Analysts at TrendForce estimate the standard will safeguard over $80 billion in planned fab expansions against custom tooling obsolescence.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_semi_stat',
            blockType: 'statistic',
            sortOrder: 11,
            data: {
              value: '310 MTr/mm²',
              label: 'Peak Logic Density Achieved on 2nm GAA Test Vehicles',
              trend: 'up',
              trendValue: '+44% over 3nm',
              context: 'Standardized High-NA EUV dual-patterning run',
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
            id: 'blk_fusion_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Key Scientific Discoveries: 120-Second Steady State Run',
              bulletPoints: [
                'Experimental tokamak maintains burning deuterium-tritium plasma core for 120 continuous seconds.',
                'Achieved an energy multiplication factor of Q = 1.35, generating 24.3 MW thermal output from 18.0 MW injected heating power.',
                'High-temperature rare-earth barium copper oxide (REBCO) superconducting tape magnets withstood intense neutron flux with zero thermal quenching.',
              ],
            },
          },
          {
            id: 'blk_fusion_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'OXFORD — In what international nuclear physicists are describing as the most significant practical milestone toward commercial fusion energy since the inception of magnetic confinement research, the experimental compact tokamak facility in Oxfordshire successfully maintained a burning deuterium-tritium plasma for two full minutes on Sunday evening, demonstrating a sustained net energy gain factor of Q = 1.35 under rigorous diagnostic validation.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_fusion_h1',
            blockType: 'heading',
            sortOrder: 2,
            data: { text: 'High-Temperature Superconductors and Magnetic Stability', level: 2 },
          },
          {
            id: 'blk_fusion_p2',
            blockType: 'paragraph',
            sortOrder: 3,
            data: {
              text: 'Unlike older legacy stellarators and copper-wound tokamaks that could only pulse for fractions of a second before thermal dissipation forced a shutdown, this reactor leverages advanced high-temperature superconducting (HTS) tape composed of rare-earth barium copper oxide. Operating at 20 Kelvin rather than near absolute zero, the magnetic coils generated a toroidal field strength exceeding 12.4 Tesla, suppressing turbulent heat loss along magnetic field lines and preventing localized edge-localized modes (ELMs) from eroding the tungsten divertor armor.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_fusion_chart',
            blockType: 'chart',
            sortOrder: 4,
            data: {
              chartType: 'line',
              title: 'Steady-State Plasma Core Temperature Profile (keV)',
              xAxis: { key: 'seconds', label: 'Confinement Duration (Seconds)', type: 'linear' },
              yAxis: { label: 'Core Temp (keV)' },
              series: [{ name: 'Plasma Core Temp', key: 'temp', color: '#ef4444' }],
              values: [
                { seconds: '0', temp: 2.1 },
                { seconds: '20', temp: 8.9 },
                { seconds: '40', temp: 13.5 },
                { seconds: '60', temp: 15.4 },
                { seconds: '80', temp: 15.8 },
                { seconds: '100', temp: 16.0 },
                { seconds: '120', temp: 16.1 },
              ],
              sourceAttribution: 'Culham Centre for Fusion Energy & Nature 2026',
            },
          },
          {
            id: 'blk_fusion_p3',
            blockType: 'paragraph',
            sortOrder: 5,
            data: {
              text: 'Continuous neutral beam injection and electron cyclotron resonance heating were coupled seamlessly with real-time plasma shape control algorithms running on microsecond control loops. Core temperatures peaked at 185 million degrees Celsius—over ten times hotter than the center of the Sun—without generating instabilities that have historically collapsed earlier burning plasma experiments.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_fusion_stat',
            blockType: 'statistic',
            sortOrder: 6,
            data: {
              value: '1.35x Q-Factor',
              label: 'Empirical Net Energy Output Gain Ratio',
              trend: 'up',
              trendValue: '+35% above breakeven',
              context: 'Continuous high-temperature superconducting magnet stabilization',
            },
          },
          {
            id: 'blk_fusion_h2',
            blockType: 'heading',
            sortOrder: 7,
            data: { text: 'Commercial Grid Integration and Pilot Plant Timelines', level: 2 },
          },
          {
            id: 'blk_fusion_p4',
            blockType: 'paragraph',
            sortOrder: 8,
            data: {
              text: 'The sustained run offers vital empirical proof-of-concept for commercial fusion ventures currently raising billions in private capital. While national laboratory experiments at the National Ignition Facility achieved scientific breakeven via laser inertial confinement, magnetic confinement offers the only proven engineering path to continuous, round-the-clock baseload electrical power without requiring repetitive target pellet manufacturing.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_fusion_callout',
            blockType: 'callout',
            sortOrder: 9,
            data: {
              style: 'tip',
              title: 'Engineering Landmark: Tritium Breeding Verification',
              text: 'Secondary lithium-lead blanket modules captured 98.4% of emitted 14.1 MeV neutrons, confirming that future commercial reactors can breed their own tritium fuel inventory without external dependency.',
            },
          },
          {
            id: 'blk_fusion_p5',
            blockType: 'paragraph',
            sortOrder: 10,
            data: {
              text: 'The consortium stated that the experimental tokamak will now undergo scheduled maintenance and neutron tomography inspections before commencing an extended 1,000-second demonstration shot scheduled for Q3 2027. Engineering plans for a 200 MW grid-connected pilot plant in northern England are currently under regulatory review with the UK Atomic Energy Authority.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_fusion_citation',
            blockType: 'citation',
            sortOrder: 11,
            data: {
              claim:
                'Steady-state deuterium-tritium plasma sustained continuously beyond 120s with positive Q-factor.',
              sourceIds: ['src_nature_01'],
              quoteExcerpt:
                'We report continuous plasma confinement exceeding 120 seconds with energy multiplication factor Q = 1.35, validating the thermodynamic viability of high-field HTS magnet configurations.',
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
            id: 'blk_markets_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Multilateral Liquidity Facility: Operational Launch',
              bulletPoints: [
                'Cross-border bilateral currency settlement volumes surged from $14.2B to $72.1B daily within five months.',
                'Automated collateral management eliminates intermediate USD conversion, compressing transaction costs by 140 basis points.',
                'Twelve central banks across G20 and emerging economies completed technical interoperability testing.',
              ],
            },
          },
          {
            id: 'blk_markets_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'BASEL — The Bank for International Settlements confirmed on Monday that twelve sovereign central monetary authorities have completed rigorous technical interoperability testing and formally activated the Multilateral Liquidity Facility (MLF), a distributed settlement architecture enabling real-time bilateral currency clearing without routing through legacy USD correspondent banking networks. The system went live at 06:00 UTC, processing its first cross-border energy commodity settlement between two Asian central banks within forty-seven seconds of activation.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_markets_h1',
            blockType: 'heading',
            sortOrder: 2,
            data: { text: 'Clearing Architecture and Collateral Mechanics', level: 2 },
          },
          {
            id: 'blk_markets_p2',
            blockType: 'paragraph',
            sortOrder: 3,
            data: {
              text: 'The MLF operates through a tiered hierarchy of central bank nodes, each maintaining pledged sovereign security pools denominated in local currencies. When a trade settlement request enters the network, the automated collateral engine performs instantaneous mark-to-market valuations across pledged bond portfolios, releasing settlement finality in under two seconds. By eliminating the traditional T+2 settlement lag and the associated foreign exchange hedging overhead, the facility compresses transaction costs by an estimated 140 basis points on volume merchandise shipments—a savings that translates to tens of billions in annual working capital efficiencies.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_markets_chart',
            blockType: 'chart',
            sortOrder: 4,
            data: {
              chartType: 'area',
              title: 'Daily Bilateral Currency Settlement Volume ($ Billions)',
              xAxis: { key: 'month', label: 'Month', type: 'category' },
              yAxis: { label: 'Billion USD Equivalent' },
              series: [{ name: 'Direct Bilateral Volume', key: 'volume', color: '#10b981' }],
              values: [
                { month: 'Apr 26', volume: 14.2 },
                { month: 'May 26', volume: 19.8 },
                { month: 'Jun 26', volume: 28.6 },
                { month: 'Jul 26', volume: 38.5 },
                { month: 'Aug 26', volume: 49.3 },
                { month: 'Sep 26', volume: 72.1 },
              ],
              sourceAttribution: 'Bank for International Settlements 2026',
            },
          },
          {
            id: 'blk_markets_map',
            blockType: 'map',
            sortOrder: 5,
            data: {
              title: 'Participating Central Bank Nodes',
              style: 'dark',
              center: [55.0, 25.0],
              zoom: 2,
              markers: [
                {
                  coordinates: [77.209, 28.6139],
                  title: 'Reserve Bank of India',
                  description: 'Anchor node for South Asian clearing corridor',
                },
                {
                  coordinates: [116.4074, 39.9042],
                  title: "People's Bank of China",
                  description: 'Largest bilateral volume counterparty',
                },
                {
                  coordinates: [-46.6333, -23.5505],
                  title: 'Central Bank of Brazil',
                  description: 'Latin American commodity settlement hub',
                },
                {
                  coordinates: [7.4474, 46.948],
                  title: 'Bank for International Settlements',
                  description: 'Technical coordination and dispute resolution',
                },
                {
                  coordinates: [54.3773, 24.4539],
                  title: 'Central Bank of UAE',
                  description: 'Energy trade denomination anchor',
                },
              ],
            },
          },
          {
            id: 'blk_markets_h2',
            blockType: 'heading',
            sortOrder: 6,
            data: { text: 'Market Impact and Institutional Response', level: 2 },
          },
          {
            id: 'blk_markets_p3',
            blockType: 'paragraph',
            sortOrder: 7,
            data: {
              text: 'Financial markets responded with notable positioning shifts. Sovereign bond yields across participating nations compressed by 12 to 18 basis points within hours of the announcement, reflecting anticipated declines in cross-border liquidity risk premiums. Commercial banks in London and Singapore reported an immediate surge in inquiries from institutional trade desks preparing to configure direct bilateral clearing accounts for Asian and Middle Eastern commodity corridors.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_markets_quote',
            blockType: 'quote',
            sortOrder: 8,
            data: {
              quote:
                'Automated collateralized clearing corridors eliminate intermediate conversion friction and re-anchor sovereign trade settlement on a foundation of direct bilateral trust. This represents a structural evolution in how the global economy processes cross-border commerce.',
              attribution: 'Secretariat for International Settlements',
              title: 'Basel Policy Declaration, September 2026',
            },
          },
          {
            id: 'blk_markets_p4',
            blockType: 'paragraph',
            sortOrder: 9,
            data: {
              text: 'The BIS coordination secretariat confirmed that an additional eight central banks have formally applied for technical onboarding, with the second tranche of participating monetary authorities expected to achieve production readiness by Q2 2027. Operational oversight will be managed through a standing committee meeting monthly in Basel and Dubai, ensuring continuous monitoring of net settlement imbalances and collateral adequacy ratios.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_markets_stat',
            blockType: 'statistic',
            sortOrder: 10,
            data: {
              value: '$72.1B',
              label: 'Daily Bilateral Settlement Volume (September 2026)',
              trend: 'up',
              trendValue: '+408% since April',
              context: 'Direct sovereign currency settlement without USD intermediation',
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
            id: 'blk_ai_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Autonomous Agent Verification: Key Findings',
              bulletPoints: [
                'Multi-agent verification loops achieve a 99.98% zero-defect rate across 14 million lines of critical infrastructure code.',
                'Formal abstract-interpretation passes detect semantic errors invisible to conventional static analysis or human code review.',
                'Treaty negotiations in Geneva establish mandatory verification gates for frontier model deployments in regulated sectors.',
              ],
            },
          },
          {
            id: 'blk_ai_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'SAN FRANCISCO — In a landmark evaluation that may permanently reshape the regulatory landscape for artificial intelligence in critical systems, autonomous agent teams operating under formal mathematical verification architectures have demonstrated zero-defect deployment across multi-tier production telemetry systems in both the telecommunications and electrical power grid sectors. The results, validated independently by MIT CSAIL and the Fraunhofer Institute, show that multi-agent verification loops consistently outperform traditional human code-review benchmarks by two orders of magnitude in defect detection sensitivity.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_ai_h1',
            blockType: 'heading',
            sortOrder: 2,
            data: { text: 'Formal Verification Architecture and SMT Solvers', level: 2 },
          },
          {
            id: 'blk_ai_p2',
            blockType: 'paragraph',
            sortOrder: 3,
            data: {
              text: 'The verification framework operates through a cascading multi-agent pipeline. A primary generative agent produces candidate code patches, which are then subjected to abstract interpretation by a secondary verifier agent that constructs formal proofs of correctness using SMT (Satisfiability Modulo Theories) solvers. A tertiary adversarial agent attempts targeted fault injection—simulating power fluctuation edge cases, network partitioning, and Byzantine failure scenarios—to stress-test resilience. Only patches that survive all three gates enter the deployment staging environment.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_ai_chart',
            blockType: 'chart',
            sortOrder: 4,
            data: {
              chartType: 'bar',
              title: 'Defect Detection Rate: Autonomous Agents vs. Human Review',
              xAxis: { key: 'category', label: 'Infrastructure Domain', type: 'category' },
              yAxis: { label: 'Defects per Million Lines of Code' },
              series: [
                { name: 'Human Review', key: 'human', color: '#f97316' },
                { name: 'Multi-Agent Verification', key: 'agent', color: '#3b82f6' },
              ],
              values: [
                { category: 'Power Grid SCADA', human: 42, agent: 0.2 },
                { category: 'Telecom Switching', human: 38, agent: 0.1 },
                { category: 'Financial Settlement', human: 55, agent: 0.4 },
                { category: 'Medical Devices', human: 67, agent: 0.3 },
              ],
              sourceAttribution: 'MIT CSAIL & Fraunhofer AISEC Joint Evaluation 2026',
            },
          },
          {
            id: 'blk_ai_p3',
            blockType: 'paragraph',
            sortOrder: 5,
            data: {
              text: 'Regulatory bodies are now grappling with the implications. At a concurrent session at the Geneva Convention on AI Safety, delegates from 42 nations debated mandatory verification gates for frontier model deployments in regulated infrastructure sectors. Proponents argue that formal mathematical proofs provide stronger safety guarantees than any human review process; critics counter that automated systems may develop correlated blind spots invisible to their own verification chains.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_ai_poll',
            blockType: 'poll',
            sortOrder: 6,
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
            id: 'blk_ai_h2',
            blockType: 'heading',
            sortOrder: 7,
            data: { text: 'Industry Adoption and Safety Treaty Negotiations', level: 2 },
          },
          {
            id: 'blk_ai_p4',
            blockType: 'paragraph',
            sortOrder: 8,
            data: {
              text: 'Major hyperscale cloud providers have already begun integrating the multi-agent verification pipeline into their managed infrastructure offerings, with at least three providers planning commercial availability by Q1 2027. The compute overhead for running formal verification passes adds approximately 12% to deployment time but reduces post-deployment incident response costs by an estimated 94%, according to internal analyses shared with this publication.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_ai_quote',
            blockType: 'quote',
            sortOrder: 9,
            data: {
              quote:
                'When a multi-agent system can mathematically prove that its output is correct before deployment, we are no longer discussing whether AI should manage infrastructure—we are discussing the irresponsibility of not using it.',
              attribution: 'Dr. Sarah Chen',
              title: 'Director of Formal Methods, MIT Computer Science & AI Laboratory',
            },
          },
          {
            id: 'blk_ai_doc',
            blockType: 'document_viewer',
            sortOrder: 10,
            data: {
              documentUrl:
                'https://news.platform/docs/benchmarks/agent-verification-protocol-2026.pdf',
              title: 'Formal Multi-Agent Telemetry Verification Specification (v2.4)',
              pageCount: 24,
              documentType: 'whitepaper',
              description:
                'Peer-reviewed technical specification defining formal verification gates, automated test generation, and adversarial fault-injection protocols.',
              highlights: [
                {
                  page: 4,
                  excerpt:
                    'Zero-defect boundary criteria enforced via abstract interpretation and SMT-solver verification passes.',
                  note: 'Core safety theorem',
                },
                {
                  page: 11,
                  excerpt:
                    'Adversarial fault injection simulates 2,400 Byzantine failure modes including network partitioning, clock drift, and power fluctuation edge cases.',
                  note: 'Stress testing methodology',
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
            id: 'blk_quantum_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Topological Quantum Breakthrough: Key Results',
              bulletPoints: [
                '10,240 fault-tolerant logical qubits achieved using Majorana zero-mode braiding on a single cryogenic module.',
                'Gate error rates reduced to 8 × 10⁻⁸, two orders of magnitude below conventional superconducting transmon architectures.',
                'First-ever full simulation of the cytochrome P450 enzyme folding pathway completed in 47 minutes—a task estimated to require 10,000 years on classical supercomputers.',
              ],
            },
          },
          {
            id: 'blk_quantum_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'COPENHAGEN — In a research achievement that fundamentally redefines the practical horizon for quantum computing, the Copenhagen Quantum Foundry announced on Wednesday that its topological quantum processor has surpassed the 10,000 fault-tolerant logical qubit threshold—the long-theorized milestone at which quantum machines become capable of performing molecular-scale simulations that are utterly intractable on any classical computer architecture, regardless of parallelization strategy.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_quantum_h1',
            blockType: 'heading',
            sortOrder: 2,
            data: { text: 'Majorana Zero-Mode Braiding and Topological Protection', level: 2 },
          },
          {
            id: 'blk_quantum_p2',
            blockType: 'paragraph',
            sortOrder: 3,
            data: {
              text: 'The breakthrough rests on a fundamentally different approach to quantum error correction. Rather than wrapping each logical qubit in a cage of thousands of noisy physical qubits, the topological architecture encodes quantum information in the braiding patterns of Majorana zero-mode quasiparticles—exotic excitations that exist at the boundaries of specially engineered semiconductor nanowires. Because the information is stored non-locally across the braid topology, it is inherently immune to the local environmental decoherence events that plague conventional superconducting transmon and trapped-ion systems.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_quantum_audio',
            blockType: 'audio',
            sortOrder: 4,
            data: {
              url: '/audio/quantum-topological-qubits-briefing.mp3',
              title: 'GlobalPulse Deep Dive: Inside the Majorana Topological Qubit Breakthrough',
              narrator: 'Elena Rostova & David Chen',
              durationSeconds: 245,
              transcript:
                'Welcome to this GlobalPulse Special Report. Today, we break down how topological braid protection neutralizes environmental decoherence without requiring thousands of redundant physical qubits per logical unit. The implications for drug discovery, materials science, and cryptographic security are staggering.',
              language: 'en',
            },
          },
          {
            id: 'blk_quantum_chart',
            blockType: 'chart',
            sortOrder: 5,
            data: {
              chartType: 'scatter',
              title: 'Logical Gate Error Rate vs. Operating Temperature',
              xAxis: { key: 'tempKelvin', label: 'Cryostat Temp (Kelvin)', type: 'linear' },
              yAxis: { label: 'Gate Error Rate (10⁻⁶)' },
              series: [{ name: 'Topological Architecture', key: 'errorRate', color: '#8b5cf6' }],
              values: [
                { tempKelvin: '0.010', errorRate: 0.06 },
                { tempKelvin: '0.015', errorRate: 0.08 },
                { tempKelvin: '0.050', errorRate: 0.12 },
                { tempKelvin: '0.100', errorRate: 0.25 },
                { tempKelvin: '0.250', errorRate: 0.94 },
                { tempKelvin: '0.500', errorRate: 3.8 },
              ],
              sourceAttribution: 'Copenhagen Quantum Foundry & Physical Review Letters 2026',
            },
          },
          {
            id: 'blk_quantum_h2',
            blockType: 'heading',
            sortOrder: 6,
            data: {
              text: 'Drug Discovery, Materials Science, and Cryptographic Implications',
              level: 2,
            },
          },
          {
            id: 'blk_quantum_p3',
            blockType: 'paragraph',
            sortOrder: 7,
            data: {
              text: "The research team demonstrated the processor's capability by executing the first-ever complete quantum simulation of the cytochrome P450 enzyme folding pathway—a problem of immense importance to pharmaceutical drug metabolism prediction. The simulation, which accurately modeled electron orbital interactions across 1,847 atoms, completed in 47 minutes. Classical density functional theory estimates placed the equivalent computation at over 10,000 years on the world's fastest exascale supercomputer.",
              format: 'markdown',
            },
          },
          {
            id: 'blk_quantum_callout',
            blockType: 'callout',
            sortOrder: 8,
            data: {
              style: 'warning',
              title: 'Cryptographic Security Advisory',
              text: 'With 10,000+ logical qubits, the processor approaches the theoretical threshold for breaking RSA-2048 encryption. NIST has accelerated its post-quantum cryptography migration timeline, urging all federal agencies to complete algorithm transitions by 2028.',
            },
          },
          {
            id: 'blk_quantum_p4',
            blockType: 'paragraph',
            sortOrder: 9,
            data: {
              text: 'Commercial licensing of the topological architecture has been secured by three major cloud providers, with managed quantum computing services expected to enter public preview by mid-2027. The Copenhagen team emphasized that manufacturing the specialized indium antimonide nanowires at scale remains the primary engineering bottleneck, but noted that partnership agreements with semiconductor foundries in the Netherlands are progressing toward pilot production.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_quantum_quote',
            blockType: 'quote',
            sortOrder: 10,
            data: {
              quote:
                'We have crossed the threshold from quantum curiosity to quantum utility. The cytochrome simulation proves that topological qubits can solve real-world problems that no classical machine will ever touch.',
              attribution: 'Prof. Annika Sørensen',
              title: 'Director, Copenhagen Quantum Foundry',
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
            id: 'blk_space_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Lunar Gateway: Orbit Insertion Mission Status',
              bulletPoints: [
                'Gateway station successfully locked into 7-day near-rectilinear halo orbit above the lunar south pole.',
                'Solar Electric Propulsion thrusters completed an 18-hour continuous burn for trans-lunar injection.',
                'Optical laser communication terminal established 1.2 Gbps high-bandwidth data downlink to terrestrial stations.',
              ],
            },
          },
          {
            id: 'blk_space_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: "HOUSTON & DARMSTADT — Flight directors at NASA Johnson Space Center and ESA's European Space Operations Centre confirmed on Tuesday morning that the International Lunar Gateway space station completed its final high-precision trajectory correction burn, settling into its planned near-rectilinear halo orbit approximately 3,000 kilometers above the Moon's south pole. The maneuver marks the culmination of a 14-month transit from low Earth orbit and establishes the first permanent crew-tended outpost beyond cislunar space.",
              format: 'markdown',
            },
          },
          {
            id: 'blk_space_h1',
            blockType: 'heading',
            sortOrder: 2,
            data: { text: 'Propulsion Systems and Orbital Mechanics', level: 2 },
          },
          {
            id: 'blk_space_p2',
            blockType: 'paragraph',
            sortOrder: 3,
            data: {
              text: "The Gateway's ion-driven Solar Electric Propulsion system, powered by two 30-kilowatt roll-out solar array wings, executed the insertion burn with sub-centimeter navigation accuracy validated by the Deep Space Network's three tracking complexes in Goldstone, Madrid, and Canberra. The near-rectilinear halo orbit was selected because it provides continuous line-of-sight communications with both Earth and the lunar south pole landing sites while consuming minimal station-keeping propellant—estimated at less than 10 kilograms of xenon per year.",
              format: 'markdown',
            },
          },
          {
            id: 'blk_space_map',
            blockType: 'map',
            sortOrder: 4,
            data: {
              title: 'Artemis Surface Communications & Launch Tracking Network',
              style: 'dark',
              center: [-80.6077, 28.3922],
              zoom: 2,
              markers: [
                {
                  coordinates: [-80.6077, 28.3922],
                  title: 'Kennedy Space Center LC-39B',
                  description: 'Primary terrestrial heavy-lift departure point',
                },
                {
                  coordinates: [8.65, 49.87],
                  title: 'ESOC Darmstadt',
                  description: 'Gateway telemetry navigation & propulsion control',
                },
                {
                  coordinates: [130.97, 30.4],
                  title: 'Tanegashima Space Center',
                  description: 'JAXA Pacific tracking & logistics resupply staging',
                },
                {
                  coordinates: [80.23, 13.72],
                  title: 'ISRO ISTRAC Sriharikota',
                  description: 'Indian deep-space tracking antenna station',
                },
              ],
            },
          },
          {
            id: 'blk_space_timeline',
            blockType: 'timeline',
            sortOrder: 5,
            data: {
              title: 'Gateway Insertion Flight Progression',
              items: [
                {
                  date: '14:20 UTC',
                  headline: 'Trans-Lunar Injection Verified',
                  body: 'Solar Electric Propulsion thrusters fired for 18 continuous hours to achieve escape velocity from Earth gravitational influence.',
                },
                {
                  date: '18:22 UTC',
                  headline: 'Near-Rectilinear Halo Insertion',
                  body: 'Habitation and Logistics Outpost module safely locked into the target 7-day lunar polar halo orbit corridor with sub-centimeter accuracy.',
                },
                {
                  date: '21:45 UTC',
                  headline: 'Optical Laser Link Initialized',
                  body: 'Terrestrial optical communication terminals at Goldstone and Madrid established ultra-high-bandwidth 1.2 Gbps data downlink.',
                },
              ],
            },
          },
          {
            id: 'blk_space_h2',
            blockType: 'heading',
            sortOrder: 6,
            data: { text: 'International Cooperation and Next Mission Phases', level: 2 },
          },
          {
            id: 'blk_space_p3',
            blockType: 'paragraph',
            sortOrder: 7,
            data: {
              text: 'The Gateway represents an unprecedented multinational collaboration, with habitation modules contributed by ESA and JAXA, propulsion elements from NASA, robotic arms from CSA, and deep-space tracking support from ISRO. The outpost will serve as a staging point for crewed Artemis lunar surface missions targeting the permanently shadowed craters of Shackleton and Haworth, where water ice deposits could be extracted to produce rocket propellant and life support consumables.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_space_img',
            blockType: 'image',
            sortOrder: 8,
            data: {
              url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
              altText: 'Lunar Gateway Station in Near-Rectilinear Halo Orbit',
              caption:
                "High-resolution rendering of the International Lunar Gateway orbiting above the Moon's south polar region, showing deployed solar arrays and docked logistics modules.",
              credit: 'NASA / ESA / JAXA Aerospace Consortium',
              aspectRatio: '16:9',
            },
          },
          {
            id: 'blk_space_p4',
            blockType: 'paragraph',
            sortOrder: 9,
            data: {
              text: "The first crewed rotation aboard the Gateway is scheduled for Q2 2027, with a four-person international crew spending 30 days conducting scientific experiments and preparing surface descent systems. Mission planners emphasized that the station's autonomous systems successfully maintained all life support parameters throughout the uncrewed transit, validating the closed-loop environmental control architecture for extended deep-space habitation.",
              format: 'markdown',
            },
          },
          {
            id: 'blk_space_stat',
            blockType: 'statistic',
            sortOrder: 10,
            data: {
              value: '7 Days',
              label: 'Near-Rectilinear Halo Orbital Period',
              trend: 'neutral',
              context:
                'Continuous line-of-sight communications with Earth and lunar south pole landing sites.',
              sourceAttribution: 'NASA Deep Space Network Telemetry',
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
                'Total grid-scale battery storage capacity crosses the 500 Gigawatt-hour threshold across three continents.',
                'Sub-cycle frequency response times of 8 milliseconds eliminate need for peaking gas turbine reserves.',
              ],
            },
          },
          {
            id: 'blk_climate_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'BRUSSELS & HYDERABAD — In a milestone that energy ministers described as a turning point for global decarbonization, national transmission operators across Europe, South Asia, and Oceania verified the synchronized commissioning of solid-state ceramic electrolyte battery installations totaling 500 gigawatt-hours of grid-scale storage capacity. The installations provide instantaneous frequency stabilization services previously dependent on fossil-fuel peaking gas turbines, eliminating an estimated 42 million tonnes of annual CO₂ emissions from grid-balancing operations alone.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_climate_h1',
            blockType: 'heading',
            sortOrder: 2,
            data: { text: 'Solid-State Electrolyte Technology and Safety Advantages', level: 2 },
          },
          {
            id: 'blk_climate_p2',
            blockType: 'paragraph',
            sortOrder: 3,
            data: {
              text: 'Unlike conventional lithium-ion batteries that rely on flammable liquid organic electrolytes, the new grid storage cells employ a garnet-type ceramic solid electrolyte membrane that conducts lithium ions through a rigid crystal lattice. This architecture eliminates the risk of thermal runaway—the catastrophic chain-reaction failure mode that has caused warehouse fires and necessitated costly containment infrastructure. The solid-state cells operate safely at ambient temperatures up to 85°C without active cooling, dramatically reducing auxiliary energy consumption and maintenance costs.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_climate_chart',
            blockType: 'chart',
            sortOrder: 4,
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
            id: 'blk_climate_h2',
            blockType: 'heading',
            sortOrder: 5,
            data: { text: 'Economic Impact and Regulatory Fast-Tracking', level: 2 },
          },
          {
            id: 'blk_climate_p3',
            blockType: 'paragraph',
            sortOrder: 6,
            data: {
              text: 'The deployment was accelerated by regulatory fast-tracking mechanisms ratified at COP31, which established streamlined permitting corridors for non-flammable storage technologies. Levelized cost of storage for the ceramic installations has fallen to $38 per megawatt-hour—below the operating cost of existing natural gas peaker plants in most wholesale electricity markets. Utilities report that the sub-cycle 8-millisecond response time of solid-state systems provides superior frequency regulation compared to the 200-millisecond response typical of conventional battery chemistries.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_climate_callout',
            blockType: 'callout',
            sortOrder: 7,
            data: {
              style: 'info',
              title: 'Grid Balancing Impact',
              text: 'Sub-cycle response times allow solid-state systems to damp transient frequency sags within 8 milliseconds of line trip events, preventing cascading blackout propagation across interconnected regional grids.',
            },
          },
          {
            id: 'blk_climate_p4',
            blockType: 'paragraph',
            sortOrder: 8,
            data: {
              text: 'Industry analysts project that solid-state grid storage will reach 1.5 terawatt-hours of total installed capacity by 2029, supported by expanding manufacturing facilities in Germany, India, and Australia. The European Battery Alliance confirmed that three new gigafactory construction projects, representing €4.2 billion in combined investment, will begin site preparation in Q1 2027.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_climate_image_diff',
            blockType: 'image_diff',
            sortOrder: 9,
            data: {
              beforeUrl:
                'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
              afterUrl:
                'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
              beforeLabel: 'Legacy Gas Peaker Plant Grid',
              afterLabel: 'Solid-State Storage Array Installation',
              caption:
                'Before and after: Traditional fossil-fuel peaking infrastructure replaced by modular ceramic solid-state battery arrays.',
              orientation: 'horizontal',
              defaultSplitPercent: 50,
              credit: 'International Energy Agency / European Battery Alliance',
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
            id: 'blk_health_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Phase 3 Trial Results: Universal Coronavirus Therapeutic',
              bulletPoints: [
                '94.2% efficacy against all documented SARS-CoV-2 lineages including synthetic challenge variants.',
                'Zero serious adverse events across 48,000 participants spanning 31 countries and 6 demographic cohorts.',
                'Neutralizing antibody titers remained stable at 180 days post-administration without booster requirement.',
              ],
            },
          },
          {
            id: 'blk_health_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: "GENEVA — The World Health Organization's Strategic Advisory Group on Immunization released comprehensive results from the largest multinational Phase 3 clinical trial of a pan-coronavirus mRNA therapeutic, demonstrating 94.2% efficacy against all documented respiratory viral lineages with zero serious adverse events across 48,000 participants in 31 countries. The computationally designed synthetic antigen targets conserved stem-helix proteins shared across the entire coronavirus family, offering unprecedented breadth of neutralization.",
              format: 'markdown',
            },
          },
          {
            id: 'blk_health_what_changed',
            blockType: 'what_changed',
            sortOrder: 2,
            data: {
              previousVersionNumber: 1,
              updatedAt: '2026-10-02T05:00:00Z',
              items: [
                {
                  changeType: 'added',
                  description:
                    'Included peer-reviewed multinational Phase 3 demographic breakdown across 6 age cohorts.',
                },
                {
                  changeType: 'updated',
                  description:
                    'Refined neutralizing antibody geometric mean titer figures with 180-day longitudinal data.',
                },
                {
                  changeType: 'added',
                  description:
                    'Added comparative efficacy chart against existing variant-specific boosters.',
                },
              ],
            },
          },
          {
            id: 'blk_health_h1',
            blockType: 'heading',
            sortOrder: 3,
            data: { text: 'Synthetic Antigen Design and Broad Neutralization', level: 2 },
          },
          {
            id: 'blk_health_p2',
            blockType: 'paragraph',
            sortOrder: 4,
            data: {
              text: "The therapeutic leverages a computationally optimized mRNA sequence encoding a chimeric antigen that fuses conserved epitope regions from four distinct coronavirus subgenera. Unlike conventional variant-chasing vaccines that must be reformulated every six months, the universal construct targets the structurally invariant stem-helix domain of the spike protein's S2 subunit—a region so critical to viral membrane fusion that mutational escape would likely render the virus non-functional.",
              format: 'markdown',
            },
          },
          {
            id: 'blk_health_chart',
            blockType: 'chart',
            sortOrder: 5,
            data: {
              chartType: 'bar',
              title: 'Efficacy Comparison: Universal vs. Variant-Specific Therapeutics',
              xAxis: { key: 'variant', label: 'Viral Lineage', type: 'category' },
              yAxis: { label: 'Efficacy (%)' },
              series: [
                { name: 'Universal Pan-CoV', key: 'universal', color: '#10b981' },
                { name: 'Variant-Specific XBB.4', key: 'specific', color: '#6366f1' },
              ],
              values: [
                { variant: 'BA.2.86', universal: 94.8, specific: 89.2 },
                { variant: 'XBB.1.16', universal: 93.6, specific: 94.1 },
                { variant: 'JN.1.4', universal: 94.1, specific: 72.4 },
                { variant: 'Synthetic Challenge', universal: 91.8, specific: 31.2 },
              ],
              sourceAttribution: 'WHO Phase 3 Statistical Dossier (CT-2026-9)',
            },
          },
          {
            id: 'blk_health_h2',
            blockType: 'heading',
            sortOrder: 6,
            data: { text: 'Regulatory Pathway and Global Access', level: 2 },
          },
          {
            id: 'blk_health_p3',
            blockType: 'paragraph',
            sortOrder: 7,
            data: {
              text: "Regulatory authorities in Europe, India, and Japan have granted accelerated review designation based on the Phase 3 data, with emergency use authorization decisions expected within 90 days. The WHO's COVAX Facility has secured advance purchase commitments for 2.4 billion doses at tiered pricing, ensuring equitable access for low- and middle-income countries. Manufacturing partners across six continents have validated the production process using standardized lipid nanoparticle formulations.",
              format: 'markdown',
            },
          },
          {
            id: 'blk_health_p4',
            blockType: 'paragraph',
            sortOrder: 8,
            data: {
              text: 'Immunologists noted that the 180-day durability of neutralizing antibody titers without booster requirement represents a significant advantage over existing seasonal vaccination schedules. Long-term follow-up studies extending to 24 months are continuing at 140 clinical sites, with interim 12-month data expected in Q2 2027.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_health_doc',
            blockType: 'document_viewer',
            sortOrder: 9,
            data: {
              documentUrl: 'https://news.platform/docs/clinical/phase3-pan-coronavirus-results.pdf',
              title: 'Phase 3 Multicenter Randomized Clinical Evaluation Protocol (WHO-CT-2026-9)',
              pageCount: 68,
              documentType: 'regulatory_directive',
              description:
                'Primary statistical dossier filed with global pharmaceutical regulators covering efficacy, safety, and immunogenicity endpoints.',
              highlights: [
                {
                  page: 12,
                  excerpt:
                    'Neutralizing antibody titers against conserved epitope regions remained steady at 180 days post-administration across all demographic cohorts.',
                  note: 'Primary endpoint verification',
                },
                {
                  page: 34,
                  excerpt:
                    'Synthetic challenge variant generated via directed evolution showed 91.8% neutralization, confirming breadth of cross-reactivity.',
                  note: 'Variant escape resistance',
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
            id: 'blk_cyber_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Coordinated Vulnerability Remediation: Situation Report',
              bulletPoints: [
                'Undisclosed route spoofing vulnerability in legacy ICS protocol allowed unauthorized packet injection into high-voltage telemetry relays.',
                'AI-synthesized cryptographic firmware patch formally verified and deployed within 72 hours across 12 regional grid operators.',
                'Zero exploitation confirmed prior to global patch deployment; all tier-1 transmission relays secured.',
              ],
            },
          },
          {
            id: 'blk_cyber_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'WASHINGTON — In what cybersecurity officials are describing as the most significant coordinated defensive operation in critical infrastructure history, a multinational coalition of government cybersecurity agencies and utility alliance operators successfully deployed cryptographic firmware patches to industrial control systems across twelve regional electrical grids, closing an undocumented route advertisement spoofing vulnerability before any confirmed exploitation occurred.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_cyber_h1',
            blockType: 'heading',
            sortOrder: 2,
            data: { text: 'Vulnerability Discovery and AI-Assisted Patch Synthesis', level: 2 },
          },
          {
            id: 'blk_cyber_p2',
            blockType: 'paragraph',
            sortOrder: 3,
            data: {
              text: "The vulnerability, discovered through an anonymous whistleblower submission to US-CERT's critical infrastructure tipline, resided in a legacy border gateway protocol implementation used by supervisory control and data acquisition (SCADA) systems to manage high-voltage transmission relay switching. An attacker exploiting the flaw could inject spoofed route advertisements, potentially redirecting telemetry data streams and causing cascading relay trip sequences across interconnected grid segments.",
              format: 'markdown',
            },
          },
          {
            id: 'blk_cyber_timeline',
            blockType: 'timeline',
            sortOrder: 4,
            data: {
              title: 'Coordinated Vulnerability Remediation Chronology',
              items: [
                {
                  date: 'T-72 Hours',
                  headline: 'Vulnerability Discovered via Whistleblower Tipline',
                  body: 'US-CERT confirmed cryptographic vulnerability in legacy substation route advertisement protocol stack affecting IEC 61850 implementations.',
                },
                {
                  date: 'T-48 Hours',
                  headline: 'International Coordination Activated',
                  body: 'CISA, ENISA, and CERT-In established joint operations room with real-time threat intelligence sharing across 12 grid operators.',
                },
                {
                  date: 'T-24 Hours',
                  headline: 'AI Agent Patch Synthesis & Formal Verification',
                  body: 'Autonomous agent teams synthesized cryptographic firmware patch and completed SMT-solver formal proof of non-disruptive hot-patch compatibility.',
                },
                {
                  date: 'T-0 Hours',
                  headline: 'Global Air-Gapped Key Rollout Complete',
                  body: 'All tier-1 high-voltage transmission relays updated with authenticated cryptographic firmware via physically isolated deployment channels.',
                },
              ],
            },
          },
          {
            id: 'blk_cyber_diagram',
            blockType: 'diagram',
            sortOrder: 5,
            data: {
              title: 'Attack Vector & Mitigation Architecture',
              format: 'mermaid',
              definition:
                'flowchart LR\n  A[Spoofed Route] -->|Injection Attempt| B[SCADA Border Router]\n  B -->|Pre-Patch| C[Telemetry Intercept]\n  B -->|Post-Patch| D[RPKI Origin Validation]\n  D -->|Verified Origin| E[Authenticated Relay]',
              caption: 'SCADA route injection mitigation via automated RPKI validation.',
            },
          },
          {
            id: 'blk_cyber_h2',
            blockType: 'heading',
            sortOrder: 6,
            data: { text: 'Post-Incident Analysis and Regulatory Directives', level: 2 },
          },
          {
            id: 'blk_cyber_p3',
            blockType: 'paragraph',
            sortOrder: 7,
            data: {
              text: 'Post-deployment forensic analysis confirmed that no exploitation of the vulnerability occurred in the wild prior to the coordinated patch rollout. However, threat intelligence analysts noted that the vulnerability had been present in the affected protocol implementations for an estimated 18 months, underscoring the urgent need for continuous automated vulnerability scanning of legacy industrial control system firmware.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_cyber_callout',
            blockType: 'callout',
            sortOrder: 8,
            data: {
              style: 'warning',
              title: 'Security Operator Notice',
              text: 'Legacy supervisory systems utilizing unauthenticated border gateway protocol routing must enforce mandatory RPKI origin validation immediately. All IEC 61850 implementations should verify firmware integrity against US-CERT Advisory ICS-CERT-2026-275.',
            },
          },
          {
            id: 'blk_cyber_p4',
            blockType: 'paragraph',
            sortOrder: 9,
            data: {
              text: 'Regulatory bodies in the United States and European Union have issued emergency directives requiring all critical infrastructure operators to complete RPKI migration within 180 days. The successful coordination between AI-assisted patch synthesis and traditional air-gapped deployment channels has been cited as a model for future critical infrastructure defense operations.',
              format: 'markdown',
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
            id: 'blk_culture_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Venice Biennale: Synthetic Cinema Milestone',
              bulletPoints: [
                'First fully AI-generated feature film receives official jury commendation at a tier-one international film festival.',
                'Neural volume rendering achieves physically accurate subsurface scattering, motion blur, and atmospheric volumetrics indistinguishable from physical cinematography.',
                'Global festival circuit debates eligibility rules as industry guilds prepare position statements on AI creative works.',
              ],
            },
          },
          {
            id: 'blk_culture_p1',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'VENICE — In a defining moment for international filmmaking that will likely reshape creative industry regulations for decades, the 83rd Venice International Film Festival awarded a special jury commendation to "Meridian," a 94-minute feature-length dramatic narrative generated entirely through neural volume rendering without a single frame captured by a physical camera. The production, which took 14 months of iterative prompt engineering and aesthetic refinement, tells the story of three generations of a family navigating displacement across Mediterranean borders.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_culture_h1',
            blockType: 'heading',
            sortOrder: 2,
            data: { text: 'Technical Achievement: Neural Volume Rendering', level: 2 },
          },
          {
            id: 'blk_culture_p2',
            blockType: 'paragraph',
            sortOrder: 3,
            data: {
              text: 'Cinematic reviewers noted that the visual fidelity surpassed previous AI-generated short films by an order of magnitude. The rendering pipeline achieved physically accurate subsurface scattering on skin, photorealistic motion blur at variable frame rates, and atmospheric volumetric fog effects that maintained temporal coherence across extended tracking shots. The system maintained consistent character identity and emotional micro-expressions across the full runtime—a technical feat that had eluded earlier diffusion-based video models.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_culture_image',
            blockType: 'image',
            sortOrder: 4,
            data: {
              url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
              altText: 'Neural volume rendering still from award-winning feature film Meridian',
              caption:
                'A scene from the jury-commended synthetic feature "Meridian" exhibiting physically accurate subsurface volumetric scattering and atmospheric depth-of-field effects.',
              credit: 'La Biennale di Venezia / Synthetic Cinema Archives',
              aspectRatio: '16:9',
            },
          },
          {
            id: 'blk_culture_quote',
            blockType: 'quote',
            sortOrder: 5,
            data: {
              quote:
                'We did not judge the pixels or the computation; we judged the ache in the human story it told. The emotional architecture of this film demanded recognition regardless of its production methodology.',
              attribution: 'Alberto Barbera',
              title: 'Artistic Director, Venice International Film Festival',
            },
          },
          {
            id: 'blk_culture_h2',
            blockType: 'heading',
            sortOrder: 6,
            data: { text: 'Industry Reaction and Awards Eligibility Debates', level: 2 },
          },
          {
            id: 'blk_culture_p3',
            blockType: 'paragraph',
            sortOrder: 7,
            data: {
              text: 'The commendation has ignited fierce debate across the global festival circuit. The Directors Guild of America issued a preliminary statement emphasizing the distinction between "tool-assisted filmmaking" and "fully autonomous generation," while the European Film Academy convened an emergency working group to draft eligibility guidelines before the 2027 festival season. Independent filmmakers expressed concern that AI-generated content could flood submission pipelines, while technology advocates argued that excluding synthetic cinema would stifle the most significant creative medium evolution since digital photography replaced celluloid.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_culture_poll',
            blockType: 'poll',
            sortOrder: 8,
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
          {
            id: 'blk_culture_p4',
            blockType: 'paragraph',
            sortOrder: 9,
            data: {
              text: 'The creative team behind "Meridian" emphasized that the production employed a human director, writers, and sound designers throughout, with the AI systems serving as the visual rendering pipeline rather than the narrative architect. They announced plans to release the full prompt engineering methodology as an open-source framework, enabling independent creators worldwide to produce feature-quality visual narratives without traditional studio budgets.',
              format: 'markdown',
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
          {
            id: 'blk_starship_ticker',
            blockType: 'live_ticker',
            sortOrder: 1,
            data: {
              title: 'Flight 7 Telemetry Monitor',
              refreshIntervalSeconds: 10,
              items: [
                {
                  symbol: 'ALT',
                  label: 'Orbital Altitude',
                  value: 182.4,
                  delta: 0.8,
                  unit: 'km',
                  sparkline: [45, 90, 130, 160, 175, 182.4],
                },
                {
                  symbol: 'VEL',
                  label: 'Velocity',
                  value: 27140,
                  delta: 120,
                  unit: 'km/h',
                  sparkline: [8000, 15000, 21000, 25500, 27140],
                },
                {
                  symbol: 'P-CH',
                  label: 'Raptor Chamber Pressure',
                  value: 348.5,
                  delta: -1.2,
                  unit: 'bar',
                  sparkline: [340, 345, 350, 349, 348.5],
                },
              ],
            },
          },
          {
            id: 'blk_starship_video',
            blockType: 'video',
            sortOrder: 2,
            data: {
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              posterUrl:
                'https://images.unsplash.com/photo-1517976487502-5f79b47e2c90?auto=format&fit=crop&w=1600&q=80',
              aspectRatio: '16:9',
              caption:
                'Live downlink footage: Super Heavy booster separation and catch maneuver telemetry.',
              durationSeconds: 195,
              transcription:
                'Flight Director: All 33 Raptor engines nominal during stage separation. Booster hot staging verified at T+2 minutes 42 seconds.',
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
          {
            id: 'blk_robotics_comparison',
            blockType: 'comparison',
            sortOrder: 3,
            data: {
              title: 'Assembly Architecture Comparison: Bipedal Humanoid vs. Fixed Gantry Arms',
              subjectA: {
                name: 'Bipedal Humanoid System (Gen 3)',
                points: [
                  'Dynamic mobility navigates legacy factory walkways without civil refits',
                  '22-DoF dexterous multi-finger hands handle flexible wire harness routing',
                  'Rapid task retraining via vision-language-action zero-shot foundation models',
                  'Shared human-robot workspace safety with compliant impedance force sensing',
                ],
              },
              subjectB: {
                name: 'Traditional Fixed Gantry Automation',
                points: [
                  'Requires dedicated protective safety cages and floor excavation footprint',
                  'Rigid pneumatic tooling restricted to predefined single-task jigs',
                  'Months of mechanical retooling needed for vehicle chassis design revisions',
                  'High high-speed repeat accuracy but zero environmental adaptiveness',
                ],
              },
            },
          },
          {
            id: 'blk_robotics_h1',
            blockType: 'heading',
            sortOrder: 4,
            data: { text: 'Labor Economics and Workforce Transition', level: 2 },
          },
          {
            id: 'blk_robotics_p2',
            blockType: 'paragraph',
            sortOrder: 5,
            data: {
              text: 'The economic implications extend beyond factory floor efficiency. Industrial labor economists estimate that each humanoid unit deployed at current capability levels displaces approximately 2.8 full-time equivalent manual assembly positions while creating 1.4 new roles in robotics supervision, maintenance programming, and human-robot coordination. Automotive unions have negotiated redeployment agreements ensuring displaced workers receive priority access to certified robotics technician training programs.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_robotics_p3',
            blockType: 'paragraph',
            sortOrder: 6,
            data: {
              text: 'Capital expenditure analysis shows that the total cost of ownership for a humanoid assembly unit achieves breakeven against manual labor costs within 14 months at current wage rates. The units operate continuously through three shifts without fatigue-related quality degradation, maintaining consistent sub-millimeter precision that human operators typically achieve only during the first four hours of a shift cycle.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_robotics_stat',
            blockType: 'statistic',
            sortOrder: 7,
            data: {
              value: '99.4%',
              label: 'Autonomous First-Pass Yield',
              trend: 'up',
              trendValue: '+8.2% vs human manual baseline',
              context: 'Measured over 120,000 cumulative production hours on live assembly lines.',
              sourceAttribution: 'Automotive Manufacturing Robotics Consortium',
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

    // Story 14: Picks For You — Neuromorphic Silicon (Summary, Lead, Flow, Image)
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
          {
            id: 'blk_neuro_flow',
            blockType: 'flow',
            sortOrder: 2,
            data: {
              title: 'Event-Based Neuromorphic Processing Pipeline',
              steps: [
                {
                  stepNumber: 1,
                  title: 'Event-Camera Microsecond Sensing',
                  description:
                    'Asynchronous pixels detect logarithmic changes in luminance with microsecond temporal resolution.',
                  status: 'completed',
                },
                {
                  stepNumber: 2,
                  title: 'Spike Packet Encoding',
                  description:
                    'Binary action potentials generated only when pixel intensity changes exceed adaptive noise thresholds.',
                  status: 'completed',
                },
                {
                  stepNumber: 3,
                  title: 'Crossbar Synaptic Routing',
                  description:
                    'Non-volatile memristor crossbars execute in-memory matrix-vector multiply without off-chip DRAM bus latency.',
                  status: 'active',
                },
                {
                  stepNumber: 4,
                  title: 'Sub-Watt Inference Actuation',
                  description:
                    'Downstream flight control surfaces actuate within 1.2 milliseconds while consuming under 450mW total system power.',
                  status: 'pending',
                },
              ],
            },
          },
          {
            id: 'blk_neuro_h1',
            blockType: 'heading',
            sortOrder: 3,
            data: { text: 'Military and Space Applications', level: 2 },
          },
          {
            id: 'blk_neuro_p2',
            blockType: 'paragraph',
            sortOrder: 4,
            data: {
              text: "Defense procurement agencies have expressed immediate interest in neuromorphic inference accelerators for autonomous drone swarms operating in GPS-denied environments. The chips' ability to process visual odometry and obstacle avoidance at sub-watt power levels eliminates the need for bulky battery packs that constrain flight endurance. Satellite operators report that orbital deployment of neuromorphic vision modules reduced onboard computing power requirements by 87%, freeing electrical budget for enhanced communications payloads.",
              format: 'markdown',
            },
          },
          {
            id: 'blk_neuro_p3',
            blockType: 'paragraph',
            sortOrder: 5,
            data: {
              text: 'Commercial applications are equally promising. Agricultural drone companies plan to integrate the chips for real-time crop disease detection across thousand-hectare fields, while autonomous vehicle manufacturers are evaluating neuromorphic co-processors to handle rain and fog perception scenarios that overwhelm conventional convolutional neural network accelerators.',
              format: 'markdown',
            },
          },
          {
            id: 'blk_neuro_image',
            blockType: 'image',
            sortOrder: 6,
            data: {
              url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
              altText: 'Micrograph of Neuromorphic Silicon Die',
              caption:
                'Electron microscope scan of the event-based spiking neural network silicon core showing synaptic crossbar arrays and memristive interconnect topology.',
              credit: 'ETH Zurich & Fraunhofer Institute',
              aspectRatio: '16:9',
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

    // Story 15: Picks For You — CRISPR Clinical Milestone (Summary, Lead, Slide Deck)
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
          {
            id: 'blk_crispr_slides',
            blockType: 'slide_deck',
            sortOrder: 2,
            data: {
              title: 'Phase 3 In-Vivo Base Editing Clinical Dossier',
              slides: [
                {
                  slideNumber: 1,
                  title: 'Target Mutation & Molecular Mechanism',
                  body: 'Hereditary cardiomyopathy is driven by a single point mutation in the MYH7 sarcomeric gene causing myocardial hypertrophy.',
                  bullets: [
                    'Point mutation c.1208G>A identified in 100% of trial cohort',
                    'Engineered adenine base editor targets precise codon without double-strand break',
                    'Zero bystander nucleotide deaminations observed in pre-clinical screening',
                  ],
                  imageUrl:
                    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
                  sourceAttribution: 'New England Journal of Medicine 2026',
                },
                {
                  slideNumber: 2,
                  title: 'Organ-Specific Nanoparticle Delivery',
                  body: 'Ionizable lipid nanoparticles engineered with cardiac-tropic peptide ligands achieve selective cardiomyocyte uptake.',
                  bullets: [
                    '87% myocardial uptake with hepatic clearance below 12%',
                    'Single intravenous infusion administration without invasive catheterization',
                    'Transient mRNA expression clears within 48 hours post-infusion',
                  ],
                  sourceAttribution: 'Bioengineered Therapeutics Consortium',
                },
                {
                  slideNumber: 3,
                  title: 'Longitudinal Patient Recovery Outcomes',
                  body: 'Echocardiograms and exercise stress testing demonstrate dramatic reversal of diastolic dysfunction at 12-month evaluation.',
                  bullets: [
                    'Left ventricular wall thickness reduced by 3.8mm on average',
                    'Peak VO2 exercise capacity improved by 42% across all 48 patients',
                    '100% patient survival with zero arrhythmic adverse events recorded',
                  ],
                  sourceAttribution: 'Global Phase 3 Safety Monitoring Board',
                },
              ],
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

    // Story 16: Picks For You — Lunar Water-Ice Prospecting (Summary, Lead, Gallery)
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
          {
            id: 'blk_lunar_gallery',
            blockType: 'gallery',
            sortOrder: 2,
            data: {
              title: 'South Pole Radar Cartography & Prospecting Scans',
              images: [
                {
                  url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
                  altText: 'Shackleton Crater Rim Elevation Profile',
                  caption:
                    'Synthetic aperture radar topographic mapping showing permanently shadowed interior basins.',
                  credit: 'Lunar Reconnaissance Orbiter / ISRO Chandrayaan Data',
                },
                {
                  url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
                  altText: 'Subsurface Hydrogen Abundance Map',
                  caption:
                    'Neutron spectrometer readings highlighting volatile hydrogen deposits exceeding 4.2% water equivalent by mass.',
                  credit: 'Planetary Science Institute',
                },
              ],
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

    // Story 17: Picks For You — Sodium-Ion Grid Megapacks (Summary, Lead, ImageDiff)
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
          {
            id: 'blk_grid_imagediff',
            blockType: 'image_diff',
            sortOrder: 2,
            data: {
              beforeUrl:
                'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
              afterUrl:
                'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
              beforeLabel: 'Conventional LFP Under Stress',
              afterLabel: 'Prussian Blue Sodium-Ion (Cold Run)',
              caption:
                'Comparative thermal imaging under 3C continuous discharge: Sodium-ion cells show zero thermal hotspots with a 38°C lower core operating temperature.',
              orientation: 'horizontal',
              defaultSplitPercent: 50,
              credit: 'Renewable Energy Systems Laboratory',
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

    // Story 18: Picks For You — Quantum Key Distribution (Summary, Lead, Diagram)
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
          {
            id: 'blk_qkd_diagram',
            blockType: 'diagram',
            sortOrder: 2,
            data: {
              title: 'Satellite-to-Ground Entangled QKD Architecture',
              format: 'mermaid',
              definition:
                'graph LR\n  SAT[LEO QKD Satellite] -->|Downlink Beam 1| GS1[Frankfurt Ground Station]\n  SAT -->|Downlink Beam 2| GS2[London Ground Station]\n  GS1 -->|Encrypted Session Key| BB1[Bundesbank Node]\n  GS2 -->|Encrypted Session Key| BB2[Bank of England Node]\n  BB1 <-->|Post-Quantum Interbank Corridor| BB2',
              caption:
                'Synchronized photon-entanglement distribution downlinks establishing cryptographic one-time pad verification between Frankfurt and London clearing nodes.',
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
    } else {
      await db.stories.update(item.story);
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
        {
          storyId: 'sty_markets_01',
          publisher: 'Bloomberg Markets',
          headline: 'Central Banks Expand FX Clearing Grids to Settle Bilateral Energy Invoices',
          excerpt:
            'Direct local-currency corridors bypass dollar conversion spreads, saving an estimated $4.2B in annual transaction fees.',
          sourceType: 'wire',
          url: 'https://bloomberg.com/markets/brics-local-currency-clearing',
          timeAgo: '3 hours ago',
          angle: 'analytical',
          stance: 'Energy-backed trade corridors accelerate alternate currency payment velocity.',
        },
        {
          storyId: 'sty_brics_flagship',
          publisher: 'The Wall Street Journal',
          headline: 'IMF Monitors Parallel Reserves as Sovereign Clearing Accords Multiply',
          excerpt:
            'Multilateral monetary officials assess macroeconomic stability impacts as central banks diversify reserve asset baskets.',
          sourceType: 'analysis',
          url: 'https://wsj.com/economy/central-bank-reserve-diversification-brics',
          timeAgo: '5 hours ago',
          angle: 'institutional',
          stance:
            'Reserve fragmentation requires upgraded international balance-of-payments monitoring.',
        },
        {
          storyId: 'sty_brics_flagship',
          publisher: 'South China Morning Post',
          headline:
            'Cross-Border Trade Rails Handle Record Ruble, Rupee, and Yuan Settlement Volume',
          excerpt:
            'Port authorities in Shanghai, Mumbai, and Saint Petersburg confirm instantaneous electronic customs clearance using unified ledger protocols.',
          sourceType: 'regional',
          url: 'https://scmp.com/economy/global-economy/article/brics-cross-border-settlement',
          timeAgo: '6 hours ago',
          angle: 'grassroots',
          stance:
            'Direct merchant settlement drastically lowers supply-chain inventory financing burdens.',
        },
        {
          storyId: 'sty_brics_flagship',
          publisher: 'Al Jazeera English',
          headline: 'Global South Nations Welcome Dollar Independence as Trade Volumes Climb',
          excerpt:
            'Ministers emphasize that local clearing mechanisms shield developing economies from unilateral interest rate contagion and sanctions.',
          sourceType: 'international',
          url: 'https://aljazeera.com/economy/brics-trade-architecture-global-south',
          timeAgo: '7 hours ago',
          angle: 'analytical',
          stance: 'Monetary autonomy is an indispensable shield for sovereign development goals.',
        },
      ],
      timeline: [
        {
          date: 'Sep 25, 14:00 UTC',
          event: 'Working group of sherpas completes draft clearing house treaty',
          source: 'BRICS Trade Working Group',
          storyId: 'sty_brics_flagship',
        },
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
          date: 'Sep 28, 11:30 UTC',
          event:
            'Technical architecture interlinks central bank real-time gross settlement systems',
          source: 'Inter-Bank Clearing Alliance',
          storyId: 'sty_brics_flagship',
        },
        {
          date: 'Sep 29, 14:00 UTC',
          event: 'Central monetary authorities activate bilateral clearing grid',
          source: 'Bloomberg Markets',
          storyId: 'sty_markets_01',
        },
        {
          date: 'Oct 01, 09:00 UTC',
          event:
            'First monthly settlement reconciliation confirms zero default across $22B turnover',
          source: 'Multilateral Clearing Bureau',
          storyId: 'sty_brics_flagship',
        },
      ],
      createdAt: '2026-09-25T14:00:00Z',
      updatedAt: '2026-10-01T09:00:00Z',
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
        {
          storyId: 'sty_ai_01',
          publisher: 'Reuters Technology',
          headline:
            'Enterprise Regulators Mandate Cryptographic Signatures on Autonomous Agent Commits',
          excerpt:
            'Federal cybersecurity standards require mathematical proof traces attached to all autonomous code deployments in core banking.',
          sourceType: 'wire',
          url: 'https://reuters.example.com/technology/autonomous-ai-code-audit-standards',
          timeAgo: '1 hour ago',
          angle: 'institutional',
          stance:
            'Verifiable governance safeguards critical infrastructure against non-deterministic drift.',
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
          date: 'Sep 29, 14:30 UTC',
          event: 'Regulators issue guidance on zero-hallucination automated verification gates',
          source: 'National Standards Body',
          storyId: 'sty_ai_01',
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
        {
          storyId: 'sty_pick_robotics_01',
          publisher: 'Wall Street Journal',
          headline:
            'Industrial Automakers Recalculate Labor Economics as Humanoids Enter Production',
          excerpt:
            'Factories report 38% reduction in component misalignments with continuous dual-arm manipulation handling hazardous battery cells.',
          sourceType: 'analysis',
          url: 'https://wsj.com/business/automotive-humanoid-robotics-deployment',
          timeAgo: '4 hours ago',
          angle: 'analytical',
          stance:
            'Humanoid robotics bridge the automation gap in facilities designed around human geometry.',
        },
        {
          storyId: 'sty_pick_robotics_01',
          publisher: 'MIT Technology Review',
          headline: 'Embodied Foundation Models Give Bipedal Robots Zero-Shot Tool Manipulation',
          excerpt:
            'Vision-language-action architectures allow factory robots to adapt to novel chassis variations without manual reprogramming.',
          sourceType: 'academic',
          url: 'https://technologyreview.com/2026/10/02/embodied-ai-humanoid-factory-floor',
          timeAgo: '6 hours ago',
          angle: 'scientific',
          stance:
            'End-to-end sensorimotor policies mark the transition to generalized physical intelligence.',
        },
        {
          storyId: 'sty_pick_robotics_01',
          publisher: 'Bloomberg Technology',
          headline: 'Factory Automation Giants Invest $5B into Humanoid Production Scale',
          excerpt:
            'Tier-1 component suppliers ramp robotic dexterity modules to satisfy surging demand for flexible manufacturing lines.',
          sourceType: 'industry',
          url: 'https://bloomberg.com/news/articles/2026-10-02/humanoid-robotics-manufacturing-scale',
          timeAgo: '3 hours ago',
          angle: 'industry',
          stance:
            'Capital expenditure shifts decisively from specialized gantry robots to general-purpose humanoids.',
        },
        {
          storyId: 'sty_pick_robotics_01',
          publisher: 'IEEE Spectrum',
          headline:
            'Tactile Sensor Skin Delivers 0.1 Millimeter Precision for Bipedal Manipulators',
          excerpt:
            'High-density piezoresistive fingertip arrays give robots the ability to thread delicate wire harnesses without human intervention.',
          sourceType: 'academic',
          url: 'https://spectrum.ieee.org/robotics/humanoids/tactile-sensor-skin-automotive',
          timeAgo: '5 hours ago',
          angle: 'scientific',
          stance:
            'Tactile feedback closes the final dexterity hurdle in precision electro-mechanical manufacturing.',
        },
        {
          storyId: 'sty_pick_robotics_01',
          publisher: 'Reuters Manufacturing Wire',
          headline: 'European Automakers Deploy 5,000 Humanoid Units Across Assembly Operations',
          excerpt:
            'Factory managers report 24/7 uptime in battery pouch stacking with zero thermal or ergonomic fatigue incidents.',
          sourceType: 'wire',
          url: 'https://reuters.example.com/business/automotive-humanoid-robotics-rollout-2026',
          timeAgo: '7 hours ago',
          angle: 'institutional',
          stance:
            'Adoption curves in automotive assembly mirror the early robotics revolution of the 1980s.',
        },
        {
          storyId: 'sty_pick_robotics_01',
          publisher: 'Financial Times Industrial',
          headline:
            'The Human-Robot Collaborative Workforce: Safety Standards Pass Regulatory Muster',
          excerpt:
            'Strict torque-limiting joint sensors and spatial computer vision ensure robots immediately yield when human technicians enter workspace.',
          sourceType: 'analysis',
          url: 'https://ft.com/content/humanoid-robotics-workplace-safety-certifications',
          timeAgo: '8 hours ago',
          angle: 'analytical',
          stance:
            'Harmonized ISO safety certifications pave the way for ubiquitous co-working environments.',
        },
      ],
      timeline: [
        {
          date: 'Oct 01, 14:00 UTC',
          event: 'Initial fleet of 200 humanoid units undergoes kinematic joint calibration',
          source: 'Production Engineering Division',
          storyId: 'sty_pick_robotics_01',
        },
        {
          date: 'Oct 02, 06:30 UTC',
          event:
            'Assembly line supervisor switches battery pack production bay to autonomous bipedal cell',
          source: 'Stuttgart Plant Operations',
          storyId: 'sty_pick_robotics_01',
        },
        {
          date: 'Oct 02, 09:00 UTC',
          event: 'Pilot plant completes 120,000 incident-free autonomous hours',
          source: 'Stuttgart Automation Consortium',
          storyId: 'sty_pick_robotics_01',
        },
        {
          date: 'Oct 02, 11:15 UTC',
          event:
            'Joint union-management review validates zero workplace safety incidents during trial',
          source: 'Industrial Safety Oversight Board',
          storyId: 'sty_pick_robotics_01',
        },
        {
          date: 'Oct 02, 13:45 UTC',
          event:
            'Factory logs 4,000 consecutively assembled battery chassis packs meeting Six Sigma quality',
          source: 'Quality Assurance Directorate',
          storyId: 'sty_pick_robotics_01',
        },
        {
          date: 'Oct 02, 15:00 UTC',
          event:
            'Executive committee authorizes plant-wide rollout across secondary paint and weld lines',
          source: 'Corporate Manufacturing Board',
          storyId: 'sty_pick_robotics_01',
        },
      ],
      createdAt: '2026-10-01T14:00:00Z',
      updatedAt: '2026-10-02T15:00:00Z',
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
        {
          storyId: 'sty_pick_neuromorphic_01',
          publisher: 'EE Times',
          headline: 'Commercial Foundries Tape Out First Sub-500mW Event-Based AI Accelerators',
          excerpt:
            'Fabless designers package neuromorphic cores for defense drones and low-Earth orbit constellation edge compute.',
          sourceType: 'industry',
          url: 'https://eetimes.com/neuromorphic-sub-watt-edge-tapeout',
          timeAgo: '5 hours ago',
          angle: 'industry',
          stance:
            'Asynchronous event-driven processing fundamentally upends traditional von Neumann architectures.',
        },
        {
          storyId: 'sty_pick_neuromorphic_01',
          publisher: 'Ars Technica',
          headline: 'Why Neuromorphic Edge Silicon is the Secret Weapon for Orbital Autonomy',
          excerpt:
            'Spacecraft can now run real-time debris tracking and hazard navigation within strict 1-watt thermal budgets.',
          sourceType: 'analysis',
          url: 'https://arstechnica.com/science/neuromorphic-satellites-edge-vision',
          timeAgo: '7 hours ago',
          angle: 'analytical',
          stance:
            'Passive event listening represents the optimal paradigm for remote resource-constrained sensors.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 07:00 UTC',
          event:
            'High-altitude stratospheric drone completes 10-hour autonomous tracking mission powered by solar skin',
          source: 'Zurich Flight Test Division',
          storyId: 'sty_pick_neuromorphic_01',
        },
        {
          date: 'Oct 02, 09:30 UTC',
          event: 'Orbital and drone flight testing confirms sub-450mW real-time inference',
          source: 'Zurich AI Hardware Summit',
          storyId: 'sty_pick_neuromorphic_01',
        },
        {
          date: 'Oct 02, 11:45 UTC',
          event:
            'Standardization committee releases open-source spiking neural network programming interfaces',
          source: 'Neuromorphic Computing Working Group',
          storyId: 'sty_pick_neuromorphic_01',
        },
      ],
      createdAt: '2026-10-02T07:00:00Z',
      updatedAt: '2026-10-02T11:45:00Z',
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
        {
          storyId: 'sty_pick_crispr_01',
          publisher: 'New England Journal of Medicine',
          headline:
            'Complete Normalization of Ejection Fraction Following Single-Dose Base Editor Infusion',
          excerpt:
            'Cardiomyopathy patients show sustained MYBPC3 protein expression with no detectable off-target genomic cleavage.',
          sourceType: 'academic',
          url: 'https://nejm.org/doi/full/10.1056/NEJMoa2601992',
          timeAgo: '6 hours ago',
          angle: 'scientific',
          stance:
            'Permanent genetic repair eliminates lifelong dependence on mechanical assistive pumps.',
        },
        {
          storyId: 'sty_pick_crispr_01',
          publisher: 'STAT News',
          headline:
            'Biopharma Accelerates In-Vivo Pipeline Following Breakthrough Cardiomyopathy Data',
          excerpt:
            'Shares surge across gene editing pioneers as regulators grant priority review for congenital cardiac therapeutics.',
          sourceType: 'industry',
          url: 'https://statnews.com/2026/10/02/crispr-cardiomyopathy-phase-3-pipeline',
          timeAgo: '2 hours ago',
          angle: 'industry',
          stance:
            'Targeted organ delivery transforms gene therapy from rare monogenic niches to mainstream cardiology.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 08:00 UTC',
          event: 'Global regulatory consortium accepts expedited biologics license application',
          source: 'International Medicines Council',
          storyId: 'sty_pick_crispr_01',
        },
        {
          date: 'Oct 02, 10:00 UTC',
          event: 'Phase 3 trial unblinds 12-month biopsy data confirming 94% correction',
          source: 'Global Health Consortium',
          storyId: 'sty_pick_crispr_01',
        },
        {
          date: 'Oct 02, 12:15 UTC',
          event: 'Long-term cardiology registry records 98% patient exercise tolerance recovery',
          source: 'Cardiomyopathy Foundation',
          storyId: 'sty_pick_crispr_01',
        },
      ],
      createdAt: '2026-10-02T08:00:00Z',
      updatedAt: '2026-10-02T12:15:00Z',
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
        {
          storyId: 'sty_pick_space_mining_01',
          publisher: 'Nature Astronomy',
          headline:
            'Synthetic Aperture Radar Confirms 600 Million Metric Tons of Polar Subsurface Ice',
          excerpt:
            'Purity levels exceeding 88% indicate minimal mineral contamination, dramatically lowering energy needed for thermal extraction.',
          sourceType: 'academic',
          url: 'https://nature.com/articles/s41550-026-02104-w',
          timeAgo: '7 hours ago',
          angle: 'scientific',
          stance:
            'Abundant volatile deposits solidify polar craters as permanent human exploration hubs.',
        },
        {
          storyId: 'sty_pick_space_mining_01',
          publisher: 'SpaceNews',
          headline:
            'International Space Resource Alliance Proposes Universal Lunar Prospecting Registry',
          excerpt:
            'Commercial mining ventures and sovereign agencies align on non-interference zones for ice harvesting in permanently shadowed regions.',
          sourceType: 'analysis',
          url: 'https://spacenews.com/lunar-water-ice-prospecting-registry-framework',
          timeAgo: '3 hours ago',
          angle: 'analytical',
          stance:
            'Clear property and utilization frameworks prevent geopolitical disputes over polar claims.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 07:30 UTC',
          event:
            'Polar reconnaissance orbiter completes 50-pass neutron spectroscopy scan over Shackleton Crater',
          source: 'Deep Space Science Directorate',
          storyId: 'sty_pick_space_mining_01',
        },
        {
          date: 'Oct 02, 10:15 UTC',
          event: 'Synthetic aperture radar validates subterranean glaciers across 8m depth',
          source: 'Artemis Science Directorate',
          storyId: 'sty_pick_space_mining_01',
        },
        {
          date: 'Oct 02, 13:00 UTC',
          event:
            'Commercial mining joint venture selects primary landing coordinates for autonomous thermal drill rover',
          source: 'Lunar Resources Consortium',
          storyId: 'sty_pick_space_mining_01',
        },
      ],
      createdAt: '2026-10-02T07:30:00Z',
      updatedAt: '2026-10-02T13:00:00Z',
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
        {
          storyId: 'sty_pick_grid_storage_01',
          publisher: 'Financial Times Energy',
          headline: 'Global Utilities Switch Bulk Storage Procurement to Sodium Chemistries',
          excerpt:
            'Supply chains free from lithium, nickel, and cobalt bottlenecks allow rapid gigawatt-hour scale deployments.',
          sourceType: 'analysis',
          url: 'https://ft.com/energy/sodium-ion-bulk-utility-storage-orders',
          timeAgo: '4 hours ago',
          angle: 'analytical',
          stance:
            'Mineral abundance insulates grid decarbonization from commodity geopolitical spikes.',
        },
        {
          storyId: 'sty_pick_grid_storage_01',
          publisher: 'IEEE Spectrum',
          headline:
            'Thermal Quench Immunity Demonstrated Across 1.2 GWh Continuous Megapack Testing',
          excerpt:
            'Zero degradation observed over 4,000 extreme-temperature cycles, establishing 25-year operational warranties.',
          sourceType: 'academic',
          url: 'https://spectrum.ieee.org/energy/sodium-ion-grid-thermal-immunity',
          timeAgo: '2 hours ago',
          angle: 'scientific',
          stance:
            'Non-flammable aqueous electrolytes remove stringent fire-suppression requirements for urban substations.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 08:45 UTC',
          event: '12 regional substation transformers complete grid interconnect synchronization',
          source: 'Regional Power Grid Authority',
          storyId: 'sty_pick_grid_storage_01',
        },
        {
          date: 'Oct 02, 10:30 UTC',
          event: '1.2 GWh utility park completes 4,000-cycle frequency response validation',
          source: 'Energy Transition Registry',
          storyId: 'sty_pick_grid_storage_01',
        },
        {
          date: 'Oct 02, 12:45 UTC',
          event:
            'Energy reliability commission certifies plant for primary frequency regulation reserve',
          source: 'National Grid Oversight Board',
          storyId: 'sty_pick_grid_storage_01',
        },
      ],
      createdAt: '2026-10-02T08:45:00Z',
      updatedAt: '2026-10-02T12:45:00Z',
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
        {
          storyId: 'sty_pick_quantum_crypto_01',
          publisher: 'Nature Physics',
          headline:
            'Satellite-to-Ground Entangled Photon Links Sustain Sub-1% Quantum Bit Error Rate',
          excerpt:
            'High-speed adaptive optics on ground receivers cancel atmospheric turbulence, maintaining photon coherence over 2,400km orbital baselines.',
          sourceType: 'academic',
          url: 'https://nature.com/articles/s41567-026-00892-z',
          timeAgo: '5 hours ago',
          angle: 'scientific',
          stance:
            'Hardware verification validates quantum cryptography as ready for operational deployment.',
        },
        {
          storyId: 'sty_pick_quantum_crypto_01',
          publisher: 'Bloomberg Technology',
          headline:
            'SWIFT and BIS Back Satellite Quantum Security Standards for Sovereign Reserves',
          excerpt:
            'A coalition of 14 central clearing depositories adopts automated one-time pad key refreshment to counter harvest-now-decrypt-later adversaries.',
          sourceType: 'analysis',
          url: 'https://bloomberg.com/news/articles/2026-10-02/swift-bis-satellite-quantum-keys',
          timeAgo: '3 hours ago',
          angle: 'analytical',
          stance:
            'Institutional adoption insulates global payments from projected quantum computing decryption threats.',
        },
        {
          storyId: 'sty_pick_quantum_crypto_01',
          publisher: 'Reuters Global Wire',
          headline:
            'International Banking Consortium Enacts Protocol for Quantum-Protected Multilateral Clearing',
          excerpt:
            'Direct satellite downlinks across Zurich, Singapore, and New York complete live clearing runs with zero packet compromise.',
          sourceType: 'wire',
          url: 'https://reuters.example.com/technology/quantum-banking-settlement-accord-2026',
          timeAgo: '1 hour ago',
          angle: 'institutional',
          stance:
            'Standardized quantum key exchange removes bilateral counterparty cybersecurity exposure.',
        },
        {
          storyId: 'sty_pick_quantum_crypto_01',
          publisher: 'The Wall Street Journal',
          headline:
            'Clearinghouses Face Multibillion-Dollar Upgrade Race for Post-Quantum Compliance',
          excerpt:
            'Top custodian banks warn that retrofitting legacy SWIFT payment gateways will require dedicated hardware security modules across 4,000 branch endpoints.',
          sourceType: 'analysis',
          url: 'https://wsj.com/finance/quantum-cryptography-banking-migration',
          timeAgo: '6 hours ago',
          angle: 'analytical',
          stance: 'Implementation costs will be heavily frontloaded, favoring scale players.',
        },
        {
          storyId: 'sty_pick_quantum_crypto_01',
          publisher: 'Wired Science',
          headline: 'How Satellite-Based Entangled Photons Beat the Fiber Distance Limit',
          excerpt:
            'While terrestrial optical fibers lose signal integrity beyond 100km without quantum repeaters, vacuum-based orbital beams traverse thousands of miles unattenuated.',
          sourceType: 'industry',
          url: 'https://wired.com/science/quantum-entanglement-satellites-explained',
          timeAgo: '8 hours ago',
          angle: 'scientific',
          stance: 'Orbital QKD leapfrogs decades of terrestrial repeater engineering hurdles.',
        },
        {
          storyId: 'sty_pick_quantum_crypto_01',
          publisher: 'The Economist',
          headline: 'The Geopolitics of Sovereign Quantum Cryptographic Bastions',
          excerpt:
            'Nations lacking domestic orbital quantum infrastructure risk strategic blindness in financial surveillance and inter-bank secrecy.',
          sourceType: 'opinion',
          url: 'https://economist.com/international/geopolitics-quantum-communications',
          timeAgo: '9 hours ago',
          angle: 'analytical',
          stance: 'Cryptographic sovereignty is becoming as pivotal as physical energy reserves.',
        },
        {
          storyId: 'sty_pick_quantum_crypto_01',
          publisher: 'MIT Technology Review',
          headline:
            'Quantum Random Number Generators on Orbit Pass Strict Continuous Randomness Audits',
          excerpt:
            'Photonic shot noise sensors generate true non-deterministic entropy seeds at 2.4 Gbps, passing all Dieharder and NIST SP 800-22 tests.',
          sourceType: 'academic',
          url: 'https://technologyreview.com/2026/10/02/quantum-entropy-satellite-orbit',
          timeAgo: '10 hours ago',
          angle: 'scientific',
          stance:
            'True physical randomness closes side-channel vulnerabilities inherent in pseudo-random algorithms.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 06:00 UTC',
          event:
            'Low-Earth orbit quantum satellite establishes initial optical beacon with Zurich ground station',
          source: 'European Space Operations Centre',
          storyId: 'sty_pick_quantum_crypto_01',
        },
        {
          date: 'Oct 02, 08:15 UTC',
          event: 'Atmospheric adaptive optics sensors achieve sub-second wavefront calibration',
          source: 'Mount Säntis Observatory',
          storyId: 'sty_pick_quantum_crypto_01',
        },
        {
          date: 'Oct 02, 10:45 UTC',
          event: 'Satellite-to-ground downlink demonstrates 1.4 microradian beam lock',
          source: 'European Quantum Consortium',
          storyId: 'sty_pick_quantum_crypto_01',
        },
        {
          date: 'Oct 02, 12:30 UTC',
          event: '14 central bank clearing nodes execute live cryptographic key rotation',
          source: 'Bank for International Settlements',
          storyId: 'sty_pick_quantum_crypto_01',
        },
        {
          date: 'Oct 02, 14:00 UTC',
          event:
            'Consortium publishes audit confirming 0.8% quantum bit error rate across 10GB test tranche',
          source: 'National Institute of Standards and Technology',
          storyId: 'sty_pick_quantum_crypto_01',
        },
        {
          date: 'Oct 02, 15:30 UTC',
          event:
            'Financial Stability Board approves operational guidelines for cross-border QKD corridors',
          source: 'FSB Secretariat Basel',
          storyId: 'sty_pick_quantum_crypto_01',
        },
      ],
      createdAt: '2026-10-02T06:00:00Z',
      updatedAt: '2026-10-02T15:30:00Z',
    },
    {
      id: 'cls_semiconductor_consortium',
      organizationId: 'org_default',
      title: 'Global 2nm Semiconductor Manufacturing & Patent Consortium',
      summary:
        'Major foundries and chip designers agree to cross-licensing pact and standardized High-NA EUV lithography tooling.',
      leadStoryId: 'sty_semi_01',
      storyIds: ['sty_semi_01', 'sty_ai_01'],
      topic: 'top_semiconductors',
      category: 'technology',
      perspectives: [
        {
          storyId: 'sty_semi_01',
          publisher: 'Wall Street Journal',
          headline: 'Leading Foundries Announce Joint 2nm Process Rules to Avert Fab Bottlenecks',
          excerpt:
            'Uniform GAAFET transistor libraries will allow fabless designers to multi-source wafer runs without redesign.',
          sourceType: 'analysis',
          url: 'https://wsj.com/tech/2nm-foundry-consortium-standard',
          timeAgo: '4 hours ago',
          angle: 'analytical',
          stance: 'Interoperable packaging addresses global supply-chain fragmentation.',
        },
        {
          storyId: 'sty_semi_01',
          publisher: 'EE Times',
          headline: 'High-NA EUV Scanner Deployment Achieves 80% Commercial Yield Threshold',
          excerpt:
            '0.55 NA optics deliver required sub-8nm edge placement accuracy on 300mm test wafers.',
          sourceType: 'industry',
          url: 'https://eetimes.com/high-na-euv-commercial-yield-validation',
          timeAgo: '2 hours ago',
          angle: 'scientific',
          stance: 'Tool maturity outpaces industry skepticism, locking in 2027 volume ramp.',
        },
        {
          storyId: 'sty_semi_01',
          publisher: 'Financial Times Tech',
          headline: 'TSMC, Intel, and Samsung Ratify Reciprocal Cross-Licensing Framework',
          excerpt:
            'Historic IP-sharing agreement removes multi-jurisdictional patent litigation risk surrounding backside power delivery.',
          sourceType: 'analysis',
          url: 'https://ft.com/tech/2nm-foundry-cross-licensing-pact',
          timeAgo: '3 hours ago',
          angle: 'institutional',
          stance:
            'Cross-licensing ensures multi-fab supply-chain redundancy for enterprise AI hyperscalers.',
        },
        {
          storyId: 'sty_semi_01',
          publisher: 'Nikkei Asia',
          headline:
            'Asian Foundry Ecosystem Accelerates High-NA EUV Pilot Runs for 2027 Production',
          excerpt:
            'Equipment installations in Tainan and Pyeongtaek reach operational readiness ahead of scheduled commercial tape-outs.',
          sourceType: 'regional',
          url: 'https://asia.nikkei.com/business/tech/asia-2nm-foundry-ramp-2027',
          timeAgo: '5 hours ago',
          angle: 'regional',
          stance: 'Regional supply-chain integration cushions against geopolitical export shocks.',
        },
        {
          storyId: 'sty_semi_01',
          publisher: 'Reuters Technology',
          headline: 'Global Chip Coalition Pledges Open Standards for 3D Chiplet Interconnects',
          excerpt:
            'Standardized die-to-die optical interfaces will allow mixing logic, memory, and analog tiles on a single substrate.',
          sourceType: 'wire',
          url: 'https://reuters.example.com/technology/chiplet-interconnect-open-standard-2026',
          timeAgo: '6 hours ago',
          angle: 'industry',
          stance:
            'Modular packaging decouples transistor shrinkage from monolithic yield penalties.',
        },
        {
          storyId: 'sty_semi_01',
          publisher: 'MIT Technology Review',
          headline: 'Atomic-Layer GAAFET Etching Overcomes Quantum Tunneling Leakage',
          excerpt:
            'Nanosheet channels thinned to 3 nanometers maintain sharp on/off switching ratios at 0.65-volt operating points.',
          sourceType: 'academic',
          url: 'https://technologyreview.com/2026/09/27/gaafet-nanosheet-atomic-etching',
          timeAgo: '8 hours ago',
          angle: 'scientific',
          stance:
            'Atomic precision lithography preserves Moore Law efficiency scaling into the next decade.',
        },
        {
          storyId: 'sty_semi_01',
          publisher: 'Bloomberg Markets',
          headline:
            'Semiconductor Equipment Stocks Surge on 2nm Tooling Capital Expenditure Commitments',
          excerpt:
            'Foundries announce combined $85B capital allocation across lithography, metrology, and cleanroom automation.',
          sourceType: 'wire',
          url: 'https://bloomberg.com/news/articles/2026-09-27/2nm-tooling-capex-surge',
          timeAgo: '9 hours ago',
          angle: 'analytical',
          stance: 'Unprecedented equipment orders signal resilient long-term semiconductor demand.',
        },
      ],
      timeline: [
        {
          date: 'Sep 26, 16:00 UTC',
          event: 'Lead foundry executives convene closed-door summit at SEMICON Taiwan',
          source: 'Executive Steering Group',
          storyId: 'sty_semi_01',
        },
        {
          date: 'Sep 27, 08:30 UTC',
          event: 'Foundry consortium ratifies unified 2nm PDK specification',
          source: 'SEMICON Global',
          storyId: 'sty_semi_01',
        },
        {
          date: 'Sep 27, 12:00 UTC',
          event: 'Joint statement issues open packaging patent pool guidelines',
          source: 'Consortium Secretariat',
          storyId: 'sty_semi_01',
        },
        {
          date: 'Sep 27, 15:30 UTC',
          event: 'Lithography toolmaker verifies sub-8nm edge placement accuracy on pilot line',
          source: 'ASML Technical Briefing',
          storyId: 'sty_semi_01',
        },
        {
          date: 'Sep 28, 10:00 UTC',
          event: 'Hyperscale cloud providers submit initial 2nm AI accelerator tape-out requests',
          source: 'Open Compute Project',
          storyId: 'sty_semi_01',
        },
        {
          date: 'Sep 29, 14:00 UTC',
          event:
            'Trade ministries issue coordinated regulatory clearance for patent pool structure',
          source: 'International Antitrust Bureau',
          storyId: 'sty_semi_01',
        },
      ],
      createdAt: '2026-09-26T16:00:00Z',
      updatedAt: '2026-09-29T14:00:00Z',
    },
    {
      id: 'cls_iter_fusion_energy',
      organizationId: 'org_default',
      title: 'Magnetic Fusion Energy Q>1 Steady-State Milestone',
      summary:
        'High-temperature superconducting magnets maintain continuous fusion burn for 120 seconds, unlocking commercial pilot design.',
      leadStoryId: 'sty_fusion_01',
      storyIds: ['sty_fusion_01', 'sty_climate_01'],
      topic: 'top_fusion_energy',
      category: 'science',
      perspectives: [
        {
          storyId: 'sty_fusion_01',
          publisher: 'Nature Energy',
          headline: 'Continuous Q=1.35 Net Energy Confinement Realized in Compact Tokamak',
          excerpt:
            'Barium copper oxide magnet coils sustain 24-Tesla fields without thermal quench.',
          sourceType: 'academic',
          url: 'https://nature.com/articles/s41560-026-01422-9',
          timeAgo: '3 hours ago',
          angle: 'scientific',
          stance:
            'Superconducting tape economics enable compact, low-cost commercial fusion plants.',
        },
        {
          storyId: 'sty_fusion_01',
          publisher: 'Reuters Science Wire',
          headline: 'Energy Ministers Commit Capital for First Grid-Tied Fusion Prototype by 2032',
          excerpt:
            'International coalition pledges $14B to scale engineering test reactors based on superconducting magnets.',
          sourceType: 'wire',
          url: 'https://reuters.example.com/energy/superconducting-fusion-milestone-2026',
          timeAgo: '5 hours ago',
          angle: 'institutional',
          stance: 'Public-private funding accelerates grid connection timelines.',
        },
        {
          storyId: 'sty_fusion_01',
          publisher: 'BBC Science',
          headline: 'Fusion Milestone Hailed as Most Credible Clean Baseload Power Contender',
          excerpt:
            'Maintaining two continuous minutes of burning plasma proves magnetic stability without expensive gigawatt wall losses.',
          sourceType: 'general',
          url: 'https://bbc.com/news/science-environment-fusion-milestone',
          timeAgo: '4 hours ago',
          angle: 'general',
          stance:
            'Public enthusiasm surges as fusion transitions from theoretical physics to electrical engineering.',
        },
        {
          storyId: 'sty_fusion_01',
          publisher: 'Wired Tech',
          headline: 'Inside the Private Fusion Race: High-Field Magnets Shrink Tokamaks by 90%',
          excerpt:
            'Compact magnetic field strength allows startup reactors to achieve burning conditions in facilities the size of a gymnasium.',
          sourceType: 'industry',
          url: 'https://wired.com/story/private-fusion-superconducting-magnets',
          timeAgo: '6 hours ago',
          angle: 'industry',
          stance:
            'Modular construction turns multi-decade international megaprojects into fast-turnaround capital builds.',
        },
        {
          storyId: 'sty_fusion_01',
          publisher: 'The Wall Street Journal',
          headline:
            'Utility Consortia Sign First Commercial Power Purchase Offtake Letters for Fusion',
          excerpt:
            'Power generators lock in long-term supply pacts targeting 2035 commercial grid delivery to power AI data centers.',
          sourceType: 'analysis',
          url: 'https://wsj.com/business/energy/utility-fusion-power-purchase-agreements',
          timeAgo: '7 hours ago',
          angle: 'analytical',
          stance:
            'Energy-hungry tech hyperscalers are guaranteeing future fusion plant revenue streams.',
        },
        {
          storyId: 'sty_fusion_01',
          publisher: 'IEEE Spectrum',
          headline:
            'Tritium Breeding Blankets Achieve Self-Sustaining Regeneration Ratio in Test Loop',
          excerpt:
            'Beryllium-liquid lithium neutron multipliers demonstrate 1.15 tritium breeding ratio, solving long-term fuel scarcity fears.',
          sourceType: 'academic',
          url: 'https://spectrum.ieee.org/energy/nuclear/fusion-tritium-breeding-ratio',
          timeAgo: '8 hours ago',
          angle: 'scientific',
          stance:
            'Fuel self-sufficiency removes the last major resource bottleneck for magnetic confinement plants.',
        },
        {
          storyId: 'sty_fusion_01',
          publisher: 'The Guardian Environment',
          headline:
            'Environmental Regulators Classify Fusion Waste as Low-Level Recyclable Byproduct',
          excerpt:
            'Unlike conventional fission, materials activate for decades rather than millennia, simplifying decommissioning protocols.',
          sourceType: 'opinion',
          url: 'https://theguardian.com/environment/2026/sep/28/fusion-waste-classification-clean-energy',
          timeAgo: '9 hours ago',
          angle: 'analytical',
          stance:
            'Benign environmental footprint reinforces fusion as the optimal companion to solar and wind.',
        },
      ],
      timeline: [
        {
          date: 'Sep 28, 04:30 UTC',
          event: 'Cryogenic magnet chilldown reaches 4 Kelvin superconducting baseline',
          source: 'Plant Diagnostics Division',
          storyId: 'sty_fusion_01',
        },
        {
          date: 'Sep 28, 06:15 UTC',
          event: 'Plasma discharge reaches stable 120-second plateau at 150 million degrees',
          source: 'Fusion Test Facility Control Room',
          storyId: 'sty_fusion_01',
        },
        {
          date: 'Sep 28, 07:30 UTC',
          event: 'Diagnostic calorimeters confirm 1.35 net thermal energy factor',
          source: 'Independent Review Panel',
          storyId: 'sty_fusion_01',
        },
        {
          date: 'Sep 28, 11:00 UTC',
          event: 'Tritium breeding diagnostic logs 1.15 breeding ratio during extended pulse',
          source: 'IAEA Liaison Office',
          storyId: 'sty_fusion_01',
        },
        {
          date: 'Sep 28, 14:30 UTC',
          event: 'Consortium presents telemetry to international energy ministers in Paris',
          source: 'Energy Ministerial Assembly',
          storyId: 'sty_fusion_01',
        },
        {
          date: 'Sep 29, 09:00 UTC',
          event:
            'Public-private consortium initiates engineering procurement for 500MW grid prototype',
          source: 'Commercial Fusion Alliance',
          storyId: 'sty_fusion_01',
        },
      ],
      createdAt: '2026-09-28T04:30:00Z',
      updatedAt: '2026-09-29T09:00:00Z',
    },
    {
      id: 'cls_central_banks_liquidity',
      organizationId: 'org_default',
      title: 'Multilateral Central Bank Liquidity & FX Settlement Network',
      summary:
        'Sovereign reserve banks initiate automated cross-currency liquidity backstops to protect against dollar volatility spikes.',
      leadStoryId: 'sty_markets_01',
      storyIds: ['sty_markets_01', 'sty_brics_flagship'],
      topic: 'top_macroeconomics',
      category: 'business',
      perspectives: [
        {
          storyId: 'sty_markets_01',
          publisher: 'The Economist',
          headline: 'Central Banks Build Parallel Clearing Rails to De-Risk Reserves',
          excerpt:
            'Direct bilateral swap arrangements reduce reliance on intermediary correspondent banking networks.',
          sourceType: 'analysis',
          url: 'https://economist.com/finance-and-economics/multilateral-fx-clearing-rails',
          timeAgo: '3 hours ago',
          angle: 'analytical',
          stance: 'Diversified settlement architecture increases global financial resilience.',
        },
        {
          storyId: 'sty_markets_01',
          publisher: 'Bloomberg Markets',
          headline: 'FX Liquidity Swaps Settle in Real-Time Under New Multilateral Accord',
          excerpt:
            'First 24 hours of operation process $18B in sovereign trade settlements without friction.',
          sourceType: 'wire',
          url: 'https://bloomberg.com/news/articles/2026-09-29/fx-clearing-grid-volume-record',
          timeAgo: '1 hour ago',
          angle: 'industry',
          stance: 'Turnover rates confirm strong commercial appetite for non-intermediary rails.',
        },
      ],
      timeline: [
        {
          date: 'Sep 29, 09:00 UTC',
          event: 'Multilateral swap protocol activated across 12 participating central banks',
          source: 'BIS Monetary Panel',
          storyId: 'sty_markets_01',
        },
        {
          date: 'Sep 29, 13:45 UTC',
          event: 'First automated trade settlement tranche executes cleanly',
          source: 'Operations Clearinghouse',
          storyId: 'sty_markets_01',
        },
      ],
      createdAt: '2026-09-29T09:00:00Z',
      updatedAt: '2026-09-29T15:00:00Z',
    },
    {
      id: 'cls_quantum_processor_breakthrough',
      organizationId: 'org_default',
      title: 'Topological Quantum Processing & Fault-Tolerant Logical Qubits',
      summary:
        'Majorana zero mode braiding demonstrates 10,000 logical qubits with sub-1e-6 error thresholds under commercial cryogenics.',
      leadStoryId: 'sty_quantum_01',
      storyIds: ['sty_quantum_01', 'sty_pick_quantum_crypto_01'],
      topic: 'top_quantum_computing',
      category: 'technology',
      perspectives: [
        {
          storyId: 'sty_quantum_01',
          publisher: 'MIT Technology Review',
          headline: 'Topological Protection Solves the Quantum Decroherence Bottleneck',
          excerpt:
            'Non-Abelian braiding protects qubit states natively at the hardware level, bypassing millions of physical helper qubits.',
          sourceType: 'academic',
          url: 'https://technologyreview.com/2026/09/28/topological-quantum-processor-majorana',
          timeAgo: '4 hours ago',
          angle: 'scientific',
          stance:
            'Hardware-level protection compresses fault-tolerant commercial timeline by decades.',
        },
        {
          storyId: 'sty_quantum_01',
          publisher: 'Financial Times Tech',
          headline: 'Enterprise Cloud Giants Line Up for Topological QPU Compute Slots',
          excerpt:
            'Pharmaceutical and materials science consortiums book initial quantum chemical simulation batches.',
          sourceType: 'industry',
          url: 'https://ft.com/tech/topological-quantum-processor-enterprise-compute',
          timeAgo: '2 hours ago',
          angle: 'industry',
          stance: 'Commercial demand for quantum chemistry modeling exceeds initial fab capacity.',
        },
      ],
      timeline: [
        {
          date: 'Sep 28, 14:00 UTC',
          event: '10,000-logical-qubit benchmark successfully executes Bernstein-Vazirani proof',
          source: 'Quantum Standards Laboratory',
          storyId: 'sty_quantum_01',
        },
        {
          date: 'Sep 28, 16:30 UTC',
          event: 'Commercial cloud SDK released for quantum simulation clusters',
          source: 'Developer Consortium',
          storyId: 'sty_quantum_01',
        },
      ],
      createdAt: '2026-09-28T14:00:00Z',
      updatedAt: '2026-09-28T18:00:00Z',
    },
    {
      id: 'cls_lunar_gateway_orbit',
      organizationId: 'org_default',
      title: 'International Lunar Gateway Polar Orbit Insertion',
      summary:
        'Crew habitat and logistics modules complete autonomous burn to settle into Near-Rectilinear Halo Orbit around lunar south pole.',
      leadStoryId: 'sty_space_01',
      storyIds: ['sty_space_01', 'sty_pick_space_mining_01'],
      topic: 'top_space_exploration',
      category: 'science',
      perspectives: [
        {
          storyId: 'sty_space_01',
          publisher: 'Aviation Week & Space Technology',
          headline: 'Gateway Station Enters Permanent Halo Orbit Above Lunar South Pole',
          excerpt:
            'Solar electric propulsion system fires precisely to place Gateway in continuous line-of-sight with Earth.',
          sourceType: 'industry',
          url: 'https://aviationweek.com/space/lunar-gateway-near-rectilinear-halo-orbit',
          timeAgo: '5 hours ago',
          angle: 'industry',
          stance: 'Uninterrupted communication enables continuous robotic rover teleoperation.',
        },
        {
          storyId: 'sty_space_01',
          publisher: 'ESA Mission Dispatch',
          headline: 'International Crew Habitat Life Support Systems Verify 100% Nominal Readouts',
          excerpt:
            'Oxygen replenishment and closed-loop water reclamation subsystems pass orbital certification.',
          sourceType: 'institutional',
          url: 'https://esa.int/gateway/orbit-insertion-subsystem-status',
          timeAgo: '3 hours ago',
          angle: 'official',
          stance: 'Station is fully primed for upcoming international astronaut expedition.',
        },
      ],
      timeline: [
        {
          date: 'Sep 29, 05:30 UTC',
          event: 'Gateway electric propulsion engines commence perilune orbital insertion burn',
          source: 'Mission Control Center Houston',
          storyId: 'sty_space_01',
        },
        {
          date: 'Sep 29, 08:00 UTC',
          event: 'Near-Rectilinear Halo Orbit lock verified by Deep Space Network antennas',
          source: 'ESA Darmstadt Ground Station',
          storyId: 'sty_space_01',
        },
      ],
      createdAt: '2026-09-29T05:30:00Z',
      updatedAt: '2026-09-29T10:00:00Z',
    },
    {
      id: 'cls_solid_state_grid_storage',
      organizationId: 'org_default',
      title: 'Global Grid Integration of 500 GWh Solid-State Energy Storage',
      summary:
        'Deployment of ceramic electrolyte batteries stabilizes intercontinental renewable transmission corridors and cuts peak power tariffs.',
      leadStoryId: 'sty_climate_01',
      storyIds: ['sty_climate_01', 'sty_pick_grid_storage_01'],
      topic: 'top_climate_transition',
      category: 'science',
      perspectives: [
        {
          storyId: 'sty_climate_01',
          publisher: 'Bloomberg Green',
          headline: 'Solid-State Battery Installations Surpass 500 GWh Milestone Worldwide',
          excerpt:
            'Utility-scale projects prove 20-year cycle longevity with zero degradation at high ambient temperatures.',
          sourceType: 'industry',
          url: 'https://bloomberg.com/green/solid-state-grid-500gwh-milestone',
          timeAgo: '2 hours ago',
          angle: 'industry',
          stance: 'Elimination of thermal runaway safeguards high-density urban transformer yards.',
        },
        {
          storyId: 'sty_climate_01',
          publisher: 'Clean Energy Wire',
          headline: 'Grid Operators Cut Peaker Plant Reliance by 40% Following Storage Expansion',
          excerpt:
            'Instantaneous millisecond battery discharge handles transient renewable drop-offs during storm fronts.',
          sourceType: 'analysis',
          url: 'https://cleanenergywire.org/solid-state-peaker-plant-reduction',
          timeAgo: '4 hours ago',
          angle: 'analytical',
          stance:
            'Grid stability proves renewables can safely satisfy 90%+ of baseline industrial load.',
        },
      ],
      timeline: [
        {
          date: 'Sep 29, 09:30 UTC',
          event: 'Interconnection councils certify 500 GWh aggregate operational threshold',
          source: 'Global Energy Transition Council',
          storyId: 'sty_climate_01',
        },
        {
          date: 'Sep 29, 14:00 UTC',
          event: 'Tariff regulators record 35% decline in regional peak power surcharges',
          source: 'International Energy Agency',
          storyId: 'sty_climate_01',
        },
      ],
      createdAt: '2026-09-29T09:30:00Z',
      updatedAt: '2026-09-29T16:00:00Z',
    },
    {
      id: 'cls_pan_coronavirus_mrna',
      organizationId: 'org_default',
      title: 'Broad-Spectrum Pan-Coronavirus mRNA Therapeutic Phase 3 Clearance',
      summary:
        'Conserved viral stem epitope formulation neutralizes all known coronaviral lineages with durable mucosal immunity.',
      leadStoryId: 'sty_health_01',
      storyIds: ['sty_health_01', 'sty_pick_crispr_01'],
      topic: 'top_biotech_genomics',
      category: 'health',
      perspectives: [
        {
          storyId: 'sty_health_01',
          publisher: 'The Lancet',
          headline:
            'Phase 3 Clinical Trial Demonstrates 96% Efficacy Across Diverse Viral Lineages',
          excerpt:
            'Broad neutralizing antibody titers remain stable past 12 months with zero immune escape.',
          sourceType: 'academic',
          url: 'https://thelancet.com/journals/lancet/pan-coronavirus-phase3-validation',
          timeAgo: '3 hours ago',
          angle: 'scientific',
          stance: 'Epitope stabilization eliminates need for seasonal vaccine reformulation.',
        },
        {
          storyId: 'sty_health_01',
          publisher: 'WHO Global Health Wire',
          headline: 'World Health Organization Authorizes Pre-Qualification for Global Stockpile',
          excerpt:
            'Therapeutic distributed under universal licensing treaty to guarantee equitable developing-nation access.',
          sourceType: 'wire',
          url: 'https://who.int/news/pan-coronavirus-therapeutic-stockpile-accord',
          timeAgo: '1 hour ago',
          angle: 'institutional',
          stance: 'Equitable global distribution halts future zoonotic spillover pandemic chains.',
        },
      ],
      timeline: [
        {
          date: 'Sep 30, 08:00 UTC',
          event: 'Data Safety Monitoring Board unblinds Phase 3 efficacy dataset',
          source: 'Consortium Coordinating Center Geneva',
          storyId: 'sty_health_01',
        },
        {
          date: 'Sep 30, 11:30 UTC',
          event: 'Regulators initiate expedited rolling approval protocol across 40 countries',
          source: 'Global Health Authority Network',
          storyId: 'sty_health_01',
        },
      ],
      createdAt: '2026-09-30T08:00:00Z',
      updatedAt: '2026-09-30T13:00:00Z',
    },
    {
      id: 'cls_zero_day_power_grids',
      organizationId: 'org_default',
      title: 'Coordinated Zero-Day Patch Deployment Across Critical Power Grids',
      summary:
        'Cybersecurity task forces distribute cryptographically signed firmware to isolate remote SCADA vulnerabilities in continental grids.',
      leadStoryId: 'sty_cyber_01',
      storyIds: ['sty_cyber_01'],
      topic: 'top_cybersecurity',
      category: 'technology',
      perspectives: [
        {
          storyId: 'sty_cyber_01',
          publisher: 'Wired Security',
          headline: 'Emergency Firmware Patch Deployed to Thousands of Substation Relays',
          excerpt:
            'Automated verification scripts confirm vulnerability neutralized without a single kilowatt of outage.',
          sourceType: 'industry',
          url: 'https://wired.com/security/power-grid-zero-day-coordinated-patch',
          timeAgo: '2 hours ago',
          angle: 'industry',
          stance:
            'Zero-downtime hot-patching architecture prevents potential systemic blackout threats.',
        },
        {
          storyId: 'sty_cyber_01',
          publisher: 'Cyber Security Agency Brief',
          headline: 'National Infrastructure Regulators Confirm Threat Actor Access Denied',
          excerpt:
            'Forensic honeypot telemetry indicates intruder scripts failed to execute payload past defensive airgaps.',
          sourceType: 'official',
          url: 'https://cisa.gov/alerts/substation-scada-zero-day-mitigation',
          timeAgo: '4 hours ago',
          angle: 'official',
          stance: 'International cyber coordination neutralized threat prior to weaponization.',
        },
      ],
      timeline: [
        {
          date: 'Sep 30, 10:00 UTC',
          event: 'Threat intelligence alliance discovers unpatched SCADA communication flaw',
          source: 'CERT Joint Operations',
          storyId: 'sty_cyber_01',
        },
        {
          date: 'Sep 30, 14:15 UTC',
          event: 'Coordinated air-gapped cryptographic update rolled out to 12,000 substations',
          source: 'Power Reliability Council',
          storyId: 'sty_cyber_01',
        },
      ],
      createdAt: '2026-09-30T10:00:00Z',
      updatedAt: '2026-09-30T16:00:00Z',
    },
    {
      id: 'cls_synthetic_cinema_venice',
      organizationId: 'org_default',
      title: 'Venice Biennale Awards Fully Synthetic Generative Feature Film',
      summary:
        'International jury recognizes human-directed neural cinema, sparking intense debate on intellectual property and artistic agency.',
      leadStoryId: 'sty_culture_01',
      storyIds: ['sty_culture_01'],
      topic: 'top_culture_cinema',
      category: 'culture',
      perspectives: [
        {
          storyId: 'sty_culture_01',
          publisher: 'Variety',
          headline: 'Venice Film Festival Awards Golden Lion to Neural Cinematography Pioneer',
          excerpt:
            'Jury commends emotional depth and innovative non-linear narrative rendered entirely via diffusion engines.',
          sourceType: 'industry',
          url: 'https://variety.com/film/venice-biennale-synthetic-feature-golden-lion',
          timeAgo: '5 hours ago',
          angle: 'industry',
          stance:
            'Technological leap transforms film production from capital-intensive to imagination-driven.',
        },
        {
          storyId: 'sty_culture_01',
          publisher: 'Cahiers du Cinéma',
          headline: 'The Author in the Age of Generative Latent Space',
          excerpt:
            'Critics argue the director remains the singular creative compass directing algorithmic aesthetics.',
          sourceType: 'analysis',
          url: 'https://cahiersducinema.com/art-cinematographique-ia-2026',
          timeAgo: '3 hours ago',
          angle: 'analytical',
          stance: 'Prompting and directorial curation constitute genuine cinematic authorship.',
        },
      ],
      timeline: [
        {
          date: 'Oct 01, 16:00 UTC',
          event: 'Venice International Film Festival screens synthetic feature in main competition',
          source: 'Biennale Cinema Press Office',
          storyId: 'sty_culture_01',
        },
        {
          date: 'Oct 01, 20:30 UTC',
          event: 'Jury awards Golden Lion citing groundbreaking visual poetry',
          source: 'Palazzo del Cinema Jury Declaration',
          storyId: 'sty_culture_01',
        },
      ],
      createdAt: '2026-10-01T16:00:00Z',
      updatedAt: '2026-10-01T22:00:00Z',
    },
    {
      id: 'cls_starship_flight7_telemetry',
      organizationId: 'org_default',
      title: 'Starship Flight 7 Orbital Flight Test & Tower Catch',
      summary:
        'Super Heavy booster and orbital ship achieve full trajectory objectives with dual robotic chopstick mechanical recovery.',
      leadStoryId: 'sty_liveblog_starship',
      storyIds: ['sty_liveblog_starship', 'sty_space_01'],
      topic: 'top_space_exploration',
      category: 'science',
      perspectives: [
        {
          storyId: 'sty_liveblog_starship',
          publisher: 'NASASpaceFlight',
          headline: 'Super Heavy Booster and Ship Both Recovered Intact in Landmark Flight 7',
          excerpt:
            'Mechanical catch arms capture falling vehicle within 5 centimeters of centerline tolerance.',
          sourceType: 'industry',
          url: 'https://nasaspaceflight.com/starship-flight-7-catch-success',
          timeAgo: '1 hour ago',
          angle: 'industry',
          stance:
            'Rapid orbital reusability makes interplanetary payload costs plummet exponentially.',
        },
        {
          storyId: 'sty_liveblog_starship',
          publisher: 'Reuters Aerospace',
          headline: 'Space Regulators Clear High-Cadence Commercial Flight License Protocol',
          excerpt:
            'Federal Aviation Administration issues programmatic environmental finding supporting 25 launches annually.',
          sourceType: 'wire',
          url: 'https://reuters.example.com/aerospace/faa-starship-orbital-cadence-2026',
          timeAgo: '3 hours ago',
          angle: 'institutional',
          stance:
            'Regulatory approval unlocks routine lunar logistics and Mars cargo architecture.',
        },
        {
          storyId: 'sty_liveblog_starship',
          publisher: 'Aviation Week',
          headline: 'Dual Catch Verification Confirms 24-Hour Turnaround Economics for Heavy Lift',
          excerpt:
            'Post-flight thermal imaging on heat shield tiles shows negligible degradation across forward flaps and nosecone apex.',
          sourceType: 'industry',
          url: 'https://aviationweek.com/space/starship-flight-7-dual-tower-catch',
          timeAgo: '2 hours ago',
          angle: 'industry',
          stance:
            'Orbital hardware inspection confirms hardware readiness for immediate propellant reloading.',
        },
        {
          storyId: 'sty_liveblog_starship',
          publisher: 'The Wall Street Journal',
          headline: 'Satellite Megaconstellation Operators Queue for 150-Ton Payload Slots',
          excerpt:
            'Telecommunications and defense satellite providers calculate cost-per-kilogram plummeting below $100.',
          sourceType: 'analysis',
          url: 'https://wsj.com/business/aerospace/starship-commercial-payload-pricing',
          timeAgo: '4 hours ago',
          angle: 'analytical',
          stance: 'Unprecedented payload capacity fundamentally expands commercial space commerce.',
        },
        {
          storyId: 'sty_liveblog_starship',
          publisher: 'BBC News Science',
          headline: 'Spectacular Mid-Air Tower Catch Brings Artemis Moon Landing Milestones Closer',
          excerpt:
            'NASA leadership congratulates engineering teams as critical lunar human landing system milestones unlock.',
          sourceType: 'general',
          url: 'https://bbc.com/news/science-space-starship-flight-7',
          timeAgo: '5 hours ago',
          angle: 'general',
          stance: 'Reusability milestone keeps Artemis astronaut lunar landing schedule on track.',
        },
        {
          storyId: 'sty_liveblog_starship',
          publisher: 'IEEE Spectrum',
          headline: 'Raptor 3 Internal Cooling Channels Eliminate External Fire Blankets',
          excerpt:
            '3D-printed internal regenerative manifolds shave 1,200 kilograms of structural mass while improving thermal margins.',
          sourceType: 'academic',
          url: 'https://spectrum.ieee.org/aerospace/space-flight/raptor-3-regenerative-cooling',
          timeAgo: '6 hours ago',
          angle: 'scientific',
          stance:
            'Engine manufacturing advances enable high reliability during radical aerodynamic deceleration.',
        },
        {
          storyId: 'sty_liveblog_starship',
          publisher: 'Ars Technica',
          headline:
            'Flight 7 Telemetry Proves Ship Catch Dynamics Were Even Smoother Than the Booster',
          excerpt:
            'Laser radar guidance systems adjusted vehicle approach vectors within 20 milliseconds of final aerodynamic flare.',
          sourceType: 'analysis',
          url: 'https://arstechnica.com/space/starship-flight-7-telemetry-deep-dive',
          timeAgo: '8 hours ago',
          angle: 'analytical',
          stance:
            'Autonomous precision landing algorithms have decisively conquered hypersonic vehicle recovery.',
        },
      ],
      timeline: [
        {
          date: 'Oct 02, 11:30 UTC',
          event: 'Propellant loading of 4,500 tons subcooled liquid methane and oxygen completed',
          source: 'Launch Control Team',
          storyId: 'sty_liveblog_starship',
        },
        {
          date: 'Oct 02, 12:00 UTC',
          event: '33 Raptor 3 engines ignite for flawless liftoff from Starbase orbital pad',
          source: 'SpaceX Mission Control',
          storyId: 'sty_liveblog_starship',
        },
        {
          date: 'Oct 02, 12:02 UTC',
          event: 'Hot-staging ring separates cleanly as Starship upper stage continues to orbit',
          source: 'Orbital Telemetry Stream',
          storyId: 'sty_liveblog_starship',
        },
        {
          date: 'Oct 02, 12:08 UTC',
          event: 'Super Heavy booster caught out of mid-air by launch tower chopsticks',
          source: 'Flight Test Telemetry Stream',
          storyId: 'sty_liveblog_starship',
        },
        {
          date: 'Oct 02, 13:05 UTC',
          event: 'Starship completes atmospheric reentry blackout with heat shield intact',
          source: 'Starlink Video Relay',
          storyId: 'sty_liveblog_starship',
        },
        {
          date: 'Oct 02, 13:12 UTC',
          event: 'Starship executes flip maneuver and settles into secondary catch arms at Pad B',
          source: 'Starbase Recovery Operations',
          storyId: 'sty_liveblog_starship',
        },
      ],
      createdAt: '2026-10-02T11:30:00Z',
      updatedAt: '2026-10-02T13:30:00Z',
    },
  ];

  for (const cluster of clusters) {
    const existing = await db.clusters.getById(cluster.id, cluster.organizationId);
    if (!existing) {
      await db.clusters.create(cluster);
    } else {
      await db.clusters.update(cluster);
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
