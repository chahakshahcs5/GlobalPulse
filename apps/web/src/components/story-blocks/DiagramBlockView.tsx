'use client';

import React from 'react';
import {
  Network,
  Code2,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  AlertCircle,
} from 'lucide-react';
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
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedSvg, setCopiedSvg] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Safely extract and clean definition from various possible formats
  const rawDef =
    data.definition ||
    (data as unknown as Record<string, string>)?.mermaid ||
    (data as unknown as Record<string, string>)?.code ||
    '';
  const cleanDef = React.useMemo(() => {
    return (
      DiagramRenderer.cleanMermaidDefinition(rawDef) ||
      'flowchart LR\n  A[System Ingestion] --> B[Processing Engine]\n  B --> C[Verified Output]'
    );
  }, [rawDef]);

  const detectedType = React.useMemo(() => {
    return DiagramRenderer.detectDiagramType(cleanDef);
  }, [cleanDef]);

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setRenderError(null);

    async function renderMermaid() {
      if (typeof window === 'undefined') return;

      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default || mermaidModule;

        // Comprehensive universal configuration supporting all Mermaid grammar types
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: 14,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
            padding: 14,
            nodeSpacing: 45,
            rankSpacing: 45,
          },
          sequence: {
            useMaxWidth: true,
            showSequenceNumbers: true,
            actorMargin: 50,
            messageMargin: 35,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
          },
          gantt: {
            useMaxWidth: true,
            fontSize: 13,
            barHeight: 24,
            barGap: 4,
            topPadding: 50,
          },
          journey: {
            useMaxWidth: true,
          },
          class: {
            useMaxWidth: true,
          },
          state: {
            useMaxWidth: true,
          },
          er: {
            useMaxWidth: true,
            fontSize: 13,
          },
          pie: {
            useMaxWidth: true,
          },
          quadrantChart: {
            useMaxWidth: true,
          },
          gitGraph: {
            useMaxWidth: true,
          },
          mindmap: {
            useMaxWidth: true,
          },
          timeline: {
            useMaxWidth: true,
          },
          themeVariables:
            theme === 'dark'
              ? {
                  darkMode: true,
                  background: '#0f172a',
                  primaryColor: '#1e293b',
                  primaryTextColor: '#f8fafc',
                  primaryBorderColor: '#3b82f6',
                  lineColor: '#64748b',
                  secondaryColor: '#334155',
                  tertiaryColor: '#1e293b',
                  fontSize: '14px',
                }
              : {
                  darkMode: false,
                  background: '#ffffff',
                  primaryColor: '#eef2ff',
                  primaryTextColor: '#1e293b',
                  primaryBorderColor: '#6366f1',
                  lineColor: '#94a3b8',
                  secondaryColor: '#f1f5f9',
                  tertiaryColor: '#f8fafc',
                  fontSize: '14px',
                },
        });

        const uniqueId = `mermaid_${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, cleanDef);

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
  }, [cleanDef, theme]);

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cleanDef).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      });
    }
  };

  const handleCopySvg = () => {
    if (!svgHtml) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(svgHtml).then(() => {
        setCopiedSvg(true);
        setTimeout(() => setCopiedSvg(false), 2000);
      });
    }
  };

  const handleDownloadSvg = () => {
    if (!svgHtml || typeof window === 'undefined') return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(data.title || 'diagram').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Close modal on Escape
  React.useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded]);

  const diagramContent = (
    <div
      data-diagram-container="true"
      className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40 overflow-x-auto min-h-[220px] flex items-center justify-center transition-all"
    >
      {viewMode === 'diagram' ? (
        isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-mono">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            Compiling {detectedType.toLowerCase()} diagram...
          </div>
        ) : renderError ? (
          <div className="py-6 px-4 text-center w-full max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>Diagram Rendering Notice</span>
            </div>
            <div
              className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto transition-all mb-4"
              dangerouslySetInnerHTML={{
                __html: DiagramRenderer.renderDeclarativeSvg(data, 800, 320, theme),
              }}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Displaying declarative visual representation.
            </p>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <Code2 className="w-3.5 h-3.5" />
              Inspect diagram definition syntax
            </button>
          </div>
        ) : (
          <div
            className="w-full flex justify-center transition-transform duration-150 ease-out origin-top"
            style={{ transform: `scale(${zoom})` }}
          >
            <div
              className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:overflow-visible"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        )
      ) : (
        <div className="w-full relative max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>{detectedType} Syntax</span>
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 selection:bg-indigo-900/60 shadow-inner">
            {cleanDef}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <>
      <figure
        data-diagram-container="true"
        className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md"
      >
        {/* Header Toolbar */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {data.title || 'Architecture & Flow Diagram'}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {detectedType}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mermaid Engine
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons & mode toggle */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Zoom Controls (Active in visual diagram view) */}
            {viewMode === 'diagram' && !renderError && !isLoading && (
              <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  className="px-1.5 py-0.5 text-[11px] font-mono rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Quick Export Tools */}
            {viewMode === 'diagram' && svgHtml && !renderError && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopySvg}
                  title="Copy SVG"
                  className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  {copiedSvg ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  title="Download SVG"
                  className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Expand / Fullscreen button */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              title="Expand Diagram"
              className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* View Mode Switcher */}
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
        </div>

        {/* Content Area */}
        {diagramContent}

        {/* Caption footer */}
        {data.caption && (
          <figcaption className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 italic flex items-center gap-2">
            <span>{data.caption}</span>
          </figcaption>
        )}
      </figure>

      {/* Expanded Modal Overlay for Deep Diagram Inspection */}
      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {data.title || 'Architecture & Flow Diagram'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                      {detectedType}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Interactive Inspection Mode
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Reset Zoom"
                    className="px-2 py-0.5 text-xs font-mono rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  title="Download SVG"
                  className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  title="Exit Fullscreen"
                  className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer ml-2"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-slate-50/30 dark:bg-slate-950/60">
              <div
                className="w-full flex justify-center transition-transform duration-150 ease-out origin-center"
                style={{ transform: `scale(${zoom})` }}
              >
                <div
                  className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:overflow-visible"
                  dangerouslySetInnerHTML={{ __html: svgHtml }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            {data.caption && (
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic">
                {data.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
