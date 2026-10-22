'use client';

import React from 'react';

/**
 * A frame that draws whatever the newsroom tells it to draw.
 *
 * The frame is sandboxed *without* `allow-same-origin`, which puts it on an
 * opaque origin: it cannot read the story it sits in, the reader's cookies
 * or their storage, and it cannot navigate the page away from under them. It
 * is given the block's own data and nothing else.
 *
 * The block's payload is code, so it is deliberately not run through the
 * text sanitiser — the frame's sandbox is the boundary. Only principals who
 * are allowed to publish code into a story should be able to save one.
 */

/** The message the frame sends when it wants to be a different height. */
const RESIZE_MESSAGE = 'globalpulse:resize';

/**
 * Embeds the block's data in the frame's own page.
 *
 * The JSON is written with `<` escaped, so a value that contains the end of
 * a script tag cannot break out of the one it is written into.
 */
function buildDocument(html: string, script: string | undefined, payload: unknown): string {
  const encoded = JSON.stringify(payload ?? {}).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light dark; }
  html, body { margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
</style>
</head>
<body>
${html}
<script>
  window.__blockData = ${encoded};
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'globalpulse:data') return;
    window.__blockData = event.data.payload;
    document.dispatchEvent(new CustomEvent('globalpulse:data', { detail: event.data.payload }));
  });
</script>
${script ?? ''}
</body>
</html>`;
}

export const SandboxBlockView: React.FC<{
  data: import('@ai-news/schemas').SandboxBlock['data'];
}> = ({ data }) => {
  const frameRef = React.useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = React.useState(data.height ?? 420);
  const [reloadKey, setReloadKey] = React.useState(0);

  const allowScripts = data.allowScripts ?? true;

  const document = React.useMemo(
    () => buildDocument(data.html, allowScripts ? data.script : undefined, data.data),
    [data.html, data.script, data.data, allowScripts]
  );

  // The frame is allowed to ask for a different height. Nothing else it says
  // is acted on, and only what comes from this frame is listened to.
  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow) return;
      if (!event.data || event.data.type !== RESIZE_MESSAGE) return;
      const requested = Number(event.data.height);
      if (!Number.isFinite(requested)) return;
      setHeight(Math.min(2000, Math.max(80, Math.round(requested))));
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <section
      aria-label={data.title ?? 'Custom visual'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      {(data.title || data.accessibilityText) && (
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            {data.title && (
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
            )}
            {data.accessibilityText && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{data.accessibilityText}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Run again
          </button>
        </header>
      )}

      <div className="p-3 sm:p-4">
        <iframe
          key={reloadKey}
          ref={frameRef}
          title={data.title ?? 'Custom visual'}
          srcDoc={document}
          sandbox={allowScripts ? 'allow-scripts' : undefined}
          style={{ height: `${height}px`, width: '100%' }}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
        />
      </div>

      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <p>
          This visual runs in a sandboxed frame. It cannot read the page, the reader&rsquo;s cookies
          or their storage.
        </p>
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
      </footer>
    </section>
  );
};
