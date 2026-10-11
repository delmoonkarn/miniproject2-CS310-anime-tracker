import { Link } from 'react-router';
import { useCollectionIds } from '../../store/selectors';
import { useAnimeDetails } from '../../api/hooks';
import { AnimeCard } from '../../components/AnimeCard';
import { CardSkeleton, EmptyState, ErrorState, GRID_CLASSES } from '../../components/States';

type Kind = 'interested' | 'completed' | 'favorites';

const EMPTY_TEXT: Record<Kind, string> = {
  interested: 'Shows you add from Home or Explore land here.',
  completed: 'Mark a show as completed on its detail page.',
  favorites: 'Tap “Add to favorites” on any show’s page.',
};

export function CollectionGridTab({ kind }: { kind: Kind }) {
  const ids = useCollectionIds(kind);
  const queries = useAnimeDetails(ids);

  if (ids.length === 0) {
    return (
      <EmptyState title={`No ${kind} shows yet`}>
        <p>{EMPTY_TEXT[kind]}</p>
        <Link to="/explore" className="btn btn-primary btn-sm mt-3">
          Explore anime
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className={GRID_CLASSES}>
      {queries.map((q, i) => {
        if (q.isPending) return <CardSkeleton key={ids[i]} />;
        if (q.isError) return <ErrorState key={ids[i]} compact error={q.error} onRetry={() => void q.refetch()} />;
        return <AnimeCard key={q.data.id} anime={q.data} />;
      })}
    </div>
  );
}
