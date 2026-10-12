import { Link } from 'react-router';
import { WATCH_STATUSES, useLibraryStore, type WatchStatus } from '../store/useLibraryStore';
import { ANIME_STATUS_LABEL, WATCH_STATUS_LABEL, formatEpisodes, posterUrl } from '../lib/format';
import { FORMAT_LABEL } from '../lib/discover';
import type { Anime } from '../types/kitsu';
import { Icon, type IconName } from './Icon';
import { Poster } from './Poster';
import { ServiceLogo } from './ServiceLogo';
import { useWatchLinks } from '../store/selectors';

/** Logos on a poster; more would cover the artwork. */
const MAX_CARD_LOGOS = 4;

const STATUS_ICON: Record<WatchStatus, IconName> = { watching: 'play', interested: 'bookmark', completed: 'check' };

/** `highlight` outlines the card when the show is already in the user's collection. */
export function AnimeCard({ anime, highlight = false }: { anime: Anime; highlight?: boolean }) {
  const entry = useLibraryStore((s) => s.entries[anime.id]);
  const favorited = useLibraryStore((s) => s.favoriteIds.includes(anime.id));
  const { setStatus, remove, toggleFavorite } = useLibraryStore.getState();
  const owned = highlight && entry !== undefined;
  const watchLinks = useWatchLinks(anime.id);

  return (
    <article
      className={`group surface flex flex-col overflow-hidden transition-shadow hover:shadow-lg hover:shadow-base-content/5 ${
        owned ? 'border-primary/60 ring-1 ring-primary/40' : ''
      }`}
    >
      <div className="relative">
        <Link to={`/anime/${anime.id}`} className="block overflow-hidden" tabIndex={-1} aria-hidden>
          <Poster
            src={posterUrl(anime)}
            title={anime.canonicalTitle}
            className="aspect-[2/3] w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-end p-2">
          <button
            type="button"
            className={`pointer-events-auto grid size-8 place-items-center rounded-full backdrop-blur-sm transition-colors ${
              favorited ? 'bg-secondary text-secondary-content' : 'bg-black/45 text-white hover:bg-black/65'
            }`}
            aria-pressed={favorited}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => toggleFavorite(anime.id)}
          >
            <Icon name="heart" filled={favorited} className="size-4" />
          </button>
        </div>
        {watchLinks.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {watchLinks.slice(0, MAX_CARD_LOGOS).map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[22%] shadow-md ring-1 ring-black/20 transition-transform hover:scale-110"
                aria-label={`Watch ${anime.canonicalTitle} on ${l.label}`}
                title={`Watch on ${l.label}`}
              >
                <ServiceLogo url={l.url} label={l.label} className="size-7" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="text-sm leading-snug font-semibold">
          <Link to={`/anime/${anime.id}`} className="line-clamp-2 hover:text-primary">
            {anime.canonicalTitle}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-base-content/60">
          <span>{FORMAT_LABEL[anime.subtype] ?? anime.subtype}</span>
          <span aria-hidden>·</span>
          <span>{formatEpisodes(anime)}</span>
          <span aria-hidden>·</span>
          <span className={anime.status === 'current' ? 'font-medium text-success' : ''}>{ANIME_STATUS_LABEL[anime.status]}</span>
        </p>

        {/* Opens upward so the next row of cards can't cover it. */}
        <div className="dropdown dropdown-top mt-auto pt-2">
          <button
            type="button"
            tabIndex={0}
            className={`btn btn-sm btn-block justify-between ${entry ? 'btn-soft btn-primary' : 'btn-outline border-base-300 hover:border-primary hover:bg-primary hover:text-primary-content'}`}
            aria-label={`Collection options for ${anime.canonicalTitle}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name={entry ? STATUS_ICON[entry.status] : 'plus'} className="size-3.5" />
              {entry ? WATCH_STATUS_LABEL[entry.status] : 'Add to list'}
            </span>
            <Icon name="chevronDown" className="size-3.5 opacity-60" />
          </button>
          <ul tabIndex={0} className="menu dropdown-content menu-sm surface z-30 mb-1 w-full p-1 shadow-lg">
            {WATCH_STATUSES.map((s) => (
              <li key={s}>
                {/* Blurring closes DaisyUI's focus-based dropdown after a pick. */}
                <button
                  type="button"
                  className={entry?.status === s ? 'menu-active' : ''}
                  onClick={(e) => {
                    setStatus(anime.id, s, anime.episodeCount);
                    e.currentTarget.blur();
                  }}
                >
                  <Icon name={STATUS_ICON[s]} className="size-3.5" />
                  {WATCH_STATUS_LABEL[s]}
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
                  <Icon name="x" className="size-3.5" />
                  Remove
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </article>
  );
}
