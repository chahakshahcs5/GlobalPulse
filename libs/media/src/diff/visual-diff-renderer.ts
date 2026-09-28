import type { WhatChangedBlock } from '@ai-news/schemas';

export class VisualDiffRenderer {
  /**
   * Generates accessible structured HTML for the WhatChangedBlock.
   */
  static renderHtml(data: WhatChangedBlock['data'], isDark = true): string {
    const bgClass = isDark
      ? 'bg-slate-900 border-slate-800 text-slate-100'
      : 'bg-slate-50 border-slate-200 text-slate-900';

    const badges: Record<string, { label: string; color: string; border: string }> = {
      added: {
        label: 'ADDED',
        color: 'bg-emerald-500/10 text-emerald-400',
        border: 'border-emerald-500/20',
      },
      updated: {
        label: 'UPDATED',
        color: 'bg-sky-500/10 text-sky-400',
        border: 'border-sky-500/20',
      },
      corrected: {
        label: 'CORRECTION',
        color: 'bg-amber-500/10 text-amber-400',
        border: 'border-amber-500/20',
      },
      retracted: {
        label: 'RETRACTED',
        color: 'bg-rose-500/10 text-rose-400',
        border: 'border-rose-500/20',
      },
    };

    const itemsHtml = data.items
      .map((item) => {
        const badge = badges[item.changeType] || badges.updated;
        return `
          <div class="flex items-start gap-3 py-2 border-b border-slate-800/50 last:border-b-0">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${badge.color} border ${badge.border}">
              ${badge.label}
            </span>
            <div class="flex-1 text-sm">
              <span class="font-medium text-slate-200">${escapeXml(item.description)}</span>
              ${item.affectedSection ? `<span class="ml-2 text-xs text-slate-400 font-mono">(${escapeXml(item.affectedSection)})</span>` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="rounded-xl border p-4 ${bgClass} my-4 shadow-sm" role="region" aria-label="Version Updates">
        <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300">What Changed in this Revision</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono">Updates vs Version ${data.previousVersionNumber}</span>
        </div>
        <div class="space-y-1">
          ${itemsHtml}
        </div>
      </div>
    `;
  }
}

function escapeXml(unsafe?: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
