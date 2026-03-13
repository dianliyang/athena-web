"use client";

import { useCallback, useEffect, useState } from "react";

type CacheEntry<T> = {
  cachedAt: number;
  data: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function resetCachedJsonResourceCache() {
  memoryCache.clear();
}

function readCache<T>(cacheKey: string, ttlMs: number): CacheEntry<T> | null {
  const now = Date.now();
  const memoryEntry = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;
  if (memoryEntry && now - memoryEntry.cachedAt <= ttlMs) {
    return memoryEntry;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.cachedAt !== "number") return null;
    if (now - parsed.cachedAt > ttlMs) return null;
    memoryCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCache<T>(cacheKey: string, data: T) {
  const entry: CacheEntry<T> = { cachedAt: Date.now(), data };
  memoryCache.set(cacheKey, entry);

  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // Ignore storage failures.
  }
}

export function useCachedJsonResource<T>({
  cacheKey,
  url,
  ttlMs,
  init,
}: {
  cacheKey: string;
  url: string;
  ttlMs: number;
  init?: RequestInit;
}) {
  const initialCache = readCache<T>(cacheKey, ttlMs);
  const hasInitialData = initialCache?.data != null;
  const [data, setData] = useState<T | null>(initialCache?.data ?? null);
  const [loading, setLoading] = useState(initialCache == null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`Failed to load ${url}`);
      const payload = (await res.json()) as T;
      writeCache(cacheKey, payload);
      setData(payload);
      setError(null);
      return payload;
    } catch (err) {
      if (!hasInitialData) {
        setError(err instanceof Error ? err.message : "Request failed");
        setData(null);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cacheKey, hasInitialData, init, url]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!hasInitialData) {
        setLoading(true);
      }

      try {
        const payload = await refresh();
        if (cancelled) return;
        setData(payload);
      } catch {
        if (cancelled) return;
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, hasInitialData, refresh, ttlMs, url]);

  return { data, loading, error, refresh };
}
