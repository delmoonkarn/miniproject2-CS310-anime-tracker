import type { Anime, Episode, Page, RelatedAnime } from '../types/kitsu';
import type { Season } from '../lib/season';
import { kitsuFetch } from './client';
import { KitsuError } from './errors';
import { isAnimeAttributes, isEpisodeAttributes, many, one, relatedAnime } from './guards';

/** Kitsu rejects page[limit] above 20 on /anime and /episodes. */
const PAGE_SIZE = 20;
/** /trending/anime ignores offsets and page limits, it takes a plain `limit`. */
const TRENDING_LIMIT = 60;

const animeList = many('anime', isAnimeAttributes);
const animeOne = one('anime', isAnimeAttributes);

export function fetchTrending(signal?: AbortSignal): Promise<Page<Anime>> {
  return kitsuFetch(`/trending/anime?limit=${TRENDING_LIMIT}`, animeList, signal);
}

// ---------- show details, batched ----------
// Pages like the Watchlist, Favorites and Edit links load many shows at once, one detail query each.
// Calls made within BATCH_WINDOW_MS are collected and loaded with `/anime?filter[id]=…` (20 per
// request), so 50 shows take 3 requests instead of 50. Each show still has its own cache entry.

const BATCH_WINDOW_MS = 10;

interface Waiter {
  resolve: (anime: Anime) => void;
  reject: (error: unknown) => void;
}

let waiting = new Map<number, Waiter[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function settle(ids: readonly number[], batch: ReadonlyMap<number, Waiter[]>, found: ReadonlyMap<number, Anime>) {
  for (const id of ids) {
    const anime = found.get(id);
    for (const w of batch.get(id) ?? []) {
      if (anime) w.resolve(anime);
      else w.reject(new KitsuError('http', `Kitsu has no anime with id ${id}.`, 404));
    }
  }
}

function flush() {
  flushTimer = null;
  const batch = waiting;
  waiting = new Map();
  const ids = [...batch.keys()];
  for (let i = 0; i < ids.length; i += PAGE_SIZE) {
    const chunk = ids.slice(i, i + PAGE_SIZE);
    const fail = (error: unknown) => chunk.forEach((id) => batch.get(id)?.forEach((w) => w.reject(error)));
    if (chunk.length === 1) {
      // A lone show (the usual case on the Detail page) uses the plain endpoint, with Kitsu's own 404.
      const id = chunk[0] ?? 0;
      kitsuFetch(`/anime/${id}`, animeOne).then((a) => settle(chunk, batch, new Map([[id, a]])), fail);
    } else {
      const qs = new URLSearchParams({ 'filter[id]': chunk.join(','), 'page[limit]': String(PAGE_SIZE) });
      kitsuFetch(`/anime?${qs}`, animeList).then((page) => settle(chunk, batch, new Map(page.items.map((a) => [a.id, a]))), fail);
    }
  }
}

/** One show's details. Batched with other calls made at the same time (see above). */
export function fetchAnime(id: number, signal?: AbortSignal): Promise<Anime> {
  return new Promise<Anime>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    // A cancelled query stops waiting; the shared request still finishes for the other shows.
    signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
    waiting.set(id, [...(waiting.get(id) ?? []), { resolve, reject }]);
    flushTimer ??= setTimeout(flush, BATCH_WINDOW_MS);
  });
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

/** Prequels, sequels, side stories… of one show, with the related anime included (one request, up to 20). */
export function fetchRelated(animeId: number, signal?: AbortSignal): Promise<RelatedAnime[]> {
  const qs = new URLSearchParams({ include: 'destination', 'page[limit]': String(PAGE_SIZE), 'fields[manga]': 'canonicalTitle' });
  return kitsuFetch(`/anime/${animeId}/media-relationships?${qs}`, relatedAnime, signal);
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

/** The `limit` most popular shows of one season in one request, for the Home page's "Trending this season" row. */
export function fetchSeasonTop(season: Season, year: number, limit: number, signal?: AbortSignal): Promise<Page<Anime>> {
  const qs = new URLSearchParams({
    'filter[season]': season,
    'filter[seasonYear]': String(year),
    sort: '-userCount',
    'page[limit]': String(Math.min(limit, PAGE_SIZE)),
  });
  return kitsuFetch(`/anime?${qs}`, animeList, signal);
}

/** A season holds ~100–180 shows, a whole year 500+. Cap the page walk; the list is popularity-sorted. */
const SEASON_MAX_PAGES = 8;

/**
 * All anime of a season (or a whole year when `season` is null), most popular first.
 * Walks `page[offset]` because Kitsu caps pages at 20; each page goes through the kitsuFetch queue.
 */
export async function fetchSeason(season: Season | null, year: number, signal?: AbortSignal): Promise<Page<Anime>> {
  const pageAt = (page: number) => {
    const qs = new URLSearchParams({
      ...(season ? { 'filter[season]': season } : {}),
      'filter[seasonYear]': String(year),
      sort: '-userCount',
      'page[limit]': String(PAGE_SIZE),
      'page[offset]': String(page * PAGE_SIZE),
    });
    return kitsuFetch(`/anime?${qs}`, animeList, signal);
  };

  // The first page tells us the total, so the remaining pages can be fetched in parallel.
  const first = await pageAt(0);
  const total = first.total;
  const pageCount =
    first.items.length < PAGE_SIZE ? 1 : Math.min(SEASON_MAX_PAGES, total === null ? SEASON_MAX_PAGES : Math.ceil(total / PAGE_SIZE));
  const rest = await Promise.all(Array.from({ length: pageCount - 1 }, (_, i) => pageAt(i + 1)));

  // Kitsu sometimes ignores page[offset] and repeats an earlier page, so results are de-duplicated by id.
  const byId = new Map<number, Anime>();
  for (const page of [first, ...rest]) for (const a of page.items) if (!byId.has(a.id)) byId.set(a.id, a);
  return { items: [...byId.values()], total };
}
