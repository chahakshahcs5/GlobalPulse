'use client';

import React from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Keep the keyboard inside an open dialog, and give the focus back after.
 *
 * A dialog that can be tabbed straight out of is not a dialog as far as a
 * keyboard reader is concerned: they carry on typing into the page behind
 * it and never learn that a dialog was open at all. The trap cycles the
 * focus inside the dialog instead.
 *
 * When the dialog closes, the focus goes back to whatever had it, so the
 * reader lands back where they were rather than at the top of the page.
 *
 * Escape is deliberately left to the caller: each dialog has its own idea
 * of what Escape means, and some of them must not close while they are
 * saving.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean): React.RefObject<T | null> {
  const containerRef = React.useRef<T | null>(null);
  /** The element that had the focus before the dialog opened. */
  const restoreTo = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!active) return;

    restoreTo.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = (): HTMLElement[] => {
      const node = containerRef.current;
      if (!node) return [];
      return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        // A control that is not on screen cannot be tabbed to, and tabbing
        // to something invisible is its own kind of lost.
        (element) => element.offsetWidth > 0 || element.offsetHeight > 0
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const node = containerRef.current;
      const items = focusable();
      if (!node || items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      // Focus that has drifted outside the dialog — because the dialog was
      // opened from somewhere else, or because the page behind was clicked —
      // is pulled back to the first control.
      if (!current || !node.contains(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    /*
     * Move the focus into the dialog, so a keyboard reader starts inside it
     * rather than on the page behind. A control marked `data-autofocus` wins;
     * otherwise the first one is used.
     */
    const node = containerRef.current;
    if (node && !node.contains(document.activeElement)) {
      const preferred = node.querySelector<HTMLElement>('[data-autofocus]');
      (preferred ?? focusable()[0])?.focus();
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // The trigger may have gone with the dialog; focus() on a detached
      // element does nothing, which is the right outcome.
      restoreTo.current?.focus?.();
    };
  }, [active]);

  return containerRef;
}
