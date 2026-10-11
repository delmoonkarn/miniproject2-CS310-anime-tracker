import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Anime, Page } from '../types/kitsu';
import { AnimeCard } from './AnimeCard';
import { CardGridSkeleton, EmptyState, ErrorState, GRID_CLASSES } from './States';

interface Props {
  query: UseQueryResult<Page<Anime>>;
  /** Show only part of the result (client-side paging of trending). */
  slice?: [number, number];
  highlight?: boolean;
  empty: ReactNode;
}

/** Loading → skeleton, error → retry, no items → empty state, otherwise the card grid. */
export function AnimeQueryGrid({ query, slice, highlight, empty }: Props) {
  if (query.isPending) return <CardGridSkeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const items = slice ? query.data.items.slice(...slice) : query.data.items;
  if (items.length === 0) return <EmptyState title="Nothing here">{empty}</EmptyState>;

  return (
    <div className={`${GRID_CLASSES} ${query.isFetching ? 'opacity-60 transition-opacity' : ''}`}>
      {items.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} highlight={highlight} />
      ))}
    </div>
  );
}
