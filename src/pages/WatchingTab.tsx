import { useEffect, useRef, type MouseEvent } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { useWatchingData } from '../api/hooks';
import { useCollectionIds, useWatchLinks } from '../store/selectors';
import { useLibraryStore } from '../store/useLibraryStore';
import { behindBy, lastAiredEpisode, needsEpisodeList, nextEpisode } from '../lib/airedEpisodes';
import { ANIME_STATUS_LABEL, formatNextEpisode, posterUrl } from '../lib/format';
import { WEEKDAY_LABEL, WEEK_ORDER, dayFilterKey, groupByWeekday, parseDayFilter, type DayFilter } from '../lib/schedule';
import { pillClass } from '../components/pill';
import { EmptyState, ErrorState, RowSkeleton } from '../components/States';
import { Poster } from '../components/Poster';
import { Icon } from '../components/Icon';
import { ServiceLogo } from '../components/ServiceLogo';
import type { Anime, Episode, Page } from '../types/kitsu';

interface RowData {
  id: number;
  detail: UseQueryResult<Anime>;
  episodes: UseQueryResult<Page<Episode>>;
  /** Weekday of the next episode, null when there's none (or the show failed to load). */
  day: number | null;
  sortKey: number;
}

export function WatchingTab() {
  const ids = useCollectionIds('watching');
  const { details, episodes } = useWatchingData(ids);
  const todayRef = useRef<HTMLElement>(null);
  const scrolled = useRef(false);
  // The day filter lives in the URL (?day=fri, ?day=none), so it survives reloads and Back.
  const [params, setParams] = useSearchParams();
  const dayFilter = parseDayFilter(params.get('day'));
  const setDayFilter = (f: DayFilter) => {
    const key = dayFilterKey(f);
    setParams(key ? { day: key } : {}, { replace: true });
  };
  const today = new Date().getDay();

  // A row is placed once its detail (and, for airing shows, its episodes) has loaded.
  const ready: RowData[] = [];
  const pending: number[] = [];
  ids.forEach((id, i) => {
    const detail = details[i];
    const eps = episodes[i];
    if (!detail || !eps) return;
    if (detail.isError) {
      ready.push({ id, detail, episodes: eps, day: null, sortKey: Infinity });
      return;
    }
    if (!detail.data || (needsEpisodeList(detail.data) && eps.isPending)) {
      pending.push(id);
      return;
    }
    const next = nextEpisode(detail.data, eps.data?.items);
    ready.push({ id, detail, episodes: eps, day: next ? next.date.getDay() : null, sortKey: next?.date.getTime() ?? Infinity });
  });
  ready.sort((a, b) => a.sortKey - b.sortKey);
  const allGroups = groupByWeekday(ready, (r) => r.day, today);
  const groups =
    dayFilter === 'all'
      ? allGroups
      : [allGroups.find((g) => g.day === dayFilter) ?? { day: dayFilter, isToday: dayFilter === today, items: [] }];
  const allPlaced = pending.length === 0;
  const countFor = (day: number | null) => ready.filter((r) => r.day === day).length;

  // Jump to today once, after every row has found its day, so the layout no longer shifts.
  // Skipped when a day is picked: that day is then the only one on screen.
  useEffect(() => {
    if (dayFilter === 'all' && allPlaced && ids.length > 0 && !scrolled.current) {
      scrolled.current = true;
      todayRef.current?.scrollIntoView({ block: 'start' });
      todayRef.current?.focus({ preventScroll: true });
    }
  }, [dayFilter, allPlaced, ids.length]);

  if (ids.length === 0) {
    return (
      <EmptyState title="You're not watching anything">
        <p>Set a show's status to “Watching” to see how far behind you are.</p>
        <Link to="/explore" className="btn btn-primary btn-sm mt-3">
          Browse this season
        </Link>
      </EmptyState>
    );
  }

  const noDateCount = countFor(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Sticks under the navbar so the filter stays reachable after the jump to today. */}
      <div
        className="sticky top-14 z-10 -mx-4 -my-2 flex flex-wrap items-center gap-1.5 bg-base-200/90 px-4 py-2 backdrop-blur-md"
        role="group"
        aria-label="Filter by airing day"
      >
        <button type="button" className={pillClass(dayFilter === 'all')} aria-pressed={dayFilter === 'all'} onClick={() => setDayFilter('all')}>
          All days <span className="tabular-nums opacity-60">{ids.length}</span>
        </button>
        {WEEK_ORDER.map((d) => {
          const n = countFor(d);
          return (
            <button
              key={d}
              type="button"
              className={`${pillClass(dayFilter === d)} ${n === 0 && dayFilter !== d ? 'opacity-50' : ''}`}
              aria-pressed={dayFilter === d}
              aria-label={`${WEEKDAY_LABEL[d]}${d === today ? ' (today)' : ''}, ${n} show${n === 1 ? '' : 's'}`}
              onClick={() => setDayFilter(d)}
            >
              {d === today && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
              {WEEKDAY_LABEL[d]?.slice(0, 3)} <span className="tabular-nums opacity-60">{n}</span>
            </button>
          );
        })}
        {noDateCount > 0 && (
          <button type="button" className={pillClass(dayFilter === null, 'info')} aria-pressed={dayFilter === null} onClick={() => setDayFilter(null)}>
            No date <span className="tabular-nums opacity-60">{noDateCount}</span>
          </button>
        )}
      </div>

      {groups.map((g) => (
        <section
          key={g.day ?? 'none'}
          ref={g.isToday ? todayRef : undefined}
          tabIndex={g.isToday ? -1 : undefined}
          aria-current={g.isToday ? 'date' : undefined}
          aria-labelledby={`day-${g.day ?? 'none'}`}
          className={`scroll-mt-32 rounded-box outline-none ${g.isToday ? 'border border-primary/40 bg-primary/5 p-3 sm:p-4' : ''}`}
        >
          <h2 id={`day-${g.day ?? 'none'}`} className="mb-3 flex items-center gap-2 text-sm font-semibold">
            {g.day === null ? 'No upcoming episode' : WEEKDAY_LABEL[g.day]}
            {g.isToday && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-content">Today</span>
            )}
            <span className="text-base-content/50 tabular-nums">{g.items.length}</span>
            <span className="flex-1 border-t border-base-300" aria-hidden />
          </h2>
          {g.items.length === 0 ? (
            <p className="text-sm text-base-content/60">
              {g.isToday ? 'Nothing you watch airs today.' : g.day === null ? 'Every show has a next episode date.' : `Nothing you watch airs on ${WEEKDAY_LABEL[g.day]}.`}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {g.items.map((r) => (
                <li key={r.id}>
                  <WatchingRow detail={r.detail} episodes={r.episodes} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {pending.length > 0 && (
        <section aria-busy="true">
          <h2 className="mb-3 text-sm font-semibold text-base-content/60">Checking schedule…</h2>
          <ul className="flex flex-col gap-3">
            {pending.map((id) => (
              <li key={id}>
                <RowSkeleton />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function WatchingRow({
  detail,
  episodes,
}: {
  detail: UseQueryResult<Anime>;
  episodes: UseQueryResult<Page<Episode>>;
}) {
  if (detail.isPending) return <RowSkeleton />;
  if (detail.isError) return <ErrorState compact error={detail.error} onRetry={() => void detail.refetch()} />;
  return <WatchingRowContent anime={detail.data} episodes={episodes} />;
}

function WatchingRowContent({ anime, episodes }: { anime: Anime; episodes: UseQueryResult<Page<Episode>> }) {
  const total = anime.episodeCount;
  const progress = useLibraryStore((s) => s.entries[anime.id]?.progress ?? 0);
  const favorited = useLibraryStore((s) => s.favoriteIds.includes(anime.id));
  const watchLinks = useWatchLinks(anime.id);
  const { setProgress, increment, setStatus, toggleFavorite, remove } = useLibraryStore.getState();

  const waitingForEpisodes = needsEpisodeList(anime) && episodes.isPending;
  // If the episode request fails, lastAiredEpisode falls back to the start-date estimate.
  const aired = waitingForEpisodes ? null : lastAiredEpisode(anime, episodes.data?.items);
  const behind = aired ? behindBy(aired.aired, progress) : null;
  const next = waitingForEpisodes ? null : nextEpisode(anime, episodes.data?.items);
  const atEnd = total !== null && progress >= total;

  // Runs a menu action, then blurs so DaisyUI's focus-based dropdown closes.
  const menuAction = (action: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
    action();
    e.currentTarget.blur();
  };

  return (
    <div className="surface flex flex-wrap items-center gap-3 p-3 transition-colors hover:border-base-content/20 sm:flex-nowrap sm:gap-4">
      <Link to={`/anime/${anime.id}`} className="shrink-0">
        <Poster src={posterUrl(anime, 'small')} title={anime.canonicalTitle} className="h-20 w-14 rounded-md" />
      </Link>

      <div className="flex min-w-0 flex-1 basis-40 flex-col gap-1">
        <Link to={`/anime/${anime.id}`} className="truncate font-semibold hover:text-primary">
          {anime.canonicalTitle}
        </Link>
        <p className="text-xs sm:text-sm">
          <span className="text-base-content/70">
            {waitingForEpisodes ? (
              <span className="skeleton inline-block h-3 w-20 align-middle" aria-label="Checking aired episodes" />
            ) : aired === null ? (
              'Aired: unknown'
            ) : aired.estimated ? (
              <span title="Estimated from the start date (one episode per week)">Aired: ≈ ep {aired.aired}</span>
            ) : (
              `Aired: ep ${aired.aired}`
            )}
          </span>
          {next && (
            <>
              <span className="mx-2 text-base-content/40">·</span>
              <span
                className="text-base-content/70"
                title={next.estimated ? 'Estimated from a weekly schedule' : 'Air date from Kitsu'}
              >
                Next: {formatNextEpisode(next)}
              </span>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-md bg-base-300/70 px-1.5 py-0.5 text-xs font-medium text-base-content/70">
            {ANIME_STATUS_LABEL[anime.status]}
          </span>
          {behind !== null &&
            (behind > 0 ? (
              <span className="rounded-md bg-warning/20 px-1.5 py-0.5 text-xs font-medium">
                Behind by {aired?.estimated ? '≈ ' : ''}
                {behind}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-1.5 py-0.5 text-xs font-medium text-success">
                <Icon name="check" className="size-3" />
                Caught up
              </span>
            ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {watchLinks.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-1">
            {watchLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-ghost btn-square"
                aria-label={`Watch ${anime.canonicalTitle} on ${l.label}`}
                title={`Watch on ${l.label}`}
              >
                <ServiceLogo url={l.url} label={l.label} />
              </a>
            ))}
          </div>
        )}
        <div className="join" role="group" aria-label={`Episodes watched of ${anime.canonicalTitle}`}>
          <button
            type="button"
            className="btn btn-sm join-item"
            disabled={progress <= 0}
            onClick={() => setProgress(anime.id, progress - 1, total)}
            aria-label="One episode less"
          >
            <Icon name="minus" className="size-3.5" />
          </button>
          <span className="join-item flex min-w-16 items-center justify-center border border-base-300 bg-base-200 px-2 text-sm font-medium tabular-nums">
            {progress} / {total ?? '?'}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-primary join-item"
            disabled={atEnd}
            onClick={() => increment(anime.id, total)}
            aria-label="One episode more"
          >
            <Icon name="plus" className="size-3.5" />
          </button>
        </div>

        <div className="dropdown dropdown-end">
          <button type="button" tabIndex={0} className="btn btn-sm btn-ghost btn-square" aria-label={`More actions for ${anime.canonicalTitle}`}>
            <Icon name="more" className="size-4" />
          </button>
          <ul tabIndex={0} className="menu dropdown-content menu-sm surface z-30 mt-1 w-48 p-1 shadow-lg">
            <li>
              <button type="button" onClick={menuAction(() => setStatus(anime.id, 'completed', total))}>
                <Icon name="check" className="size-3.5" />
                Mark completed
              </button>
            </li>
            <li>
              <button type="button" onClick={menuAction(() => toggleFavorite(anime.id))}>
                <Icon name="heart" filled={favorited} className="size-3.5" />
                {favorited ? 'Unfavorite' : 'Favorite'}
              </button>
            </li>
            <li>
              <button type="button" className="text-error" onClick={menuAction(() => remove(anime.id))}>
                <Icon name="x" className="size-3.5" />
                Remove
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
