import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { airingQuery, seasonQuery } from '../api/queries';
import { DiscoverFilterBar, DiscoverResults, ServiceFilter, useDiscoverFilters } from '../components/DiscoverResults';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { SEASONS, SEASON_LABEL, currentSeason, isSeason, nextSeason, seasonStart, type Season } from '../lib/season';

const MIN_YEAR = 1960;

/** Explore (items page): discover anime by season, with title search and format filters. */
export function ExplorePage() {
  // Season and year live in the URL: /explore?season=fall&year=2026 (season=all → whole year).
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
  const filters = useDiscoverFilters();

  const select = (s: Season | null, y: number) => setParams({ season: s ?? 'all', year: String(y) });
  const years: number[] = [];
  for (let y = now.year + 2; y >= MIN_YEAR; y--) years.push(y);

  return (
    <section>
      <PageHeader
        title={
          <>
            {season ? `${SEASON_LABEL[season]} ${year}` : `All of ${year}`}
            {isCurrent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold" title="Current season">
                <Icon name="sparkle" filled className="size-3" />
                Now
              </span>
            )}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
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
          <select className="select select-sm w-auto" aria-label="Year" value={year} onChange={(e) => select(season, Number(e.target.value))}>
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
          <ServiceFilter query={query} continuing={continuing} filters={filters} />
          <span className="mx-1 hidden h-5 border-l border-base-300 sm:block" aria-hidden />
          <DiscoverFilterBar query={query} continuing={continuing} filters={filters} />
        </div>
      </PageHeader>
      <DiscoverResults query={query} continuing={continuing} filters={filters} emptyText="Kitsu has no anime listed for this season." />
    </section>
  );
}
