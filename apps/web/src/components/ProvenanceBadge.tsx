'use client';

import React from 'react';

interface ProvenanceBadgeProps {
  clientType: string;
  createdVia: string;
  versionNumber: number;
  sourceCount: number;
  publishedAt?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  clientType,
  createdVia,
  versionNumber,
  sourceCount,
  publishedAt,
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
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
        📚 {sourceCount} {sourceCount === 1 ? 'Source' : 'Sources'} Cited
      </span>

      {/* Published Date */}
      {publishedAt && (
        <span className="text-slate-400 font-mono ml-auto">
          {new Date(publishedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  );
};
