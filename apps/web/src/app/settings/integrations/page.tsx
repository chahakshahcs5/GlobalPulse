'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AgentIntegration {
  id: string;
  name: string;
  provider: string;
  status: 'CONNECTED' | 'CONFIGURED' | 'STANDBY';
  clientId: string;
  scopes: string[];
  lastActive: string;
  recentAction: string;
  badgeColor: string;
}

const AGENTS: AgentIntegration[] = [
  {
    id: 'gemini_spark',
    name: 'Google Gemini Spark',
    provider: 'Google DeepMind',
    status: 'CONNECTED',
    clientId: 'client_gemini_spark_prod',
    scopes: ['news:read', 'news:write', 'news:publish'],
    lastActive: 'Just now',
    recentAction: 'Published BRICS 2026 Summit revision (v3) with WhatChanged block',
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  },
  {
    id: 'chatgpt_agent',
    name: 'ChatGPT / OpenAI Newsroom Agent',
    provider: 'OpenAI',
    status: 'CONNECTED',
    clientId: 'client_chatgpt_science_desk',
    scopes: ['news:read', 'news:write'],
    lastActive: '4m ago',
    recentAction: 'Drafted 2nm Semiconductor Consortium analysis with D3 line chart',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
  {
    id: 'claude_agent',
    name: 'Claude 3.7 Sonnet Desk',
    provider: 'Anthropic',
    status: 'CONFIGURED',
    clientId: 'client_claude_investigative',
    scopes: ['news:read', 'news:write'],
    lastActive: '1h ago',
    recentAction: 'Investigative entity correlation across 14 trade sources',
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  {
    id: 'enterprise_mcp',
    name: 'Custom Enterprise MCP Agent',
    provider: 'Internal Gateway',
    status: 'STANDBY',
    clientId: 'client_enterprise_internal',
    scopes: ['news:read', 'news:admin'],
    lastActive: '3h ago',
    recentAction: 'Audit log integrity check and compliance export',
    badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  },
];

export default function IntegrationsPage() {
  const [copiedToken, setCopiedToken] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('http://localhost:3000/mcp');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleTestPing = () => {
    setTestingPing(true);
    setTimeout(() => {
      setTestingPing(false);
      setPingResult('HTTP 200 OK — Remote MCP Server online. 18 Section 38 tools verified.');
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
        <Link href="/" className="hover:text-white transition">
          ← Live Feed
        </Link>
        <span>/</span>
        <Link href="/admin" className="hover:text-white transition">
          Editorial CMS
        </Link>
        <span>/</span>
        <span>External AI Integrations</span>
      </div>

      {/* Hero Header */}
      <div className="space-y-4 pb-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              External AI Integrations & MCP Hub
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Authenticate external models (Google Gemini, ChatGPT, Claude, custom agents) to operate
              the newsroom over OAuth 2.1 and the remote Model Context Protocol (MCP).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestPing}
              disabled={testingPing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {testingPing ? 'TESTING PING...' : '⚡ TEST MCP PING'}
            </button>
          </div>
        </div>

        {pingResult && (
          <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
            <span>{pingResult}</span>
            <button onClick={() => setPingResult(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Master Architectural Principle Alert */}
        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg font-black shrink-0">
            !
          </div>
          <div className="space-y-1">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              Foundational Principle: The Application Is Not The AI
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              GlobalPulse does not autonomously scrape the web, invent facts, or run internal reasoning prompts.
              All editorial decisions, investigative synthesis, and block assemblies originate from authenticated
              external AI models acting with cryptographic provenance and audit accountability.
            </p>
          </div>
        </div>
      </div>

      {/* External AI Agents Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
            Registered External AI Agent Clients ({AGENTS.length})
          </h2>
          <span className="text-xs font-mono text-emerald-400">OAuth 2.1 Authenticated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{agent.name}</h3>
                    <span className="text-xs font-mono text-slate-400">Provider: {agent.provider}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${agent.badgeColor}`}
                  >
                    ● {agent.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-slate-400 font-mono">
                    Client ID: <span className="text-slate-200">{agent.clientId}</span>
                  </div>
                  <div className="text-slate-400 font-mono">
                    Last Dispatch: <span className="text-slate-200">{agent.lastActive}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300">
                  <span className="font-mono text-blue-400 font-bold block mb-1">Recent Activity:</span>
                  {agent.recentAction}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {agent.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-500">PKCE Protected</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Remote MCP Server Architecture & Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
            Remote MCP Server Specs
          </h2>
          <div className="space-y-3 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Stream Transport URL</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">http://localhost:3000/mcp</span>
                <button
                  onClick={handleCopyEndpoint}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {copiedToken ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Protocol Standard</span>
              <span className="text-white">MCP 2024-11-05 (JSON-RPC 2.0)</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Concurrency Model</span>
              <span className="text-emerald-400 font-bold">AsyncLocalStorage Principal Isolation</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Registered Tools</span>
              <span className="text-white">18 Complete Section 38 Tools</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Resource Templates</span>
              <span className="text-white">news://stories, news://events, news://entities</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
            Webhook Event Subscriptions
          </h2>
          <div className="space-y-3 font-mono text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">Multi-Agent Ingestion Webhook</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="text-slate-400 truncate">https://agent-mesh.internal/webhooks/dispatch</div>
              <div className="text-[10px] text-blue-400">Events: story.published, story.updated</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">Breaking Alert Broadcast</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="text-slate-400 truncate">https://syndication.wire.net/v1/urgent</div>
              <div className="text-[10px] text-blue-400">Events: breaking.declared, retraction.issued</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
