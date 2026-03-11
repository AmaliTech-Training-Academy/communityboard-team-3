import { useEffect, useState } from 'react';

/**
 * Simple viewport hook to detect when we are on a small
 * screen (roughly matches the 393px mobile Figma width).
 *
 * We keep this intentionally lightweight and client-only.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const update = (): void => {
      setIsMobile(mediaQuery.matches);
    };

    update();

    mediaQuery.addEventListener('change', update);

    return () => {
      mediaQuery.removeEventListener('change', update);
    };
  }, []);

  return isMobile;
}
