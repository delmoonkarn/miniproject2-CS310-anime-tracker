import { useQuery } from '@tanstack/react-query';
import { relatedQuery } from '../api/queries';
import { RELATION_LABEL, groupRelated } from '../lib/relations';
import type { RelatedAnime as Related } from '../types/kitsu';
import { AnimeCard } from './AnimeCard';
import { CARD_ROW_CLASSES, CARD_ROW_ITEM, CardSkeleton, ErrorState } from './States';

/** Detail page: prequels and sequels, then other related shows (side stories, spin-offs, recaps…). */
export function RelatedAnimeSection({ animeId }: { animeId: number }) {
  const query = useQuery(relatedQuery(animeId));

  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="mb-3 text-lg font-semibold">
        Prequel &amp; sequel
      </h2>
      {query.isPending ? (
        <div className={CARD_ROW_CLASSES} aria-busy="true" aria-label="Loading related shows">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={CARD_ROW_ITEM}>
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <RelatedRows items={query.data} />
      )}
    </section>
  );
}

function RelatedRows({ items }: { items: readonly Related[] }) {
  const { storyLine, other } = groupRelated(items);
  return (
    <div className="flex flex-col gap-5">
      {storyLine.length > 0 ? (
        <CardRow items={storyLine} />
      ) : (
        <p className="text-sm text-base-content/60">Kitsu lists no prequel or sequel for this show.</p>
      )}
      {other.length > 0 && (
        <div>
          <h3 className="eyebrow mb-2">Also in this series</h3>
          <CardRow items={other} />
        </div>
      )}
    </div>
  );
}

function CardRow({ items }: { items: readonly Related[] }) {
  return (
    <ul className={CARD_ROW_CLASSES}>
      {items.map(({ role, anime }) => (
        <li key={anime.id} className={`${CARD_ROW_ITEM} flex flex-col gap-1.5`}>
          <span className={`w-fit rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${role === 'prequel' || role === 'sequel' ? 'bg-primary/15 text-primary' : 'bg-base-300/70 text-base-content/70'}`}>
            {RELATION_LABEL[role]}
            {anime.startDate && <span className="font-normal opacity-70"> · {anime.startDate.slice(0, 4)}</span>}
          </span>
          <div className="flex flex-1 *:w-full">
            <AnimeCard anime={anime} highlight />
          </div>
        </li>
      ))}
    </ul>
  );
}
