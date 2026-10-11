import type { Anime, Episode, Page } from '../types/kitsu';
import { kitsuFetch } from './client';
import { isAnimeAttributes, isEpisodeAttributes, many, one } from './guards';

/** Kitsu rejects page[limit] above 20 on /anime and /episodes. */
export const PAGE_SIZE = 20;
/** /trending/anime ignores offsets, so the home page fetches this many once and pages through them locally. */
export const TRENDING_LIMIT = 60;

const animeList = many('anime', isAnimeAttributes);
const animeOne = one('anime', isAnimeAttributes);

export function fetchTrending(signal?: AbortSignal): Promise<Page<Anime>> {
  return kitsuFetch(`/trending/anime?limit=${TRENDING_LIMIT}`, animeList, signal);
}

export function searchAnime(text: string, offset: number, signal?: AbortSignal): Promise<Page<Anime>> {
  const qs = new URLSearchParams({
    'filter[text]': text,
    'page[limit]': String(PAGE_SIZE),
    'page[offset]': String(offset),
  });
  return kitsuFetch(`/anime?${qs}`, animeList, signal);
}

export function fetchAnime(id: number, signal?: AbortSignal): Promise<Anime> {
  return kitsuFetch(`/anime/${id}`, animeOne, signal);
}

/**
 * The 20 highest-numbered episodes. `/anime/:id/episodes` ignores `sort`, the top-level
 * `/episodes` endpoint honours it, so this works for 1000+ episode shows in one request.
 */
export function fetchLatestEpisodes(animeId: number, signal?: AbortSignal): Promise<Page<Episode>> {
  const qs = new URLSearchParams({
    'filter[mediaType]': 'Anime',
    'filter[mediaId]': String(animeId),
    sort: '-number',
    'page[limit]': String(PAGE_SIZE),
    'fields[episodes]': 'number,airdate',
  });
  return kitsuFetch(`/episodes?${qs}`, many('episodes', isEpisodeAttributes), signal);
}

// ---------- explore categories ----------

export const EXPLORE_CATEGORIES = {
  trending: { label: 'Trending', description: 'What the Kitsu community is watching right now.' },
  airing: { label: 'Airing', description: 'Currently airing shows, most popular first.' },
  upcoming: { label: 'Upcoming', description: 'Announced shows that have not started yet.' },
  'highest-rated': { label: 'Highest rated', description: 'All-time top average ratings.' },
} as const;

export type ExploreCategory = keyof typeof EXPLORE_CATEGORIES;

export const isExploreCategory = (v: unknown): v is ExploreCategory =>
  typeof v === 'string' && Object.hasOwn(EXPLORE_CATEGORIES, v);

const CATEGORY_QUERY: Record<Exclude<ExploreCategory, 'trending'>, Record<string, string>> = {
  airing: { 'filter[status]': 'current', sort: '-userCount' },
  upcoming: { 'filter[status]': 'upcoming', sort: '-userCount' },
  'highest-rated': { sort: '-averageRating' },
};

export function fetchCategory(
  category: Exclude<ExploreCategory, 'trending'>,
  signal?: AbortSignal,
): Promise<Page<Anime>> {
  const qs = new URLSearchParams({ ...CATEGORY_QUERY[category], 'page[limit]': String(PAGE_SIZE) });
  return kitsuFetch(`/anime?${qs}`, animeList, signal);
}
