import { Link } from 'react-router';
import { useLibraryStore, type WatchStatus } from '../store/useLibraryStore';
import { ANIME_STATUS_LABEL, WATCH_STATUS_LABEL, formatEpisodes, formatRating, posterUrl } from '../lib/format';
import type { Anime } from '../types/kitsu';
import { Poster } from './Poster';

/** Quick picks on the card; "Completed" is set on the Detail page. */
const CARD_STATUSES: readonly WatchStatus[] = ['watching', 'interested'];

/** `highlight` outlines the card when the show is already in the user's collection. */
export function AnimeCard({ anime, highlight = false }: { anime: Anime; highlight?: boolean }) {
  const entry = useLibraryStore((s) => s.entries[anime.id]);
  const favorited = useLibraryStore((s) => s.favoriteIds.includes(anime.id));
  const { setStatus, remove, toggleFavorite } = useLibraryStore.getState();
  const owned = highlight && entry !== undefined;

  return (
    <article className={`card bg-base-200 shadow-sm ${owned ? 'ring-2 ring-primary' : ''}`}>
      <Link to={`/anime/${anime.id}`} className="relative block">
        <Poster src={posterUrl(anime)} title={anime.canonicalTitle} className="aspect-[2/3] w-full rounded-t-box" />
        {owned && <span className="badge badge-primary absolute top-2 left-2">In collection</span>}
      </Link>
      <div className="card-body gap-2 p-4">
        <h3 className="card-title text-base leading-snug">
          <Link to={`/anime/${anime.id}`} className="link-hover line-clamp-2">
            {anime.canonicalTitle}
          </Link>
        </h3>
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="badge badge-sm badge-ghost" title="Average rating">
            ★ {formatRating(anime.averageRating)}
          </span>
          <span className="badge badge-sm badge-ghost">{formatEpisodes(anime)}</span>
          <span className={`badge badge-sm ${anime.status === 'current' ? 'badge-success' : 'badge-ghost'}`}>
            {ANIME_STATUS_LABEL[anime.status]}
          </span>
        </div>
        <div className="card-actions mt-auto flex-nowrap pt-1">
          {/* Opens upward so the next row of cards can't cover it. */}
          <div className="dropdown dropdown-top flex-1">
            <button
              type="button"
              tabIndex={0}
              className={`btn btn-sm btn-block ${entry ? 'btn-success btn-soft' : 'btn-primary'}`}
              aria-label={`Collection options for ${anime.canonicalTitle}`}
            >
              {entry ? `✓ ${WATCH_STATUS_LABEL[entry.status]}` : '+ Add'} ▾
            </button>
            <ul tabIndex={0} className="menu dropdown-content menu-sm z-30 mb-1 w-full rounded-box bg-base-100 p-1 shadow-lg">
              {CARD_STATUSES.map((s) => (
                <li key={s}>
                  {/* Blurring closes DaisyUI's focus-based dropdown after a pick. */}
                  <button
                    type="button"
                    className={entry?.status === s ? 'menu-active' : ''}
                    onClick={(e) => {
                      setStatus(anime.id, s);
                      e.currentTarget.blur();
                    }}
                  >
                    {s === 'watching' ? '▶' : '🔖'} {WATCH_STATUS_LABEL[s]}
                  </button>
                </li>
              ))}
              {entry && (
                <li>
                  <button
                    type="button"
                    className="text-error"
                    onClick={(e) => {
                      remove(anime.id);
                      e.currentTarget.blur();
                    }}
                  >
                    ✕ Remove
                  </button>
                </li>
              )}
            </ul>
          </div>
          <button
            type="button"
            className={`btn btn-sm btn-square ${favorited ? 'btn-secondary' : 'btn-ghost border-base-300'}`}
            aria-pressed={favorited}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => toggleFavorite(anime.id)}
          >
            {favorited ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </article>
  );
}
