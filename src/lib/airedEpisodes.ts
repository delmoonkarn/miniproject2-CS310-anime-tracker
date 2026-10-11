import type { AnimeAttributes, EpisodeAttributes } from '../types/kitsu';

export interface AiredInfo {
  /** Number of the last episode that has aired. */
  aired: number;
  /** True when guessed from the start date (shown as "≈ ep N"). */
  estimated: boolean;
}

type ShowFields = Pick<AnimeAttributes, 'status' | 'episodeCount' | 'startDate'>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" in local time, comparable with Kitsu's date strings. */
function toLocalDate(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Does this show need its episode list to work out the last aired episode? */
export const needsEpisodeList = (show: Pick<AnimeAttributes, 'status'>): boolean => show.status === 'current';

/**
 * Last aired episode for the Watching tab.
 * 1. Finished: the episode count, no extra request.
 * 2. Airing: highest-numbered episode with an airdate on or before today.
 * 3. Airing without usable dates: one episode a week since the start date, capped at the episode count.
 * Returns null when there isn't enough data to say anything.
 */
export function lastAiredEpisode(
  show: ShowFields,
  episodes: readonly EpisodeAttributes[] | undefined,
  now: Date = new Date(),
): AiredInfo | null {
  if (show.status === 'finished') {
    return show.episodeCount === null ? null : { aired: show.episodeCount, estimated: false };
  }
  if (show.status !== 'current') return { aired: 0, estimated: false };

  const today = toLocalDate(now);
  let latest = 0;
  for (const ep of episodes ?? []) {
    if (ep.number !== null && ep.airdate !== null && ep.airdate <= today) latest = Math.max(latest, ep.number);
  }
  if (latest > 0) return { aired: latest, estimated: false };

  if (show.startDate === null) return null;
  const start = new Date(`${show.startDate}T00:00:00`);
  const days = Math.floor((now.getTime() - start.getTime()) / DAY_MS);
  if (Number.isNaN(days) || days < 0) return { aired: 0, estimated: true };
  // Episode 1 airs on the start date, then one per week.
  const weekly = Math.floor(days / 7) + 1;
  return { aired: show.episodeCount === null ? weekly : Math.min(weekly, show.episodeCount), estimated: true };
}

export const behindBy = (aired: number, progress: number): number => Math.max(0, aired - progress);
