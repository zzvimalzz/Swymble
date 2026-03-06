import { useMemo } from 'react';

const DESKTOP_QUERY = '(min-width: 1280px) and (hover: hover) and (pointer: fine)';

function isIpadLikeDevice(): boolean {
  const platform = navigator.platform || '';
  const ua = navigator.userAgent || '';

  // iPadOS can report itself as Macintosh; touch points disambiguate it.
  const pretendsMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isIpad = /iPad/i.test(ua);

  return pretendsMac || isIpad;
}

function getDesktopViewMatch(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }

  return window.matchMedia(DESKTOP_QUERY).matches && !isIpadLikeDevice();
}

export function useDeviceView(): boolean {
  const isDesktopView = useMemo(() => getDesktopViewMatch(), []);
  return isDesktopView;
}
