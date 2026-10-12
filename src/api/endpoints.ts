import type { Anime, Episode, Page } from '../types/kitsu';
import type { Season } from '../lib/season';
import { kitsuFetch } from './client';
import { isAnimeAttributes, isEpisodeAttributes, many, one } from './guards';

/** Kitsu rejects page[limit] above 20 on /anime and /episodes. */
export const PAGE_SIZE = 20;
/** /trending/anime ignores offsets and page limits, it takes a plain `limit`. */
export const TRENDING_LIMIT = 60;

const animeList = many('anime', isAnimeAttributes);
const animeOne = one('anime', isAnimeAttributes);

export function fetchTrending(signal?: AbortSignal): Promise<Page<Anime>> {
  return kitsuFetch(`/trending/anime?limit=${TRENDING_LIMIT}`, animeList, signal);
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

/** The 20 most popular shows airing right now; feeds the "Continuing" block. */
export function fetchAiring(signal?: AbortSignal): Promise<Page<Anime>> {
  const qs = new URLSearchParams({ 'filter[status]': 'current', sort: '-userCount', 'page[limit]': String(PAGE_SIZE) });
  return kitsuFetch(`/anime?${qs}`, animeList, signal);
}

/**
 * Kitsu's full-text search (titles and alternative titles), most relevant first.
 * Text search ignores page[offset] (every offset returns the first page), so only the top 20 are reachable.
 */
export function fetchSearch(text: string, signal?: AbortSignal): Promise<Page<Anime>> {
  const qs = new URLSearchParams({ 'filter[text]': text, 'page[limit]': String(PAGE_SIZE) });
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
