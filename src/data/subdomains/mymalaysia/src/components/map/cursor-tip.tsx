"use client";

import { useCallback, useRef } from "react";

/**
 * A floating tooltip that follows the map cursor. Driven imperatively —
 * mousemove writes straight to the DOM node (same pattern as the vehicle
 * tween: keyframe-rate updates must not run through React's render cycle).
 * Render <div {...tip.props} /> inside the map container and call
 * tip.show / tip.hide from map event handlers.
 */
export interface CursorTip {
  show: (point: { x: number; y: number }, title: string, subtitle?: string) => void;
  hide: () => void;
  props: {
    ref: (node: HTMLDivElement | null) => void;
    className: string;
    "aria-hidden": true;
  };
}

export function useCursorTip(): CursorTip {
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const show = useCallback((point: { x: number; y: number }, title: string, subtitle?: string) => {
    const node = nodeRef.current;
    if (!node) return;
    // Two spans, styled once in the className below.
    node.firstElementChild!.textContent = title;
    const sub = node.lastElementChild as HTMLElement;
    sub.textContent = subtitle ?? "";
    sub.style.display = subtitle ? "block" : "none";
    node.style.transform = `translate(${point.x + 14}px, ${point.y + 14}px)`;
    node.style.opacity = "1";
  }, []);

  const hide = useCallback(() => {
    const node = nodeRef.current;
    if (node) node.style.opacity = "0";
  }, []);

  const ref = useCallback((node: HTMLDivElement | null) => {
    nodeRef.current = node;
    if (node && node.childElementCount === 0) {
      node.append(document.createElement("span"), document.createElement("span"));
      node.firstElementChild!.className = "block font-medium";
      node.lastElementChild!.className = "block text-muted-foreground";
    }
  }, []);

  return {
    show,
    hide,
    props: {
      ref,
      className:
        "pointer-events-none absolute top-0 left-0 z-20 max-w-56 rounded-md border border-border/60 bg-popover px-2.5 py-1.5 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity duration-75",
      "aria-hidden": true,
    },
  };
}
