import { QueryClient, queryOptions } from '@tanstack/react-query';
import {
  fetchAnime,
  fetchCategory,
  fetchLatestEpisodes,
  fetchSeason,
  fetchTrending,
  searchAnime,
  type ListCategory,
} from './endpoints';
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

export const searchQuery = (text: string, offset: number) =>
  queryOptions({
    queryKey: animeKeys.search(text, offset),
    queryFn: ({ signal }) => searchAnime(text, offset, signal),
    staleTime: 10 * MINUTE,
  });

export const categoryQuery = (category: ListCategory) =>
  queryOptions({
    queryKey: animeKeys.category(category),
    queryFn: ({ signal }) => fetchCategory(category, signal),
    staleTime: 30 * MINUTE,
  });

export const seasonQuery = (season: Season | null, year: number) =>
  queryOptions({
    queryKey: animeKeys.season(season, year),
    queryFn: ({ signal }) => fetchSeason(season, year, signal),
    staleTime: 30 * MINUTE,
  });

export const animeDetailQuery = (id: number) =>
  queryOptions({
    queryKey: animeKeys.detail(id),
    queryFn: ({ signal }) => fetchAnime(id, signal),
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
