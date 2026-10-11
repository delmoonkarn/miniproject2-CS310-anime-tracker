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

// ---------- next episode ----------

export interface NextEpisodeInfo {
  /** null when the episode number can't be worked out. */
  number: number | null;
  date: Date;
  /** Only Kitsu's `nextRelease` carries a broadcast time; episode airdates are dates only. */
  hasTime: boolean;
  /** True when guessed from a weekly schedule (shown with "≈"). */
  estimated: boolean;
}

type NextFields = Pick<AnimeAttributes, 'status' | 'episodeCount' | 'startDate' | 'nextRelease'>;
type DatedEpisode = { number: number; airdate: string };

const parseLocalDate = (d: string) => new Date(`${d}T00:00:00`);

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days); // calendar arithmetic, so DST changes don't shift the day
  return d;
}

/** The first date `start + 7·weeks` that falls after `today` (both local midnights). */
function nextWeekly(start: Date, today: Date): { weeks: number; date: Date } {
  const days = Math.round((today.getTime() - start.getTime()) / DAY_MS);
  const weeks = days < 0 ? 0 : Math.floor(days / 7) + 1;
  return { weeks, date: addDays(start, 7 * weeks) };
}

/**
 * Next episode of a currently airing show, using the best data Kitsu has:
 * 1. the earliest episode with an airdate after today (exact),
 * 2. Kitsu's `nextRelease` timestamp (exact, with a time),
 * 3. one week after the last dated episode that has aired (estimate),
 * 4. one episode a week from the start date (estimate).
 * Returns null for shows that aren't airing, or when an estimate would pass the known episode count.
 */
export function nextEpisode(
  show: NextFields,
  episodes: readonly EpisodeAttributes[] | undefined,
  now: Date = new Date(),
): NextEpisodeInfo | null {
  if (show.status !== 'current') return null;

  const todayStr = toLocalDate(now);
  const today = parseLocalDate(todayStr);
  const dated = (episodes ?? []).filter((e): e is DatedEpisode => e.number !== null && e.airdate !== null);

  const upcoming = dated
    .filter((e) => e.airdate > todayStr)
    .sort((a, b) => a.airdate.localeCompare(b.airdate) || a.number - b.number)[0];
  if (upcoming) return { number: upcoming.number, date: parseLocalDate(upcoming.airdate), hasTime: false, estimated: false };

  const lastAired = dated.filter((e) => e.airdate <= todayStr).sort((a, b) => b.number - a.number)[0];

  if (show.nextRelease) {
    const at = new Date(show.nextRelease);
    if (!Number.isNaN(at.getTime()) && at > now) {
      return { number: lastAired ? lastAired.number + 1 : null, date: at, hasTime: true, estimated: false };
    }
  }

  const withinCount = (n: number) => show.episodeCount === null || n <= show.episodeCount;

  if (lastAired) {
    const { weeks, date } = nextWeekly(parseLocalDate(lastAired.airdate), today);
    const number = lastAired.number + weeks;
    return withinCount(number) ? { number, date, hasTime: false, estimated: true } : null;
  }

  if (show.startDate === null) return null;
  const start = parseLocalDate(show.startDate);
  if (Number.isNaN(start.getTime())) return null;
  // Episode 1 airs on the start date, so after `weeks` weekly slots the next one is episode weeks + 1.
  const { weeks, date } = nextWeekly(start, today);
  const number = weeks + 1;
  return withinCount(number) ? { number, date, hasTime: false, estimated: true } : null;
}
