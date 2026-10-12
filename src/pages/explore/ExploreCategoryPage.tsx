import type { ReactNode } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { NavLink, useParams, useSearchParams } from 'react-router';
import { airingQuery, seasonQuery, trendingQuery } from '../../api/queries';
import { DiscoverResults } from '../../components/DiscoverResults';
import { Icon } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';
import { timeAgo } from '../../lib/format';
import { SEASONS, SEASON_LABEL, currentSeason, isSeason, nextSeason, seasonStart, type Season } from '../../lib/season';
import type { Anime, Page } from '../../types/kitsu';
import { NotFoundPage } from '../NotFoundPage';

const MIN_YEAR = 1960;

const VIEWS = [
  { to: '/explore/season', label: 'Discover by season' },
  { to: '/explore/trending', label: 'Trending' },
] as const;

export function ExploreCategoryPage() {
  const { category } = useParams();
  if (category === 'season') return <SeasonExplore />;
  if (category === 'trending') return <TrendingExplore />;
  return <NotFoundPage title="Unknown category" message={`There is no “${category ?? ''}” category.`} />;
}

// ---------- header ----------

interface HeaderProps {
  title: string;
  sparkle?: boolean;
  subtitle?: string;
  query: UseQueryResult<Page<Anime>>;
  onRefresh: () => void;
  children?: ReactNode;
}

function ExploreHeader({ title, sparkle, subtitle, query, onRefresh, children }: HeaderProps) {
  const shown = query.data?.items.length ?? 0;
  const total = query.data?.total ?? null;
  return (
    <PageHeader
      eyebrow={
        <nav aria-label="Explore views" className="inline-flex rounded-field border border-base-300 bg-base-100 p-0.5">
          {VIEWS.map((v) => (
            <NavLink
              key={v.to}
              to={v.to}
              className={({ isActive }) =>
                `rounded-[calc(var(--radius-field)-2px)] px-3 py-1 text-xs font-semibold transition-colors ${
                  isActive ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/60 hover:text-base-content'
                }`
              }
            >
              {v.label}
            </NavLink>
          ))}
        </nav>
      }
      title={
        <>
          {title}
          {sparkle && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold" title="Current season">
              <Icon name="sparkle" filled className="size-3" />
              Now
            </span>
          )}
        </>
      }
      description={subtitle}
    >
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <button type="button" className="btn btn-sm btn-ghost" onClick={onRefresh} disabled={query.isFetching} title="Fetch fresh data from Kitsu">
          {query.isFetching ? <span className="loading loading-spinner loading-xs" /> : <Icon name="refresh" className="size-3.5" />}
          <span className="hidden sm:inline">Refresh</span>
        </button>
        {query.isSuccess && !query.isFetching && (
          <span className="text-xs text-base-content/50">
            Updated {timeAgo(query.dataUpdatedAt)}
            {total !== null && total > shown && ` · top ${shown} of ${total}`}
          </span>
        )}
      </div>
    </PageHeader>
  );
}

// ---------- by season ----------

function SeasonExplore() {
  // Season and year live in the URL: /explore/season?season=fall&year=2026 (season=all → whole year).
  const [params, setParams] = useSearchParams();
  const now = currentSeason();
  const next = nextSeason(now);
  const rawSeason = params.get('season');
  const season: Season | null = rawSeason === 'all' ? null : isSeason(rawSeason) ? rawSeason : now.season;
  const rawYear = Number(params.get('year'));
  const year = Number.isInteger(rawYear) && rawYear >= MIN_YEAR && rawYear <= now.year + 2 ? rawYear : now.year;
  const isCurrent = season === now.season && year === now.year;

  const query = useQuery(seasonQuery(season, year));
  // Shows from earlier seasons that are still airing.
  const airing = useQuery({ ...airingQuery(), enabled: isCurrent });
  const start = seasonStart(now);
  const continuing = isCurrent ? (airing.data?.items ?? []).filter((a) => a.startDate !== null && a.startDate < start) : [];

  const select = (s: Season | null, y: number) => setParams({ season: s ?? 'all', year: String(y) });
  const years: number[] = [];
  for (let y = now.year + 2; y >= MIN_YEAR; y--) years.push(y);

  return (
    <>
      <ExploreHeader
        title={season ? `${SEASON_LABEL[season]} ${year}` : `All of ${year}`}
        sparkle={isCurrent}
        query={query}
        onRefresh={() => {
          void query.refetch();
          if (isCurrent) void airing.refetch();
        }}
      >
        <select
          className="select select-sm w-auto"
          aria-label="Season"
          value={season ?? 'all'}
          onChange={(e) => select(isSeason(e.target.value) ? e.target.value : null, year)}
        >
          <option value="all">— All year —</option>
          {SEASONS.map((s) => (
            <option key={s} value={s}>
              {SEASON_LABEL[s]}
              {s === now.season && year === now.year ? ' · Now' : s === next.season && year === next.year ? ' · Next' : ''}
            </option>
          ))}
        </select>
        <select
          className="select select-sm w-auto"
          aria-label="Year"
          value={year}
          onChange={(e) => select(season, Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y === now.year ? `${y} ★` : y}
            </option>
          ))}
        </select>
        {!isCurrent && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => select(now.season, now.year)}>
            Today ({SEASON_LABEL[now.season]} {now.year})
          </button>
        )}
      </ExploreHeader>
      <DiscoverResults query={query} continuing={continuing} emptyText="Kitsu has no anime listed for this season." />
    </>
  );
}

// ---------- trending ----------

function TrendingExplore() {
  const query = useQuery(trendingQuery());
  return (
    <>
      <ExploreHeader
        title="Trending now"
        subtitle="What the Kitsu community is watching right now."
        query={query}
        onRefresh={() => void query.refetch()}
      />
      <DiscoverResults query={query} emptyText="No trending anime right now." />
    </>
  );
}
