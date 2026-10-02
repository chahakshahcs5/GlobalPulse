import type { WhatChangedBlock } from '@ai-news/schemas';

export class VisualDiffRenderer {
  /**
   * Generates accessible structured HTML for the WhatChangedBlock.
   */
  static renderHtml(data: WhatChangedBlock['data'], isDark = true): string {
    const bgClass = isDark
      ? 'border border-slate-700/80 dark:border-slate-800 bg-slate-900 text-slate-100'
      : 'border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900 text-slate-900 dark:text-slate-100';

    const headerBorder = isDark ? 'border-slate-800' : 'border-slate-200 dark:border-slate-800';
    const headerTitle = isDark ? 'text-slate-200' : 'text-slate-800 dark:text-slate-200';
    const headerSub = isDark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400';
    const itemBorder = isDark ? 'border-slate-800/60' : 'border-slate-200 dark:border-slate-800/60';
    const descClass = isDark ? 'text-slate-200' : 'text-slate-900 dark:text-slate-200';
    const sectionClass = isDark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400';
    const iconClass = isDark ? 'text-indigo-400' : 'text-indigo-600 dark:text-indigo-400';

    const badges: Record<string, { label: string; color: string; border: string }> = isDark
      ? {
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
        }
      : {
          added: {
            label: 'ADDED',
            color:
              'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-bold',
            border: 'border-emerald-300 dark:border-emerald-500/20',
          },
          updated: {
            label: 'UPDATED',
            color: 'bg-sky-100 dark:bg-sky-500/10 text-sky-800 dark:text-sky-400 font-bold',
            border: 'border-sky-300 dark:border-sky-500/20',
          },
          corrected: {
            label: 'CORRECTION',
            color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold',
            border: 'border-amber-300 dark:border-amber-500/20',
          },
          retracted: {
            label: 'RETRACTED',
            color: 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 font-bold',
            border: 'border-rose-300 dark:border-rose-500/20',
          },
        };

    const itemsHtml = data.items
      .map((item) => {
        const badge = badges[item.changeType] || badges.updated;
        return `
          <div class="flex items-start gap-3 py-2.5 border-b ${itemBorder} last:border-b-0">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${badge.color} border ${badge.border} shrink-0">
              ${badge.label}
            </span>
            <div class="flex-1 text-sm leading-relaxed">
              <span class="font-medium ${descClass}">${escapeXml(item.description)}</span>
              ${item.affectedSection ? `<span class="ml-2 text-xs ${sectionClass} font-mono">(${escapeXml(item.affectedSection)})</span>` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="rounded-xl p-4 ${bgClass} my-4 shadow-sm" role="region" aria-label="Version Updates">
        <div class="flex items-center justify-between pb-3 mb-2 border-b ${headerBorder}">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 ${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-sm font-bold uppercase tracking-wider ${headerTitle}">What Changed in this Revision</h3>
          </div>
          <span class="text-xs ${headerSub} font-mono">Updates vs Version ${data.previousVersionNumber}</span>
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
