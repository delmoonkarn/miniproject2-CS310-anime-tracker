import { WATCH_STATUSES, isWatchStatus, useLibraryStore } from '../store/useLibraryStore';
import { WATCH_STATUS_LABEL } from '../lib/format';
import { Icon } from './Icon';

/** Status select, progress stepper and favorite toggle for one show. `total` is the episode count when known. */
export function LibraryControls({ id, total }: { id: number; total: number | null }) {
  const entry = useLibraryStore((s) => s.entries[id]);
  const isFavorite = useLibraryStore((s) => s.favoriteIds.includes(id));
  const { setStatus, setProgress, increment, toggleFavorite, remove } = useLibraryStore.getState();

  const progress = entry?.progress ?? 0;
  const atEnd = total !== null && progress >= total;
  const percent = total ? Math.round((progress / total) * 100) : null;

  return (
    <section className="surface flex flex-col gap-4 p-4" aria-label="My tracking">
      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">My status</span>
        <select
          className="select select-sm w-full"
          value={entry?.status ?? ''}
          onChange={(e) => (isWatchStatus(e.target.value) ? setStatus(id, e.target.value, total) : remove(id))}
        >
          <option value="">Not in my list</option>
          {WATCH_STATUSES.map((s) => (
            <option key={s} value={s}>
              {WATCH_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow" id={`progress-${id}`}>
            Episodes watched
          </span>
          {entry && percent !== null && <span className="text-xs text-base-content/60 tabular-nums">{percent}%</span>}
        </div>
        <div className="join w-full" aria-labelledby={`progress-${id}`}>
          <button
            type="button"
            className="btn btn-sm join-item"
            disabled={!entry || progress <= 0}
            onClick={() => setProgress(id, progress - 1, total)}
            aria-label="One episode less"
          >
            <Icon name="minus" className="size-3.5" />
          </button>
          <input
            type="number"
            min={0}
            max={total ?? undefined}
            className="input input-sm join-item min-w-0 flex-1 text-center tabular-nums"
            value={progress}
            disabled={!entry}
            onChange={(e) => setProgress(id, Number(e.target.value) || 0, total)}
            aria-label="Episodes watched"
          />
          <span className="join-item flex items-center border border-base-300 bg-base-200 px-3 text-sm text-base-content/60 tabular-nums">
            / {total ?? '?'}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-primary join-item"
            disabled={!entry || atEnd}
            onClick={() => increment(id, total)}
            aria-label="One episode more"
          >
            <Icon name="plus" className="size-3.5" />
          </button>
        </div>
        {entry && percent !== null && (
          <progress className="progress progress-primary h-1.5 w-full" value={progress} max={total ?? undefined} aria-hidden />
        )}
        {!entry && <span className="text-xs text-base-content/50">Pick a status to track progress.</span>}
      </div>

      <button
        type="button"
        className={`btn btn-sm ${isFavorite ? 'btn-secondary' : 'btn-outline border-base-300'}`}
        aria-pressed={isFavorite}
        onClick={() => toggleFavorite(id)}
      >
        <Icon name="heart" filled={isFavorite} className="size-3.5" />
        {isFavorite ? 'In favorites' : 'Add to favorites'}
      </button>
    </section>
  );
}
