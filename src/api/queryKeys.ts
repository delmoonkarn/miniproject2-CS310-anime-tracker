import type { Season } from '../lib/season';

/** Every Kitsu query key comes from here, so related queries share prefixes and never collide. */
export const animeKeys = {
  all: ['anime'] as const,
  trending: () => [...animeKeys.all, 'trending'] as const,
  airing: () => [...animeKeys.all, 'airing'] as const,
  /** `season: null` = the whole year. */
  season: (season: Season | null, year: number) => [...animeKeys.all, 'season', year, season ?? 'all'] as const,
  search: (text: string) => [...animeKeys.all, 'search', text] as const,
  /** Shared by the Detail, Watchlist and Favorites pages, so a show is fetched once. */
  detail: (id: number) => [...animeKeys.all, 'detail', id] as const,
  latestEpisodes: (id: number) => [...animeKeys.all, 'latestEpisodes', id] as const,
};
