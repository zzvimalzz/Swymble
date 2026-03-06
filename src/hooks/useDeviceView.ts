import { useEffect, useState } from 'react';

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
  const [isDesktopView, setIsDesktopView] = useState<boolean>(() => getDesktopViewMatch());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(DESKTOP_QUERY);

    const updateView = () => {
      setIsDesktopView(mediaQuery.matches && !isIpadLikeDevice());
    };

    updateView();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateView);
    } else {
      mediaQuery.addListener(updateView);
    }

    // Keep view mode in sync across resize/orientation changes.
    window.addEventListener('resize', updateView);
    window.addEventListener('orientationchange', updateView);

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', updateView);
      } else {
        mediaQuery.removeListener(updateView);
      }

      window.removeEventListener('resize', updateView);
      window.removeEventListener('orientationchange', updateView);
    };
  }, []);

  return isDesktopView;
}
