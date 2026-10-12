import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BUNDLED_STREAM_LINKS } from '../data/streamLinks';
import { STREAM_LINKS_ENDPOINT, serializeSharedLinks, type SharedLinkMap } from '../lib/sharedLinks';
import { publishedLinksKey } from './queryKeys';

/** Only `npm run dev` has the save endpoint; the deployed site shows the published links read-only. */
export const CAN_EDIT_PUBLISHED_LINKS = import.meta.env.DEV;

/**
 * The published links ship inside the bundle, so there is nothing to fetch: the query only holds
 * them, so that a save on /admin shows up on every page straight away.
 */
const publishedLinksQuery = () =>
  queryOptions({
    queryKey: publishedLinksKey,
    queryFn: () => Promise.resolve<SharedLinkMap>(BUNDLED_STREAM_LINKS),
    initialData: BUNDLED_STREAM_LINKS,
    staleTime: Infinity,
    gcTime: Infinity,
  });

export function usePublishedLinks(): SharedLinkMap {
  return useQuery(publishedLinksQuery()).data;
}

async function putPublishedLinks(next: SharedLinkMap): Promise<SharedLinkMap> {
  const res = await fetch(STREAM_LINKS_ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: serializeSharedLinks(next),
  });
  // 404: this dev server started before vite-plugins/streamLinksAdmin.ts was in the config (or failed to load it).
  if (res.status === 404) throw new Error('the save endpoint is missing. Stop the dev server and run `npm run dev` again.');
  if (!res.ok) throw new Error((await res.text()) || `Saving failed (HTTP ${res.status}).`);
  return next;
}

/** Saves the whole map to src/data/streamLinks.json. Optimistic: the UI updates first and rolls back on failure. */
export function useSavePublishedLinks() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: putPublishedLinks,
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey: publishedLinksKey });
      const previous = client.getQueryData<SharedLinkMap>(publishedLinksKey);
      client.setQueryData(publishedLinksKey, next);
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) client.setQueryData(publishedLinksKey, context.previous);
    },
  });
}
