import type { Anime, AnimeStatus } from '../types/kitsu';
import type { WatchStatus } from '../store/useLibraryStore';

export const ANIME_STATUS_LABEL: Record<AnimeStatus, string> = {
  current: 'Airing',
  finished: 'Finished',
  upcoming: 'Upcoming',
  unreleased: 'Unreleased',
  tba: 'TBA',
};

export const WATCH_STATUS_LABEL: Record<WatchStatus, string> = {
  watching: 'Watching',
  interested: 'Interested',
  completed: 'Completed',
};

/** Kitsu ratings are percentages as strings ("84.41"). */
export function formatRating(averageRating: string | null): string {
  const n = Number(averageRating);
  return averageRating === null || Number.isNaN(n) ? 'No rating' : `${n.toFixed(0)}%`;
}

export function formatEpisodes(anime: Pick<Anime, 'episodeCount' | 'status'>): string {
  if (anime.episodeCount !== null) return `${anime.episodeCount} ep${anime.episodeCount === 1 ? '' : 's'}`;
  return anime.status === 'current' ? 'Ongoing' : '? eps';
}

export function formatDate(date: string | null): string {
  if (!date) return 'TBA';
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function posterUrl(anime: Pick<Anime, 'posterImage'>, size: 'small' | 'medium' | 'large' = 'small'): string | null {
  const p = anime.posterImage;
  return p?.[size] ?? p?.medium ?? p?.small ?? p?.original ?? null;
}

/** Route params come from the URL: only positive integers are valid Kitsu ids. */
export function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 && Number.isSafeInteger(n) ? n : null;
}
