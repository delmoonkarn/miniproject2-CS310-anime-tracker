import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { relatedQuery } from '../api/queries';
import { FORMAT_LABEL } from '../lib/discover';
import { ANIME_STATUS_LABEL, posterUrl } from '../lib/format';
import { RELATION_LABEL, groupRelated } from '../lib/relations';
import type { RelatedAnime as Related } from '../types/kitsu';
import { Icon } from './Icon';
import { Poster } from './Poster';
import { ErrorState } from './States';

const GRID = 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3';
/** "Also in this series" items shown before "Show all". */
const OTHER_PREVIEW = 6;

/** Detail page: prequels and sequels, then other related shows (side stories, spin-offs, recaps…). */
export function RelatedAnimeSection({ animeId }: { animeId: number }) {
  const query = useQuery(relatedQuery(animeId));

  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="mb-3 text-lg font-semibold">
        Prequel &amp; sequel
      </h2>
      {query.isPending ? (
        <div className={GRID} aria-busy="true" aria-label="Loading related shows">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="surface flex items-center gap-3 p-2">
              <div className="skeleton h-16 w-11 shrink-0" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <RelatedLists items={query.data} />
      )}
    </section>
  );
}

function RelatedLists({ items }: { items: readonly Related[] }) {
  const { storyLine, other } = groupRelated(items);
  const [showAll, setShowAll] = useState(false);
  const visibleOther = showAll ? other : other.slice(0, OTHER_PREVIEW);

  return (
    <div className="flex flex-col gap-4">
      {storyLine.length > 0 ? (
        <ul className={GRID}>
          {storyLine.map((r) => (
            <li key={r.anime.id}>
              <RelatedCard related={r} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-base-content/60">Kitsu lists no prequel or sequel for this show.</p>
      )}
      {other.length > 0 && (
        <div>
          <h3 className="eyebrow mb-2">Also in this series</h3>
          <ul className={GRID}>
            {visibleOther.map((r) => (
              <li key={r.anime.id}>
                <RelatedCard related={r} />
              </li>
            ))}
          </ul>
          {other.length > OTHER_PREVIEW && (
            <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
              <Icon name="chevronDown" className={`size-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
              {showAll ? 'Show less' : `Show all ${other.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Small horizontal card: thumbnail, relation tag, title, format · year · status. */
function RelatedCard({ related: { role, anime } }: { related: Related }) {
  const storyLine = role === 'prequel' || role === 'sequel';
  return (
    <Link
      to={`/anime/${anime.id}`}
      className="surface group flex items-center gap-3 p-2 transition-colors hover:border-primary/50"
    >
      <Poster src={posterUrl(anime, 'small')} title={anime.canonicalTitle} className="h-16 w-11 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-full px-1.5 py-px text-[0.625rem] font-semibold uppercase tracking-wide ${
            storyLine ? 'bg-primary/15 text-primary' : 'bg-base-300/70 text-base-content/60'
          }`}
        >
          {RELATION_LABEL[role]}
        </span>
        <p className="mt-0.5 truncate text-sm font-medium group-hover:text-primary" title={anime.canonicalTitle}>
          {anime.canonicalTitle}
        </p>
        <p className="truncate text-xs text-base-content/60">
          {FORMAT_LABEL[anime.subtype] ?? anime.subtype}
          {anime.startDate && ` · ${anime.startDate.slice(0, 4)}`} · {ANIME_STATUS_LABEL[anime.status]}
        </p>
      </div>
      <Icon name="chevronLeft" className="size-4 shrink-0 rotate-180 text-base-content/30 group-hover:text-primary" />
    </Link>
  );
}
