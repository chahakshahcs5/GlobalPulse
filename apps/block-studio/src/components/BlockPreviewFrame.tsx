'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';

/**
 * The studio's preview frame.
 *
 * A block is rendered inside a frame rather than inline, so that the block
 * sees a viewport of exactly the width the editor has chosen. Drawn inline,
 * a block's breakpoints answer to the studio's own window, so a "mobile"
 * preview would be laid out for a desktop and then squeezed — which tells
 * the editor nothing about how the block reads on a phone.
 *
 * The frame draws nothing itself: the preview page owns the card, so the
 * frame is exactly the width it claims to be.
 */

/** The frame is ready for a payload. */
const READY = 'globalpulse:preview:ready';
/** A payload, sent to the frame. */
const RENDER = 'globalpulse:preview:render';
/** The content's height, sent back by the frame. */
const RESIZE = 'globalpulse:preview:resize';

export interface BlockPreviewFrameProps {
  /** The block to draw. */
  block: StoryBlock;
  /** The theme the block is drawn in. */
  theme: 'dark' | 'light';
  /** The width of the viewport the block should believe it is in. */
  width: number;
  /** The accessible name of the frame. */
  label: string;
}

export function BlockPreviewFrame({ block, theme, width, label }: BlockPreviewFrameProps) {
  const frameRef = React.useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = React.useState(320);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only the frame this component created may talk to it.
      if (event.source !== frameRef.current?.contentWindow) return;

      const message = event.data as { type?: string; height?: number };
      if (message?.type === READY) {
        setReady(true);
        return;
      }
      if (message?.type === RESIZE && typeof message.height === 'number') {
        setHeight(Math.max(120, Math.ceil(message.height)));
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  /*
   * Push the payload whenever it changes, and once more when the frame says
   * it is ready — a frame that reloads starts out empty.
   */
  React.useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: RENDER, block, theme },
      window.location.origin
    );
  }, [ready, block, theme]);

  return (
    <iframe
      ref={frameRef}
      title={label}
      src="/preview"
      scrolling="no"
      style={{ width: `${width}px`, height: `${height}px` }}
      className="block border-0 bg-transparent"
    />
  );
}
