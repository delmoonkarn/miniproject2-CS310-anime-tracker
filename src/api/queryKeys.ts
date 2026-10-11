import type { ListCategory } from './endpoints';
import type { Season } from '../lib/season';

/** Every Kitsu query key comes from here, so related queries share prefixes and never collide. */
export const animeKeys = {
  all: ['anime'] as const,
  trending: () => [...animeKeys.all, 'trending'] as const,
  search: (text: string, offset: number) => [...animeKeys.all, 'search', text, offset] as const,
  category: (category: ListCategory) => [...animeKeys.all, 'category', category] as const,
  /** `season: null` = the whole year. */
  season: (season: Season | null, year: number) => [...animeKeys.all, 'season', year, season ?? 'all'] as const,
  /** Shared by the Detail page and every Collection tab, so a show is fetched once. */
  detail: (id: number) => [...animeKeys.all, 'detail', id] as const,
  latestEpisodes: (id: number) => [...animeKeys.all, 'latestEpisodes', id] as const,
};
