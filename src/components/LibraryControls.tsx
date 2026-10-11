import { WATCH_STATUSES, isWatchStatus, useLibraryStore } from '../store/useLibraryStore';
import { WATCH_STATUS_LABEL } from '../lib/format';

/** Status select, progress stepper and favorite toggle for one show. `total` is the episode count when known. */
export function LibraryControls({ id, total }: { id: number; total: number | null }) {
  const entry = useLibraryStore((s) => s.entries[id]);
  const isFavorite = useLibraryStore((s) => s.favoriteIds.includes(id));
  const { setStatus, setProgress, increment, toggleFavorite, remove } = useLibraryStore.getState();

  const progress = entry?.progress ?? 0;
  const atEnd = total !== null && progress >= total;

  return (
    <div className="card bg-base-200">
      <div className="card-body gap-4 p-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">My status</span>
          <select
            className="select w-full"
            value={entry?.status ?? ''}
            onChange={(e) => (isWatchStatus(e.target.value) ? setStatus(id, e.target.value) : remove(id))}
          >
            <option value="">Not in collection</option>
            {WATCH_STATUSES.map((s) => (
              <option key={s} value={s}>
                {WATCH_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold" id={`progress-${id}`}>
            Episodes watched
          </span>
          <div className="join" aria-labelledby={`progress-${id}`}>
            <button
              type="button"
              className="btn join-item"
              disabled={!entry || progress <= 0}
              onClick={() => setProgress(id, progress - 1, total)}
              aria-label="One episode less"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              max={total ?? undefined}
              className="input join-item w-20 text-center"
              value={progress}
              disabled={!entry}
              onChange={(e) => setProgress(id, Number(e.target.value) || 0, total)}
              aria-label="Episodes watched"
            />
            <button
              type="button"
              className="btn join-item"
              disabled={!entry || atEnd}
              onClick={() => increment(id, total)}
              aria-label="One episode more"
            >
              +
            </button>
            <span className="btn join-item no-animation pointer-events-none">/ {total ?? '?'}</span>
          </div>
          {!entry && <span className="text-xs text-base-content/60">Pick a status to track progress.</span>}
        </div>

        <button
          type="button"
          className={`btn ${isFavorite ? 'btn-secondary' : 'btn-outline'}`}
          aria-pressed={isFavorite}
          onClick={() => toggleFavorite(id)}
        >
          {isFavorite ? '♥ Favorite' : '♡ Add to favorites'}
        </button>
      </div>
    </div>
  );
}
