import { QueryClient, queryOptions } from '@tanstack/react-query';
import { fetchAiring, fetchAnime, fetchLatestEpisodes, fetchRelated, fetchSearch, fetchSeason, fetchSeasonTop, fetchTrending } from './endpoints';
import type { Season } from '../lib/season';
import { isKitsuError } from './errors';
import { animeKeys } from './queryKeys';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const trendingQuery = () =>
  queryOptions({
    queryKey: animeKeys.trending(),
    queryFn: ({ signal }) => fetchTrending(signal),
    staleTime: 15 * MINUTE,
  });

export const airingQuery = () =>
  queryOptions({
    queryKey: animeKeys.airing(),
    queryFn: ({ signal }) => fetchAiring(signal),
    staleTime: 30 * MINUTE,
  });

export const seasonQuery = (season: Season | null, year: number) =>
  queryOptions({
    queryKey: animeKeys.season(season, year),
    queryFn: ({ signal }) => fetchSeason(season, year, signal),
    staleTime: 30 * MINUTE,
  });

/** Shortest query sent to Kitsu; one letter matches almost everything. */
export const MIN_SEARCH_LENGTH = 2;

/** Search the whole Kitsu catalogue: the 20 most relevant matches. */
export const searchQuery = (text: string) =>
  queryOptions({
    queryKey: animeKeys.search(text),
    queryFn: ({ signal }) => fetchSearch(text, signal),
    staleTime: 30 * MINUTE,
    enabled: text.length >= MIN_SEARCH_LENGTH,
  });

export const seasonTopQuery = (season: Season, year: number, limit: number) =>
  queryOptions({
    queryKey: animeKeys.seasonTop(season, year, limit),
    queryFn: ({ signal }) => fetchSeasonTop(season, year, limit, signal),
    staleTime: 30 * MINUTE,
  });

export const animeDetailQuery = (id: number) =>
  queryOptions({
    queryKey: animeKeys.detail(id),
    queryFn: ({ signal }) => fetchAnime(id, signal),
    staleTime: 2 * HOUR,
    gcTime: 2 * HOUR,
  });

/** Relations rarely change, so they stay fresh as long as the show's details. */
export const relatedQuery = (id: number) =>
  queryOptions({
    queryKey: animeKeys.related(id),
    queryFn: ({ signal }) => fetchRelated(id, signal),
    staleTime: 2 * HOUR,
    gcTime: 2 * HOUR,
  });

export const latestEpisodesQuery = (id: number, enabled = true) =>
  queryOptions({
    queryKey: animeKeys.latestEpisodes(id),
    queryFn: ({ signal }) => fetchLatestEpisodes(id, signal),
    staleTime: 4 * HOUR,
    gcTime: 4 * HOUR,
    enabled,
  });

/** Retry network failures, 5xx and rate limits. Other 4xx (404, 400) and parse errors won't fix themselves. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2 || !isKitsuError(error)) return false;
  if (error.kind === 'network') return true;
  return error.kind === 'http' && error.status !== null && (error.status >= 500 || error.isRateLimit);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      gcTime: 30 * MINUTE,
      retry: shouldRetry,
    },
  },
});
