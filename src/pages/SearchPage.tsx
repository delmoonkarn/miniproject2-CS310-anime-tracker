import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { MIN_SEARCH_LENGTH, searchQuery } from '../api/queries';
import { AnimeCard } from '../components/AnimeCard';
import { PageHeader } from '../components/PageHeader';
import { CardGridSkeleton, EmptyState, ErrorState, GRID_CLASSES } from '../components/States';

/** /search?q=… — searches all of Kitsu. The query is typed into the navbar search box. */
export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const query = useQuery(searchQuery(q));

  if (q.length < MIN_SEARCH_LENGTH) {
    return (
      <section>
        <PageHeader title="Search" description="Search every anime on Kitsu by title, including English and Japanese titles." />
        <EmptyState title="Type at least two letters">
          <p>
            Use the search box at the top of the page, or press <kbd className="kbd kbd-sm">/</kbd> to jump to it.
          </p>
        </EmptyState>
      </section>
    );
  }

  const shown = query.data?.items.length ?? 0;
  const total = query.data?.total ?? null;
  let description: string | undefined;
  if (query.isPending) description = 'Searching Kitsu…';
  else if (query.isSuccess && shown > 0) {
    description =
      total !== null && total > shown
        ? `Top ${shown} of ${total.toLocaleString()} matches, most relevant first. Add more words to narrow it down.`
        : `${shown} match${shown === 1 ? '' : 'es'} on Kitsu.`;
  }

  return (
    <section>
      <PageHeader title={<>Results for “{q}”</>} description={description} />

      {query.isPending ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : shown === 0 ? (
        <EmptyState title={`Nothing found for “${q}”`}>
          <p>Check the spelling, or try the English or romaji title.</p>
          <Link to="/explore" className="btn btn-primary btn-sm mt-3">
            Browse this season
          </Link>
        </EmptyState>
      ) : (
        <div className={`${GRID_CLASSES} ${query.isFetching ? 'opacity-60 transition-opacity' : ''}`}>
          {query.data.items.map((a) => (
            <AnimeCard key={a.id} anime={a} highlight />
          ))}
        </div>
      )}
    </section>
  );
}
