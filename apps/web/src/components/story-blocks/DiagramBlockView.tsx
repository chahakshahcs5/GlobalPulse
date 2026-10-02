'use client';

import React from 'react';
import { Network, Code2, Copy, Check } from 'lucide-react';
import type { DiagramBlock } from '@ai-news/schemas';
import { DiagramRenderer } from '@ai-news/media';

export const DiagramBlockView: React.FC<{
  data: DiagramBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'dark' }) => {
  const [svgHtml, setSvgHtml] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'diagram' | 'code'>('diagram');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setRenderError(null);

    async function renderMermaid() {
      if (typeof window === 'undefined') return;

      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default || mermaidModule;

        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
          },
        });

        const uniqueId = `mermaid_${Math.random().toString(36).substring(2, 9)}`;
        const definition = data.definition || 'graph LR\nA-->B';
        const { svg } = await mermaid.render(uniqueId, definition);

        if (isMounted) {
          setSvgHtml(svg);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to render Mermaid diagram:', err);
          setRenderError(err instanceof Error ? err.message : String(err));
          setIsLoading(false);
        }
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [data.definition, theme]);

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(data.definition || '').then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <figure className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {data.title || 'Architecture & Flow Diagram'}
            </h4>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {data.format || 'Mermaid Graph'}
            </span>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('diagram')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'diagram'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Visual Graph
          </button>
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'code'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Syntax
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/30 overflow-x-auto min-h-[180px] flex items-center justify-center">
        {viewMode === 'diagram' ? (
          isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-mono">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              Compiling architecture diagram...
            </div>
          ) : renderError ? (
            <div className="py-4 text-center w-full">
              <div
                className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto transition-all mb-3"
                dangerouslySetInnerHTML={{
                  __html: DiagramRenderer.renderDeclarativeSvg(data, 800, 320, theme),
                }}
              />
              <p className="text-[11px] font-mono text-slate-400">
                Notice: Displaying declarative fallback diagram
              </p>
            </div>
          ) : (
            <div
              className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto transition-all"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          )
        ) : (
          <div className="w-full relative">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Mermaid Definition
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 text-xs rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {data.definition}
            </pre>
          </div>
        )}
      </div>

      {/* Caption footer */}
      {data.caption && (
        <figcaption className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 italic flex items-center gap-2">
          <span>{data.caption}</span>
        </figcaption>
      )}
    </figure>
  );
};
