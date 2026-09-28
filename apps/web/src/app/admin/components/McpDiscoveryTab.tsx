'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  Layers,
  Terminal,
  RefreshCw,
  Search,
  Check,
} from 'lucide-react';

interface McpTool {
  name: string;
  domain: string;
  description: string;
  parameters: string[];
  latencyMs: number;
  callCount: number;
}

const MCP_TOOLS_CATALOG: McpTool[] = [
  {
    name: 'news_create_story',
    domain: 'Stories & Publishing',
    description: 'Generates and drafts a verified news dispatch with structured multimedia blocks',
    parameters: ['title', 'summary', 'articleType', 'blocks', 'clientName'],
    latencyMs: 142,
    callCount: 1248,
  },
  {
    name: 'news_publish_story',
    domain: 'Stories & Publishing',
    description: 'Promotes an editorial or autonomous story to live PUBLISHED status with idempotency keys',
    parameters: ['storyId', 'idempotencyKey'],
    latencyMs: 98,
    callCount: 890,
  },
  {
    name: 'collab_acquire_lock',
    domain: 'Editorial Collaboration',
    description: 'Acquires exclusive distributed Redis/Memory lease lock preventing concurrent edit collisions',
    parameters: ['storyId', 'userId', 'ttlSeconds'],
    latencyMs: 24,
    callCount: 420,
  },
  {
    name: 'factcheck_verify',
    domain: 'Integrity & Verification',
    description: 'Cross-references story claims against sovereign primary registries and official dispatches',
    parameters: ['storyId', 'claim', 'verdict', 'confidence'],
    latencyMs: 310,
    callCount: 654,
  },
  {
    name: 'provenance_record',
    domain: 'AI Governance & Provenance',
    description: 'Cryptographically watermarks story dispatches with HMAC-SHA256 model provenance tags',
    parameters: ['storyId', 'generatorModel', 'promptHash'],
    latencyMs: 45,
    callCount: 1120,
  },
  {
    name: 'webhook_dispatch',
    domain: 'Enterprise Webhooks',
    description: 'Dispatches real outbound HTTP webhooks with HMAC-SHA256 signature and retry logic',
    parameters: ['event', 'payload', 'organizationId'],
    latencyMs: 115,
    callCount: 312,
  },
  {
    name: 'mcp_batch_publish',
    domain: 'Batch Operations (F24)',
    description: 'Batch processes and promotes multiple story drafts simultaneously with transaction safety',
    parameters: ['storyIds', 'batchPriority'],
    latencyMs: 240,
    callCount: 84,
  },
  {
    name: 'ai_generate_summary',
    domain: 'AI Summaries (F25)',
    description: 'Generates executive TL;DR bullet points and 1-sentence synopsis from rich story blocks',
    parameters: ['storyId', 'maxWords', 'readingLevel'],
    latencyMs: 180,
    callCount: 780,
  },
  {
    name: 'editorial_validate_quality_gates',
    domain: 'Content Quality Gates (F26)',
    description: 'Evaluates pre-publish quality: readability index, minimum word length, and citation thresholds',
    parameters: ['storyId', 'strictMode'],
    latencyMs: 65,
    callCount: 540,
  },
];

interface AgentLog {
  id: string;
  agent: string;
  action: string;
  target: string;
  status: 'SUCCESS' | 'RUNNING' | 'VERIFIED';
  timestamp: string;
  tokens: number;
}

const INITIAL_AGENT_LOGS: AgentLog[] = [
  {
    id: 'log_1',
    agent: 'Gemini Spark Autonomous Agent',
    action: 'Dispatched Breaking News Article',
    target: 'sty_quantum_encryption_breakthrough',
    status: 'SUCCESS',
    timestamp: '2 mins ago',
    tokens: 3410,
  },
  {
    id: 'log_2',
    agent: 'Automated Fact-Check Bureau',
    action: 'Verified Government Central Bank Registry',
    target: 'Claim: Global Trade Settlement In Reserve Currencies',
    status: 'VERIFIED',
    timestamp: '6 mins ago',
    tokens: 1820,
  },
  {
    id: 'log_3',
    agent: 'ChatGPT Research Bureau',
    action: 'Generated Executive TL;DR Summary & Key Takeaways',
    target: 'sty_brics_economic_accord_2026',
    status: 'SUCCESS',
    timestamp: '14 mins ago',
    tokens: 2150,
  },
  {
    id: 'log_4',
    agent: 'MCP Batch Orchestrator',
    action: 'Batch Published 3 Syndicated Regional Wire Reports',
    target: 'Topics: Health, Science, Space Exploration',
    status: 'SUCCESS',
    timestamp: '22 mins ago',
    tokens: 5800,
  },
];

export function McpDiscoveryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [logs, setLogs] = useState<AgentLog[]>(INITIAL_AGENT_LOGS);
  const [qualityTestResult, setQualityTestResult] = useState<string | null>(null);

  const domains = ['ALL', ...Array.from(new Set(MCP_TOOLS_CATALOG.map((t) => t.domain)))];

  const filteredTools = MCP_TOOLS_CATALOG.filter((tool) => {
    const matchesDomain = selectedDomain === 'ALL' || tool.domain === selectedDomain;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const runQualityGateTest = () => {
    setQualityTestResult('Validating story against F26 Quality Gates: Readability Grade 9.2 (Pass) | Citations: 4 (Pass) | Length: 840 words (Pass) -> STATUS: APPROVED FOR PUBLICATION');
    setTimeout(() => setQualityTestResult(null), 7000);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Model Context Protocol (MCP) & Autonomous AI Hub</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  Live & Connected
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                19 Tool Domains, Dual-Engine DB, Cryptographic Provenance, and Autonomous AI Agents
              </p>
            </div>
          </div>

          <button
            onClick={runQualityGateTest}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Simulate F26 Quality Gate Check</span>
          </button>
        </div>

        {qualityTestResult && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{qualityTestResult}</span>
          </div>
        )}
      </div>

      {/* Grid: Tools Catalog (Left 7) & Live AI Activity Feed (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Registered MCP Tools Catalog (F21) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" /> Registered MCP Tools Catalog
              </h3>
              <p className="text-xs text-slate-500">
                Executable tools exposed to Claude, Gemini, ChatGPT, and external agents
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-44"
              />
            </div>
          </div>

          {/* Domain Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {domains.map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedDomain === dom
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>

          {/* Tools List */}
          <div className="space-y-3">
            {filteredTools.map((tool) => (
              <div
                key={tool.name}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2 hover:border-blue-500/40 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {tool.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {tool.domain}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>{tool.latencyMs}ms avg</span>
                    <span>•</span>
                    <span>{tool.callCount.toLocaleString()} calls</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">{tool.description}</p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Parameters:
                  </span>
                  {tool.parameters.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Agent Activity Feed (F23) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> AI Agent Live Activity Feed
            </h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Streaming
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> {log.agent}
                  </span>
                  <span className="text-[11px] text-slate-400">{log.timestamp}</span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {log.action}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="font-mono text-slate-400 truncate max-w-[200px]">
                    {log.target}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{log.tokens} tokens</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {log.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Editorial Calendar Info (F28) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>AI Autonomous Editorial Calendar (F28)</span>
            </div>
            <p className="text-xs text-slate-500">
              AI agents automatically manage embargo release windows and schedule daily digest dispatches via MCP tool scheduling endpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
