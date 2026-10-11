import type { Anime, Episode, Page } from '../types/kitsu';
import type { Season } from '../lib/season';
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
  season: { label: 'By season', description: 'Everything airing in a season, most popular first.' },
  trending: { label: 'Trending', description: 'What the Kitsu community is watching right now.' },
  airing: { label: 'Airing', description: 'Currently airing shows, most popular first.' },
  upcoming: { label: 'Upcoming', description: 'Announced shows that have not started yet.' },
  'highest-rated': { label: 'Highest rated', description: 'All-time top average ratings.' },
} as const;

export type ExploreCategory = keyof typeof EXPLORE_CATEGORIES;
/** Categories that are a single Kitsu list request. */
export type ListCategory = Exclude<ExploreCategory, 'trending' | 'season'>;

export const isExploreCategory = (v: unknown): v is ExploreCategory =>
  typeof v === 'string' && Object.hasOwn(EXPLORE_CATEGORIES, v);

const CATEGORY_QUERY: Record<ListCategory, Record<string, string>> = {
  airing: { 'filter[status]': 'current', sort: '-userCount' },
  upcoming: { 'filter[status]': 'upcoming', sort: '-userCount' },
  'highest-rated': { sort: '-averageRating' },
};

export function fetchCategory(category: ListCategory, signal?: AbortSignal): Promise<Page<Anime>> {
  const qs = new URLSearchParams({ ...CATEGORY_QUERY[category], 'page[limit]': String(PAGE_SIZE) });
  return kitsuFetch(`/anime?${qs}`, animeList, signal);
}

/** A season holds ~100–180 shows, a whole year 500+. Cap the page walk; the list is popularity-sorted. */
export const SEASON_MAX_PAGES = 8;

/**
 * All anime of a season (or a whole year when `season` is null), most popular first.
 * Walks `page[offset]` because Kitsu caps pages at 20; each page goes through the kitsuFetch queue.
 */
export async function fetchSeason(season: Season | null, year: number, signal?: AbortSignal): Promise<Page<Anime>> {
  // Kitsu sometimes ignores page[offset] and repeats an earlier page, so results are de-duplicated by id.
  const byId = new Map<number, Anime>();
  let total: number | null = null;
  for (let page = 0; page < SEASON_MAX_PAGES; page++) {
    const qs = new URLSearchParams({
      ...(season ? { 'filter[season]': season } : {}),
      'filter[seasonYear]': String(year),
      sort: '-userCount',
      'page[limit]': String(PAGE_SIZE),
      'page[offset]': String(page * PAGE_SIZE),
    });
    const res = await kitsuFetch(`/anime?${qs}`, animeList, signal);
    for (const a of res.items) if (!byId.has(a.id)) byId.set(a.id, a);
    total = res.total;
    if (res.items.length < PAGE_SIZE || (total !== null && (page + 1) * PAGE_SIZE >= total)) break;
  }
  return { items: [...byId.values()], total };
}
