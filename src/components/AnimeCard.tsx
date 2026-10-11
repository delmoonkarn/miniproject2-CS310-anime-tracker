import { Link } from 'react-router';
import { useLibraryStore } from '../store/useLibraryStore';
import { ANIME_STATUS_LABEL, WATCH_STATUS_LABEL, formatEpisodes, formatRating, posterUrl } from '../lib/format';
import type { Anime } from '../types/kitsu';
import { Poster } from './Poster';

/** `highlight` outlines the card when the show is already in the user's collection. */
export function AnimeCard({ anime, highlight = false }: { anime: Anime; highlight?: boolean }) {
  const entry = useLibraryStore((s) => s.entries[anime.id]);
  const add = useLibraryStore((s) => s.add);
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
        <div className="card-actions mt-auto pt-1">
          {entry ? (
            <Link to={`/anime/${anime.id}`} className="btn btn-sm btn-ghost btn-block">
              ✓ {WATCH_STATUS_LABEL[entry.status]}
            </Link>
          ) : (
            <button type="button" className="btn btn-sm btn-primary btn-block" onClick={() => add(anime.id)}>
              + Add to collection
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
