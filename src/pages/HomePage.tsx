import { useQuery } from '@tanstack/react-query';
import { trendingQuery } from '../api/queries';
import { AnimeCard } from '../components/AnimeCard';
import { PageHeader } from '../components/PageHeader';
import { CardGridSkeleton, EmptyState, ErrorState, GRID_CLASSES } from '../components/States';

/** Home: Kitsu's trending list, in Kitsu's order. No search or filters; those live on Explore. */
export function HomePage() {
  const query = useQuery(trendingQuery());

  return (
    <section>
      <PageHeader title="Trending now" description="What the Kitsu community is watching right now." />
      {query.isPending ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState title="No results">No trending anime right now.</EmptyState>
      ) : (
        <div className={GRID_CLASSES}>
          {query.data.items.map((a) => (
            <AnimeCard key={a.id} anime={a} highlight />
          ))}
        </div>
      )}
    </section>
  );
}
