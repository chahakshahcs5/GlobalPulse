'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { formatDeterministicDateTime } from '../lib/date-utils';

interface ProvenanceBadgeProps {
  clientType: string;
  createdVia: string;
  versionNumber: number;
  sourceCount: number;
  publishedAt?: string;
  onViewSources?: () => void;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  clientType,
  createdVia,
  versionNumber,
  sourceCount,
  publishedAt,
  onViewSources,
}) => {
  const clientConfig: Record<string, { label: string; icon: string; badgeClass: string }> = {
    gemini_spark: {
      label: 'Gemini Spark via MCP',
      icon: '✨',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    gemini: {
      label: 'Google Gemini via MCP',
      icon: '✨',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    chatgpt: {
      label: 'ChatGPT Agent via MCP',
      icon: '🤖',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    claude: {
      label: 'Claude via MCP',
      icon: '⚡',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    human_web: {
      label: 'Human Editorial Staff',
      icon: '✍️',
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  };

  const client = clientConfig[clientType] || {
    label: `${clientType} via ${createdVia}`,
    icon: '⚙️',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 my-3 text-xs">
      {/* Client Provenance */}
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${client.badgeClass}`}
      >
        <span>{client.icon}</span>
        <span>{client.label}</span>
      </span>

      {/* Version Tag */}
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
        Version {versionNumber}
      </span>

      {/* Sources Cited */}
      {onViewSources ? (
        <button
          onClick={onViewSources}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 hover:border-slate-500 shadow-xs transition-all cursor-pointer group active:scale-95"
          title="Click to view all primary sources cited in this report"
        >
          <span className="group-hover:scale-110 transition-transform">📚</span>
          <span className="font-semibold underline decoration-dotted decoration-slate-400 group-hover:decoration-white underline-offset-2">
            {sourceCount} {sourceCount === 1 ? 'Source' : 'Sources'} Cited
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-colors ml-0.5" />
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
          📚 {sourceCount} {sourceCount === 1 ? 'Source' : 'Sources'} Cited
        </span>
      )}

      {/* Published Date */}
      {publishedAt && (
        <span className="text-slate-400 font-mono ml-auto" suppressHydrationWarning>
          {formatDeterministicDateTime(publishedAt)}
        </span>
      )}
    </div>
  );
};
