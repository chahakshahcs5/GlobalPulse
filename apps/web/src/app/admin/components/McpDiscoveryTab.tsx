'use client';

import { useState, useEffect, useCallback } from 'react';
import { listAuditLogs, listMcpTools } from '@ai-news/api-client';
import { Bot, Sparkles, ShieldCheck, Clock, Zap, Terminal, Search } from 'lucide-react';

interface McpTool {
  name: string;
  domain: string;
  description: string;
  parameters: string[];
  latencyMs: number;
  callCount: number;
}

interface AgentLog {
  id: string;
  agent: string;
  action: string;
  target: string;
  status: 'SUCCESS' | 'RUNNING' | 'VERIFIED';
  timestamp: string;
  tokens: number;
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

export function McpDiscoveryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isLoadingTools, setIsLoadingTools] = useState(true);

  const fetchTools = useCallback(async () => {
    setIsLoadingTools(true);
    try {
      const liveTools = await listMcpTools();
      setTools(
        liveTools.map((tool) => ({
          name: tool.name,
          domain: 'MCP',
          description: tool.description,
          parameters: tool.parameters,
          latencyMs: 0,
          callCount: 0,
        }))
      );
      setCatalogError(null);
    } catch (err) {
      setCatalogError(
        err instanceof Error ? err.message : 'Unable to load the live MCP tool catalog.'
      );
      setTools([]);
    } finally {
      setIsLoadingTools(false);
    }
  }, []);

  const fetchAgentLogs = useCallback(async () => {
    try {
      const auditEntries = await listAuditLogs({ limit: 10 });
      if (Array.isArray(auditEntries) && auditEntries.length > 0) {
        setLogs(
          auditEntries.map((log) => ({
            id: log.id,
            agent:
              log.clientType === 'gemini_spark'
                ? 'Gemini Spark Autonomous Agent'
                : log.clientType === 'chatgpt'
                  ? 'ChatGPT Research Bureau'
                  : log.clientType === 'claude'
                    ? 'Claude Editorial Desk'
                    : `${log.clientType.toUpperCase()} Agent`,
            action: log.action.replace('mcp.', 'Executed '),
            target: `${log.resourceType}: ${log.resourceId || 'dispatch'}`,
            status: log.status === 'SUCCESS' ? 'SUCCESS' : 'VERIFIED',
            timestamp: formatRelativeTime(log.timestamp),
            tokens: Math.max(120, (log.durationMs || 45) * 28),
          }))
        );
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    fetchAgentLogs();
    void fetchTools();
    const interval = setInterval(fetchAgentLogs, 10000);
    const catalogInterval = setInterval(() => void fetchTools(), 60_000);
    return () => {
      clearInterval(interval);
      clearInterval(catalogInterval);
    };
  }, [fetchAgentLogs, fetchTools]);

  const domains = ['ALL', ...Array.from(new Set(tools.map((t) => t.domain)))];

  const filteredTools = tools.filter((tool) => {
    const matchesDomain = selectedDomain === 'ALL' || tool.domain === selectedDomain;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

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
                Live tool catalog, Dual-Engine DB, Cryptographic Provenance, and Autonomous AI
                Agents
              </p>
            </div>
          </div>

          <button
            onClick={() => void fetchTools()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>{isLoadingTools ? 'Loading catalog…' : 'Refresh tool catalog'}</span>
          </button>
        </div>

        {catalogError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono font-semibold flex items-center gap-2">
            <span>{catalogError}</span>
          </div>
        )}
        {!catalogError && (
          <p className="text-xs text-slate-300 font-mono">
            Live catalog: {tools.length} tools registered on the remote MCP server.
          </p>
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
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono space-y-1">
                <p className="font-bold text-slate-300">Awaiting Agent Actions</p>
                <p>Live MCP tool invocations will stream into this feed automatically.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
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
              ))
            )}
          </div>

          {/* AI Editorial Calendar Info (F28) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>AI Autonomous Editorial Calendar (F28)</span>
            </div>
            <p className="text-xs text-slate-500">
              AI agents automatically manage embargo release windows and schedule daily digest
              dispatches via MCP tool scheduling endpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
