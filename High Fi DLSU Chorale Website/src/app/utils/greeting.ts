import { useState, useEffect } from 'react';

// Filipino time-of-day boundaries: umaga (morning) before 12nn, hapon
// (afternoon) 12nn-6pm, gabi (evening/night) after 6pm.
function computeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Magandang umaga';
  if (hour < 18) return 'Magandang hapon';
  return 'Magandang gabi';
}

// Ticks every minute so a page left open across a boundary (e.g. 11:59am
// to 12:00pm) updates on its own instead of only on next reload.
export function useGreeting(): string {
  const [greeting, setGreeting] = useState(computeGreeting);
  useEffect(() => {
    const id = setInterval(() => setGreeting(computeGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);
  return greeting;
}
