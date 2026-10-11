import type { ReactNode } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { NavLink, useParams, useSearchParams } from 'react-router';
import { airingQuery, seasonQuery, trendingQuery } from '../../api/queries';
import { DiscoverResults } from '../../components/DiscoverResults';
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
    <header className="mb-6 border-b border-base-300 pb-4">
      <nav aria-label="Explore views" className="flex flex-wrap gap-1">
        {VIEWS.map((v) => (
          <NavLink
            key={v.to}
            to={v.to}
            className={({ isActive }) =>
              `btn btn-xs tracking-wider uppercase ${isActive ? 'btn-primary btn-soft' : 'btn-ghost text-base-content/60'}`
            }
          >
            {v.label}
          </NavLink>
        ))}
      </nav>
      <h1 className="mt-0.5 flex items-center gap-2 text-2xl font-bold">
        {title}
        {sparkle && (
          <span className="text-warning" title="Current season">
            ✦
          </span>
        )}
      </h1>
      {subtitle && <p className="text-sm text-base-content/60">{subtitle}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {children}
        <button type="button" className="btn btn-sm" onClick={onRefresh} disabled={query.isFetching} title="Fetch fresh data from Kitsu">
          {query.isFetching ? <span className="loading loading-spinner loading-xs" /> : <span aria-hidden>↻</span>}
          <span className="hidden sm:inline">Refresh</span>
        </button>
        {query.isSuccess && !query.isFetching && (
          <span className="text-xs text-base-content/60">
            Updated {timeAgo(query.dataUpdatedAt)}
            {total !== null && total > shown && ` · top ${shown} of ${total}`}
          </span>
        )}
      </div>
    </header>
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
