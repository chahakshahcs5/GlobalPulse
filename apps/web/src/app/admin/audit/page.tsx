'use client';

import Link from 'next/link';

interface AuditItem {
  id: string;
  client: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE' | 'FORBIDDEN';
  durationMs: number;
}

const SAMPLE_AUDIT_LOGS: AuditItem[] = [
  {
    id: 'aud_01',
    client: 'gemini_spark',
    action: 'mcp.publish_story',
    resource: 'sty_brics_2026',
    timestamp: '2026-09-26T14:45:00Z',
    status: 'SUCCESS',
    durationMs: 42,
  },
  {
    id: 'aud_02',
    client: 'gemini_spark',
    action: 'mcp.create_story_version',
    resource: 'sty_brics_2026 (v3)',
    timestamp: '2026-09-26T14:44:12Z',
    status: 'SUCCESS',
    durationMs: 65,
  },
  {
    id: 'aud_03',
    client: 'gemini_spark',
    action: 'mcp.attach_source',
    resource: 'src_reuters -> sty_brics_2026',
    timestamp: '2026-09-26T14:43:50Z',
    status: 'SUCCESS',
    durationMs: 18,
  },
  {
    id: 'aud_04',
    client: 'chatgpt',
    action: 'mcp.create_chart',
    resource: 'blk_chart_fab -> sty_semi_01',
    timestamp: '2026-09-26T12:00:00Z',
    status: 'SUCCESS',
    durationMs: 31,
  },
  {
    id: 'aud_05',
    client: 'chatgpt',
    action: 'mcp.create_story',
    resource: 'sty_semi_01 (v1)',
    timestamp: '2026-09-26T08:00:00Z',
    status: 'SUCCESS',
    durationMs: 58,
  },
  {
    id: 'aud_06',
    client: 'claude',
    action: 'mcp.search_stories',
    resource: 'query: "Nuclear Fusion Q-Factor"',
    timestamp: '2026-09-26T07:28:10Z',
    status: 'SUCCESS',
    durationMs: 12,
  },
  {
    id: 'aud_07',
    client: 'unauthorized_bot',
    action: 'mcp.publish_story',
    resource: 'sty_unauth_01',
    timestamp: '2026-09-26T06:12:00Z',
    status: 'FORBIDDEN',
    durationMs: 8,
  },
];

export default function AuditLogsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
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
            Real-time auditable record of all tool invocations executed by external AI agents.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Audit Stream Active
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-xs font-bold font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Client Agent</th>
              <th className="px-5 py-3">MCP Tool Invocated</th>
              <th className="px-5 py-3">Target Resource</th>
              <th className="px-5 py-3">Latency</th>
              <th className="px-5 py-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
            {SAMPLE_AUDIT_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/30 transition">
                <td className="px-5 py-3.5 text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </td>
                <td className="px-5 py-3.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {log.client}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-bold text-white">{log.action}</td>
                <td className="px-5 py-3.5 text-slate-300">{log.resource}</td>
                <td className="px-5 py-3.5 text-slate-400">{log.durationMs}ms</td>
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
      </div>
    </div>
  );
}
