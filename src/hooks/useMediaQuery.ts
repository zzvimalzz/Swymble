import { useEffect, useState } from 'react';

/**
 * Subscribes to a media query. For the cases where a breakpoint has to change the *markup*, not
 * just the styling — a CSS-only version of a list that turns into an accordion would have to ship
 * both trees and hide one, which leaves the hidden copy's buttons in the tab order.
 */
export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Re-read on mount as well: the query can have changed between the initial state and the
    // effect running (a rotation during hydration, say).
    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);

    return () => mediaQuery.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
