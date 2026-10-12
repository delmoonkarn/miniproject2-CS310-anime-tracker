import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SHARED_STREAM_LINKS } from '../data/streamLinks';
import { useLibraryStore, type StreamLink, type WatchStatus } from './useLibraryStore';

const NO_LINKS: StreamLink[] = [];

/** Ids with the given status (newest first), or the favorites. useShallow keeps the array stable between renders. */
export function useCollectionIds(kind: WatchStatus | 'favorites'): number[] {
  return useLibraryStore(
    useShallow((s) =>
      kind === 'favorites'
        ? s.favoriteIds
        : Object.entries(s.entries)
            .filter(([, e]) => e.status === kind)
            .sort(([, a], [, b]) => b.addedAt - a.addedAt)
            .map(([id]) => Number(id)),
    ),
  );
}

export function useStatusCounts(): Record<WatchStatus | 'favorites', number> {
  return useLibraryStore(
    useShallow((s) => {
      const counts = { watching: 0, interested: 0, completed: 0, favorites: s.favoriteIds.length };
      for (const e of Object.values(s.entries)) counts[e.status]++;
      return counts;
    }),
  );
}

/** The user's streaming links for one show. A shared empty array keeps the reference stable when there are none. */
export function useStreamLinks(animeId: number): StreamLink[] {
  return useLibraryStore((s) => s.streamLinks[animeId] ?? NO_LINKS);
}

export interface WatchLink {
  label: string;
  url: string;
  /** true = published in src/data/streamLinks.ts (read-only), false = the user's own link. */
  shared: boolean;
}

/**
 * Every link for a show: the published ones first, then the user's own. The shared list is static
 * app data, so it is merged here at read time and never copied into the store.
 * A personal link with the same URL as a shared one is left out.
 */
export function useWatchLinks(animeId: number): WatchLink[] {
  const personal = useStreamLinks(animeId);
  return useMemo(() => {
    const shared = SHARED_STREAM_LINKS[animeId] ?? [];
    const sharedUrls = new Set(shared.map((l) => l.url));
    return [
      ...shared.map((l) => ({ label: l.label, url: l.url, shared: true })),
      ...personal.filter((l) => !sharedUrls.has(l.url)).map((l) => ({ label: l.label, url: l.url, shared: false })),
    ];
  }, [animeId, personal]);
}
