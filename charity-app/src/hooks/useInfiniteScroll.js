import { useState, useEffect, useRef } from 'react';

/**
 * Simulated infinite scroll for the static prototype.
 *
 * Cycles `source` into an ever-growing list as a sentinel near the end of
 * the list scrolls into view. Because the phone-frame screens scroll inside
 * an inner container (not the window), pass that scroll element via
 * `rootRef`; it falls back to the viewport when omitted.
 *
 * Returns the visible `items` (each with a unique `_key`), a `sentinelRef`
 * to place at the bottom of the list, a `loading` flag, and `hasMore`.
 */
export default function useInfiniteScroll(source, { pageSize = 3, max = 24, rootRef } = {}) {
  const initial = Math.min(source.length, max);
  const [count, setCount] = useState(initial);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);
  const sourceSig = source.map((s) => s.id ?? s.key ?? '').join(',');

  useEffect(() => {
    setCount(Math.min(source.length, max));
    setLoading(false);
  }, [sourceSig, source.length, max]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || count >= max) return undefined;

    const root = rootRef && rootRef.current ? rootRef.current : null;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoading(true);
          // brief delay so the loader is visible, like a real fetch
          setTimeout(() => {
            setCount((c) => Math.min(c + pageSize, max));
            setLoading(false);
          }, 450);
        }
      },
      { root, rootMargin: '160px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count, max, pageSize, rootRef]);

  const items = [];
  if (source.length > 0) {
    for (let i = 0; i < count; i += 1) {
      const base = source[i % source.length];
      const baseId = base.id != null ? base.id : (base.key != null ? base.key : 'item');
      items.push({ ...base, _key: `${baseId}-${i}` });
    }
  }

  return { items, sentinelRef, loading, hasMore: source.length > 0 && count < max };
}
