import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

export function useMobileTitleInteraction() {
  const [isTitleTapped, setIsTitleTapped] = useState(false);
  const [isTitleHolding, setIsTitleHolding] = useState(false);

  const holdTimerRef = useRef<number | null>(null);
  const holdDropTimerRef = useRef<number | null>(null);
  const tapResetTimerRef = useRef<number | null>(null);
  const holdReadyRef = useRef(false);
  const holdActivatedRef = useRef(false);
  const pointerDownRef = useRef(false);
  const pointerInsideRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
      if (holdDropTimerRef.current !== null) window.clearTimeout(holdDropTimerRef.current);
      if (tapResetTimerRef.current !== null) window.clearTimeout(tapResetTimerRef.current);
    };
  }, []);

  const triggerTapFeedback = () => {
    setIsTitleTapped(true);

    if (tapResetTimerRef.current !== null) {
      window.clearTimeout(tapResetTimerRef.current);
    }

    tapResetTimerRef.current = window.setTimeout(() => {
      setIsTitleTapped(false);
      tapResetTimerRef.current = null;
    }, 260);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const clearHoldDropTimer = () => {
    if (holdDropTimerRef.current !== null) {
      window.clearTimeout(holdDropTimerRef.current);
      holdDropTimerRef.current = null;
    }
  };

  const isPointerInsideTitle = (clientX: number, clientY: number) => {
    const titleNode = titleRef.current;
    if (!titleNode) return false;

    const rect = titleNode.getBoundingClientRect();
    const hitPadding = 14;

    return (
      clientX >= rect.left - hitPadding &&
      clientX <= rect.right + hitPadding &&
      clientY >= rect.top - hitPadding &&
      clientY <= rect.bottom + hitPadding
    );
  };

  const handleTitlePointerDown = (event: ReactPointerEvent<HTMLHeadingElement>) => {
    setIsTitleTapped(false);
    setIsTitleHolding(false);

    pointerDownRef.current = true;
    pointerInsideRef.current = true;
    activePointerIdRef.current = event.pointerId;
    holdReadyRef.current = false;
    holdActivatedRef.current = false;

    event.currentTarget.setPointerCapture(event.pointerId);
    clearHoldTimer();
    clearHoldDropTimer();

    holdTimerRef.current = window.setTimeout(() => {
      holdReadyRef.current = true;

      if (pointerDownRef.current && pointerInsideRef.current) {
        holdActivatedRef.current = true;
        setIsTitleHolding(true);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([16, 20, 16]);
        }
      }

      holdTimerRef.current = null;
    }, 280);
  };

  const handleTitlePointerMove = (event: ReactPointerEvent<HTMLHeadingElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const isInside = isPointerInsideTitle(event.clientX, event.clientY);
    pointerInsideRef.current = isInside;

    if (!isInside && holdReadyRef.current) {
      if (holdDropTimerRef.current === null) {
        holdDropTimerRef.current = window.setTimeout(() => {
          holdDropTimerRef.current = null;
          if (pointerDownRef.current && !pointerInsideRef.current) {
            setIsTitleHolding(false);
          }
        }, 70);
      }
      return;
    }

    clearHoldDropTimer();

    if (pointerDownRef.current && holdReadyRef.current) {
      holdActivatedRef.current = true;
      setIsTitleHolding(true);
    }
  };

  const clearTitleInteraction = (event: ReactPointerEvent<HTMLHeadingElement>) => {
    if (activePointerIdRef.current !== null && activePointerIdRef.current === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      activePointerIdRef.current = null;
    }

    const shouldTriggerTap = pointerDownRef.current && !holdActivatedRef.current;

    pointerDownRef.current = false;
    pointerInsideRef.current = false;
    holdReadyRef.current = false;
    holdActivatedRef.current = false;

    clearHoldTimer();
    clearHoldDropTimer();
    setIsTitleHolding(false);

    if (shouldTriggerTap) {
      triggerTapFeedback();
    }
  };

  const titleStyle = {
    '--title-hold-scale': isTitleHolding ? 1.14 : 1,
  } as CSSProperties;

  return {
    titleRef,
    titleStyle,
    isTitleTapped,
    isTitleHolding,
    handleTitlePointerDown,
    handleTitlePointerMove,
    clearTitleInteraction,
  };
}
