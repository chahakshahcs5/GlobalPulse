'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { listAuditLogs } from '../../../lib/api-client';
import type { AuditLog } from '@ai-news/schemas';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const fetchLogs = useCallback(async () => {
    try {
      const data = await listAuditLogs({ limit: 100 });
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'ALL') return true;
    if (filterAction === 'MCP') return log.action.startsWith('mcp.');
    if (filterAction === 'WEB')
      return log.action.startsWith('web.') || log.action.startsWith('editorial.');
    if (filterAction === 'ERRORS') return log.status !== 'SUCCESS';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
            <Link href="/admin" className="hover:text-white transition">
              ← CMS Dashboard
            </Link>
            <span>/</span>
            <span>OBSERVABILITY</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Remote MCP Agent Audit Logs
          </h1>
          <p className="text-sm text-slate-400">
            Real-time auditable record of all tool invocations and actions executed by external AI
            agents and newsroom users.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Audit Stream Active
          </div>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchLogs();
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-slate-400 mr-2">Filter:</span>
        {(['ALL', 'MCP', 'WEB', 'ERRORS'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterAction(filter)}
            className={`px-3 py-1 rounded-md border font-semibold transition ${
              filterAction === filter
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {filter}
          </button>
        ))}
        <span className="ml-auto text-slate-500">
          Showing {filteredLogs.length} of {logs.length} logs
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {isLoading && logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono text-sm">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mr-3"></span>
            Querying audit trail from secure ledger...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono text-sm">
            <p className="text-slate-300 font-bold mb-1">No Audit Logs Recorded</p>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              {logs.length > 0
                ? 'No audit entries match the current filter selection.'
                : 'Tool invocations from MCP agents and administrative CMS actions will be streamed to this ledger in real-time.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-bold font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Client Agent</th>
                <th className="px-5 py-3">Action / Tool</th>
                <th className="px-5 py-3">Target Resource</th>
                <th className="px-5 py-3">Latency</th>
                <th className="px-5 py-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3.5 text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {log.clientType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-white">{log.action}</td>
                  <td className="px-5 py-3.5 text-slate-300">
                    {log.resourceType}
                    {log.resourceId ? ` (${log.resourceId})` : ''}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{log.durationMs ?? 0}ms</td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
