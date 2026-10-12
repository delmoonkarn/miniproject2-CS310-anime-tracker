import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePublishedLinks } from '../api/publishedLinks';
import { serviceOf } from '../lib/streamLinks';
import { useLibraryStore, type StreamLink, type WatchStatus } from './useLibraryStore';

const NO_LINKS: StreamLink[] = [];
const NO_SERVICES: readonly string[] = [];

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

export function useStatusCounts(): Record<WatchStatus, number> {
  return useLibraryStore(
    useShallow((s) => {
      const counts = { watching: 0, interested: 0, completed: 0 };
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
  /** true = published in src/data/streamLinks.json (read-only), false = the user's own link. */
  shared: boolean;
}

/**
 * Every link for a show: the published ones first, then the user's own. The shared list is static
 * app data, so it is merged here at read time and never copied into the store.
 * A personal link with the same URL as a shared one is left out.
 */
export function useWatchLinks(animeId: number): WatchLink[] {
  const personal = useStreamLinks(animeId);
  const published = usePublishedLinks();
  return useMemo(() => {
    const shared = published[animeId] ?? [];
    const sharedUrls = new Set(shared.map((l) => l.url));
    return [
      ...shared.map((l) => ({ label: l.label, url: l.url, shared: true })),
      ...personal.filter((l) => !sharedUrls.has(l.url)).map((l) => ({ label: l.label, url: l.url, shared: false })),
    ];
  }, [animeId, personal, published]);
}

export interface ServiceIndex {
  /** Streaming services a show has a link for (published or personal), e.g. ["Netflix", "iQIYI"]. */
  servicesOf: (animeId: number) => readonly string[];
  /** One link per service, used to draw that service's logo. */
  logoLink: ReadonlyMap<string, { url: string; label: string }>;
}

/** Which shows are on which streaming service, from every published and personal link. */
export function useServiceIndex(): ServiceIndex {
  const personal = useLibraryStore((s) => s.streamLinks);
  const published = usePublishedLinks();
  return useMemo(() => {
    const byAnime = new Map<number, string[]>();
    const logoLink = new Map<string, { url: string; label: string }>();
    const add = (id: number, links: readonly { url: string; label: string }[]) => {
      for (const l of links) {
        const name = serviceOf(l.url, l.label);
        const list = byAnime.get(id) ?? [];
        if (!list.includes(name)) list.push(name);
        byAnime.set(id, list);
        if (!logoLink.has(name)) logoLink.set(name, { url: l.url, label: l.label });
      }
    };
    for (const [id, links] of Object.entries(published)) add(Number(id), links);
    for (const [id, links] of Object.entries(personal)) add(Number(id), links);
    return { servicesOf: (id) => byAnime.get(id) ?? NO_SERVICES, logoLink };
  }, [personal, published]);
}
