"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Paginated } from "@/types";

/**
 * Appends pages from `endpoint` (which must return Paginated<T>) as the sentinel
 * scrolls into view. The first page comes from the server render.
 */
export function useInfiniteFeed<T extends { id: string }>(endpoint: string, initial: Paginated<T>) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(endpoint, location.origin);
      url.searchParams.set("page", String(page + 1));
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Couldn’t load more videos");
      const data = (await res.json()) as Paginated<T>;
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...data.items.filter((i) => !seen.has(i.id))];
      });
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t load more videos");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [endpoint, hasMore, page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || error) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), {
      rootMargin: "800px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, error]);

  return { items, hasMore, loading, error, loadMore, sentinelRef };
}
