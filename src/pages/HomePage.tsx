import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { seasonTopQuery, trendingQuery } from '../api/queries';
import { AnimeCard } from '../components/AnimeCard';
import { Icon } from '../components/Icon';
import { CardGridSkeleton, CardSkeleton, EmptyState, ErrorState, GRID_CLASSES } from '../components/States';
import { SEASON_LABEL, currentSeason } from '../lib/season';

function SectionHeading({ title, description, action }: { title: ReactNode; description: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <p className="text-sm text-base-content/60">{description}</p>
      </div>
      {action}
    </div>
  );
}

/** One horizontally scrolling row of cards. */
const ROW_CLASSES = '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:thin] sm:gap-4';
const ROW_ITEM = 'w-40 shrink-0 snap-start sm:w-44 lg:w-48';

/** Home: the current season's most popular shows in one row, then Kitsu's overall trending list. */
export function HomePage() {
  const now = currentSeason();
  const season = useQuery(seasonTopQuery(now.season, now.year));
  const trending = useQuery(trendingQuery());

  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">Home</h1>

      <section aria-labelledby="season-heading">
        <SectionHeading
          title={
            <span id="season-heading" className="flex items-center gap-2">
              Trending this season
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold">
                <Icon name="sparkle" filled className="size-3" />
                {SEASON_LABEL[now.season]} {now.year}
              </span>
            </span>
          }
          description="The most popular shows that started this season."
          action={
            <Link to="/explore" className="btn btn-ghost btn-sm">
              See all
              <Icon name="chevronLeft" className="size-3.5 rotate-180" />
            </Link>
          }
        />
        {season.isPending ? (
          <div className={ROW_CLASSES} aria-busy="true" aria-label="Loading">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={ROW_ITEM}>
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : season.isError ? (
          <ErrorState error={season.error} onRetry={() => void season.refetch()} />
        ) : season.data.items.length === 0 ? (
          <EmptyState title="Nothing listed yet">Kitsu has no shows for this season yet.</EmptyState>
        ) : (
          <ul className={ROW_CLASSES}>
            {season.data.items.map((a) => (
              <li key={a.id} className={`${ROW_ITEM} flex *:w-full`}>
                <AnimeCard anime={a} highlight />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="trending-heading">
        <SectionHeading
          title={<span id="trending-heading">Trending now</span>}
          description="What the Kitsu community is watching right now, across all years."
        />
        {trending.isPending ? (
          <CardGridSkeleton />
        ) : trending.isError ? (
          <ErrorState error={trending.error} onRetry={() => void trending.refetch()} />
        ) : trending.data.items.length === 0 ? (
          <EmptyState title="No results">No trending anime right now.</EmptyState>
        ) : (
          <div className={GRID_CLASSES}>
            {trending.data.items.map((a) => (
              <AnimeCard key={a.id} anime={a} highlight />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
