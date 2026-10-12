import { useShallow } from 'zustand/react/shallow';
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
