'use client';

import React, { useState } from 'react';
import { Check, Copy, Code, FileText, Globe, X } from 'lucide-react';
import type { StoryBlock } from '@ai-news/schemas';
import type { StudioTheme } from './StudioShell';
import { useFocusTrap } from './useFocusTrap';

export interface ExportCodeDialogProps {
  block: StoryBlock;
  theme: StudioTheme;
  variantId?: string;
  darkClass: string;
  onClose: () => void;
}

type TabType = 'react' | 'iframe' | 'jsonld';

export function ExportCodeDialog({
  block,
  theme,
  variantId,
  darkClass,
  onClose,
}: ExportCodeDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('react');
  const [copied, setCopied] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(true);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const reactSnippet = `import { BlockItem } from '@ai-news/blocks-ui';

export function NewsArticleBlock() {
  return (
    <BlockItem
      block={${JSON.stringify(block, null, 2)}}
      theme="${theme}"
      storyId="news-article"
    />
  );
}`;

  const iframeSnippet = `<iframe
  src="/preview?type=${encodeURIComponent(block.blockType)}${variantId ? `&variant=${encodeURIComponent(variantId)}` : ''}"
  title="${block.blockType} preview"
  width="100%"
  height="500"
  style={{ border: 'none', borderRadius: '12px', overflow: 'hidden' }}
  loading="lazy"
/>`;

  const jsonLdSnippet = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: 'GlobalPulse Newsroom',
      publishingPrinciples: 'https://globalpulse.news/standards',
      hasPart: {
        '@type': 'CreativeWork',
        name: `${block.blockType} Block`,
        encodingFormat: 'application/json',
        educationalUse: 'News Reporting',
        keywords: [block.blockType, variantId ?? 'default'],
        contentRating: 'General',
      },
    },
    null,
    2
  );

  const currentSnippet =
    activeTab === 'react' ? reactSnippet : activeTab === 'iframe' ? iframeSnippet : jsonLdSnippet;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API unavailable
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        className={`w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-[#0f1424] ${darkClass}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Code className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="export-dialog-title"
                className="text-sm font-bold text-slate-900 dark:text-white"
              >
                Export &amp; Embed Code
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready-to-use snippets for newsroom apps, articles, and embeds
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 px-6 dark:border-slate-800 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab('react')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'react'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            React Component
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('iframe')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'iframe'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Iframe Embed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jsonld')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'jsonld'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Schema.org JSON-LD
          </button>
        </div>

        <div className="relative p-6">
          <pre className="max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100 shadow-inner dark:border-slate-800">
            <code>{currentSnippet}</code>
          </pre>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'react' && 'Direct import from @ai-news/blocks-ui'}
              {activeTab === 'iframe' && 'Embeddable in any CMS or external site'}
              {activeTab === 'jsonld' && 'Structured schema metadata for search engines'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-95"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Snippet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
