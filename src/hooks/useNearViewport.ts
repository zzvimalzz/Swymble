import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether an element has ever come within `rootMargin` of the viewport.
 * Once true, stays true — intended for gating expensive one-time mounts (e.g. a
 * heavy Three.js chunk) so they only load once the user is about to scroll to them.
 */
export function useNearViewport<T extends HTMLElement>(rootMargin = '600px') {
  const ref = useRef<T | null>(null);
  const [hasBeenNear, setHasBeenNear] = useState(false);

  useEffect(() => {
    if (hasBeenNear) return;

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setHasBeenNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenNear(true);
        }
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasBeenNear, rootMargin]);

  return { ref, hasBeenNear };
}
