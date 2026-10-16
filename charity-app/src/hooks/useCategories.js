import { useEffect, useMemo, useState } from 'react';
import { listCategories } from '../api/meta';
import { registerCategories } from '../data/categoryIcons';

// The taxonomy changes rarely: fetch once per page load and share it.
let cache = null;
let inflight = null;

function load() {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = listCategories()
      .then((rows) => {
        cache = Array.isArray(rows) ? rows : [];
        registerCategories(cache);
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Cause categories from the API.
 * `names` replaces the old hard-coded browse list; `npFilters` adds the leading "All".
 */
export default function useCategories() {
  const [categories, setCategories] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return undefined;
    let cancelled = false;
    load()
      .then((rows) => {
        if (!cancelled) setCategories(rows);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Memoised so effects that depend on `names` don't re-run every render.
  const names = useMemo(() => categories.map((c) => c.name), [categories]);
  const npFilters = useMemo(() => ['All', ...names], [names]);
  return { categories, names, npFilters, loading };
}
