import { useState, useEffect } from 'react';

// Was copy-pasted identically into 16 different screen/component files —
// extracted here so there's one resize listener implementation (and, more
// importantly, one place to fix if it's ever wrong) instead of 16.
export function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}
