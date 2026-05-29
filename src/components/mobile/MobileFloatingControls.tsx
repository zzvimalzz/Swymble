import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MutableRefObject } from 'react';
import { ChevronLeft, Rocket } from 'lucide-react';

type MobileFloatingControlsProps = {
  isNavigationOpen: boolean;
  menuTriggerRef: MutableRefObject<HTMLElement | null>;
  navigationSheetRef: MutableRefObject<HTMLElement | null>;
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
  showRocket?: boolean;
  onRocket?: () => void;
};

const FLOATING_BUTTON_SIZE = 57;
const FLOATING_BUTTON_GAP = 20;
const MIN_FLOATING_BOTTOM = 24;

function getBottomAboveElements(elements: Array<HTMLElement | null>) {
  const visibleRects = elements
    .filter((node): node is HTMLElement => Boolean(node))
    .map((node) => node.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  if (visibleRects.length === 0) {
    return null;
  }

  const highestTop = Math.min(...visibleRects.map((rect) => rect.top));
  return Math.max(MIN_FLOATING_BOTTOM, Math.round(window.innerHeight - highestTop + FLOATING_BUTTON_GAP));
}

export default function MobileFloatingControls({
  isNavigationOpen,
  menuTriggerRef,
  navigationSheetRef,
  showBack = false,
  backLabel = 'Go back',
  onBack,
  showRocket = false,
  onRocket,
}: MobileFloatingControlsProps) {
  const backButtonRef = useRef<HTMLButtonElement | null>(null);
  const [backBottom, setBackBottom] = useState<number | null>(null);
  const [rocketBottom, setRocketBottom] = useState<number | null>(null);

  useEffect(() => {
    if (!showBack && !showRocket) {
      setBackBottom(null);
      setRocketBottom(null);
      return;
    }

    let frameId: number | null = null;

    const updatePositions = () => {
      const baseElements = [menuTriggerRef.current];
      if (isNavigationOpen) {
        baseElements.push(navigationSheetRef.current);
      }

      const nextBackBottom = getBottomAboveElements(baseElements);
      setBackBottom(nextBackBottom);

      if (showBack && nextBackBottom !== null) {
        setRocketBottom(nextBackBottom + FLOATING_BUTTON_SIZE + FLOATING_BUTTON_GAP);
        return;
      }

      setRocketBottom(nextBackBottom);
    };

    const scheduleUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updatePositions();
      });
    };

    scheduleUpdate();
    const settleTimer = isNavigationOpen ? window.setTimeout(scheduleUpdate, 240) : null;
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
      }
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isNavigationOpen, menuTriggerRef, navigationSheetRef, showBack, showRocket]);

  return (
    <>
      {showBack && onBack && (
        <button
          ref={backButtonRef}
          type="button"
          className="mobile-route-back-trigger"
          aria-label={backLabel}
          onClick={onBack}
          style={
            backBottom !== null
              ? ({ '--mobile-route-back-bottom': `${backBottom}px` } as CSSProperties)
              : undefined
          }
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {showRocket && onRocket && (
        <button
          type="button"
          className="rocket-to-top mobile-route-rocket"
          aria-label="Scroll to top"
          onClick={onRocket}
          style={
            rocketBottom !== null
              ? ({ '--route-rocket-bottom': `${rocketBottom}px` } as CSSProperties)
              : undefined
          }
        >
          <Rocket size={28} style={{ transform: 'rotate(-45deg)' }} />
        </button>
      )}
    </>
  );
}
