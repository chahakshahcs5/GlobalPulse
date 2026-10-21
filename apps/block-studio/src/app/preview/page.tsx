'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import { BlockItem } from '@ai-news/blocks-ui';

/**
 * The preview surface, on a page of its own.
 *
 * The studio shows each block inside a frame rather than inline, because a
 * block's layout answers to the width of the window it is in. Drawn inline,
 * a "mobile" preview is laid out for the studio's own window and then
 * squeezed into a narrow column, which is not what a reader on a phone sees.
 * In a frame the block gets a viewport of exactly the chosen width, so its
 * own breakpoints fire the way they would on the device.
 *
 * The parent sends the payload over `postMessage`; this page sends its
 * height back, so the frame can be sized to the content instead of scrolling
 * inside a frame of a fixed height.
 */

/** The frame is ready for a payload. */
const READY = 'globalpulse:preview:ready';
/** A payload, sent by the parent. */
const RENDER = 'globalpulse:preview:render';
/** The content's height, sent by this page. */
const RESIZE = 'globalpulse:preview:resize';

export default function PreviewPage() {
  const [block, setBlock] = React.useState<StoryBlock | null>(null);
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only the studio that framed this page may talk to it.
      if (event.source !== window.parent) return;

      const message = event.data as {
        type?: string;
        block?: StoryBlock;
        theme?: 'dark' | 'light';
      };
      if (message?.type !== RENDER) return;

      if (message.block) setBlock(message.block);
      if (message.theme) setTheme(message.theme);
    };

    window.addEventListener('message', onMessage);
    // Tell the parent there is someone home.
    window.parent.postMessage({ type: READY }, window.location.origin);

    return () => window.removeEventListener('message', onMessage);
  }, []);

  /*
   * Report the height as the content changes, so the frame grows and shrinks
   * with the block instead of clipping it or leaving a gap.
   *
   * The card is measured rather than its contents, because the card carries
   * the border that the frame has to make room for.
   */
  React.useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const report = () => {
      window.parent.postMessage(
        { type: RESIZE, height: node.getBoundingClientRect().height },
        window.location.origin
      );
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [block, theme]);

  return (
    <div className={`preview-frame ${theme === 'dark' ? 'dark' : ''}`}>
      <div
        ref={cardRef}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="px-6 py-5">
          {block ? <BlockItem block={block} theme={theme} storyId="studio-preview" /> : null}
        </div>
      </div>
    </div>
  );
}
