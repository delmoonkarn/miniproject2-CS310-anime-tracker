import type { MouseEvent } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useWatchingData } from '../../api/hooks';
import { useCollectionIds } from '../../store/selectors';
import { useLibraryStore } from '../../store/useLibraryStore';
import { behindBy, lastAiredEpisode, needsEpisodeList } from '../../lib/airedEpisodes';
import { ANIME_STATUS_LABEL, posterUrl } from '../../lib/format';
import { EmptyState, ErrorState, RowSkeleton } from '../../components/States';
import { Poster } from '../../components/Poster';
import type { Anime, Episode, Page } from '../../types/kitsu';

export function WatchingTab() {
  const ids = useCollectionIds('watching');
  const { details, episodes } = useWatchingData(ids);

  if (ids.length === 0) {
    return (
      <EmptyState title="You're not watching anything">
        <p>Set a show's status to “Watching” to see how far behind you are.</p>
        <Link to="/explore/season" className="btn btn-primary btn-sm mt-3">
          Browse this season
        </Link>
      </EmptyState>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {ids.map((id, i) => {
        const detail = details[i];
        const eps = episodes[i];
        return <li key={id}>{detail && eps && <WatchingRow detail={detail} episodes={eps} />}</li>;
      })}
    </ul>
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
  const { setProgress, increment, setStatus, toggleFavorite, remove } = useLibraryStore.getState();

  const waitingForEpisodes = needsEpisodeList(anime) && episodes.isPending;
  // If the episode request fails, lastAiredEpisode falls back to the start-date estimate.
  const aired = waitingForEpisodes ? null : lastAiredEpisode(anime, episodes.data?.items);
  const behind = aired ? behindBy(aired.aired, progress) : null;
  const atEnd = total !== null && progress >= total;

  // Runs a menu action, then blurs so DaisyUI's focus-based dropdown closes.
  const menuAction = (action: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
    action();
    e.currentTarget.blur();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-box bg-base-200 p-3 sm:flex-nowrap sm:gap-4">
      <Link to={`/anime/${anime.id}`} className="shrink-0">
        <Poster src={posterUrl(anime, 'small')} title={anime.canonicalTitle} className="h-24 w-16 rounded" />
      </Link>

      <div className="flex min-w-0 flex-1 basis-40 flex-col gap-1">
        <Link to={`/anime/${anime.id}`} className="link-hover truncate font-semibold">
          {anime.canonicalTitle}
        </Link>
        <p className="text-sm">
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
        </p>
        <div className="flex flex-wrap gap-1">
          <span className="badge badge-sm badge-ghost">{ANIME_STATUS_LABEL[anime.status]}</span>
          {behind !== null &&
            (behind > 0 ? (
              <span className="badge badge-sm badge-warning">
                Behind by {aired?.estimated ? '≈ ' : ''}
                {behind}
              </span>
            ) : (
              <span className="badge badge-sm badge-success">Caught up</span>
            ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="join" role="group" aria-label={`Episodes watched of ${anime.canonicalTitle}`}>
          <button
            type="button"
            className="btn btn-sm join-item"
            disabled={progress <= 0}
            onClick={() => setProgress(anime.id, progress - 1, total)}
            aria-label="One episode less"
          >
            −
          </button>
          <span className="btn btn-sm join-item pointer-events-none min-w-16 tabular-nums no-animation">
            {progress} / {total ?? '?'}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-primary join-item"
            disabled={atEnd}
            onClick={() => increment(anime.id, total)}
            aria-label="One episode more"
          >
            +
          </button>
        </div>

        <div className="dropdown dropdown-end">
          <button type="button" tabIndex={0} className="btn btn-sm btn-ghost btn-square" aria-label={`More actions for ${anime.canonicalTitle}`}>
            ⋮
          </button>
          <ul tabIndex={0} className="menu dropdown-content menu-sm z-30 mt-1 w-48 rounded-box bg-base-100 p-1 shadow-lg">
            <li>
              <button type="button" onClick={menuAction(() => setStatus(anime.id, 'completed', total))}>
                ✓ Mark completed
              </button>
            </li>
            <li>
              <button type="button" onClick={menuAction(() => toggleFavorite(anime.id))}>
                {favorited ? '♥ Unfavorite' : '♡ Favorite'}
              </button>
            </li>
            <li>
              <button type="button" className="text-error" onClick={menuAction(() => remove(anime.id))}>
                ✕ Remove
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
