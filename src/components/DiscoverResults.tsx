import { Fragment, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Anime, AnimeSubtype, Page } from '../types/kitsu';
import { FORMAT_LABEL, countFormats, groupIntoSections, matchesTitle } from '../lib/discover';
import { AnimeCard } from './AnimeCard';
import { Icon } from './Icon';
import { CardGridSkeleton, EmptyState, ErrorState, GRID_CLASSES } from './States';
import { pillClass as pill } from './pill';
import { ServiceLogo } from './ServiceLogo';
import { useServiceIndex } from '../store/selectors';

// ---------- filter state ----------

export interface DiscoverFilters {
  search: string;
  formats: AnimeSubtype[];
  continuingOnly: boolean;
  /** Streaming service names; a show passes if it is on any of them. */
  services: string[];
  setSearch: (search: string) => void;
  toggleFormat: (format: AnimeSubtype) => void;
  toggleContinuing: () => void;
  toggleService: (service: string) => void;
  clear: () => void;
}

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

/** Search, format and streaming-service state, owned by the page so the controls and the grid can sit in different places. */
export function useDiscoverFilters(): DiscoverFilters {
  const [search, setSearch] = useState('');
  const [formats, setFormats] = useState<AnimeSubtype[]>([]);
  const [continuingOnly, setContinuingOnly] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  return {
    search,
    formats,
    continuingOnly,
    services,
    setSearch,
    toggleFormat: (f) => setFormats((cur) => toggle(cur, f)),
    toggleContinuing: () => setContinuingOnly((v) => !v),
    toggleService: (s) => setServices((cur) => toggle(cur, s)),
    clear: () => {
      setFormats([]);
      setContinuingOnly(false);
      setServices([]);
    },
  };
}

/** The season's own shows plus the continuing ones that aren't already in it. */
function splitItems(query: UseQueryResult<Page<Anime>>, continuing: readonly Anime[]) {
  const items = query.data?.items ?? [];
  const mainIds = new Set(items.map((a) => a.id));
  return { items, extra: continuing.filter((a) => !mainIds.has(a.id)) };
}

interface Props {
  query: UseQueryResult<Page<Anime>>;
  /** Long-runners from earlier seasons, shown as a "Continuing" block at the end. */
  continuing?: readonly Anime[];
  filters: DiscoverFilters;
}

// ---------- controls ----------

/** Title search, format pills and streaming-service pills. The pills appear once the list has loaded. */
export function DiscoverFilterBar({ query, continuing = [], filters }: Props) {
  const index = useServiceIndex();
  const { items, extra } = splitItems(query, continuing);
  const all = [...items, ...extra];
  const { search, formats, continuingOnly, services } = filters;

  // Counts follow the search but not the other filters, so each pill says what it would show.
  const searched = all.filter((a) => matchesTitle(a, search));
  const counts = countFormats(searched);
  const continuingCount = extra.filter((a) => matchesTitle(a, search)).length;
  const serviceCounts = new Map<string, number>();
  for (const a of searched) for (const s of index.servicesOf(a.id)) serviceCounts.set(s, (serviceCounts.get(s) ?? 0) + 1);
  // A selected service stays visible even when the search hides all its shows, so it can be turned off.
  for (const s of services) if (!serviceCounts.has(s)) serviceCounts.set(s, 0);
  const serviceList = [...serviceCounts].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
  const anyFilter = formats.length > 0 || continuingOnly || services.length > 0;

  return (
    <>
      <label className="input input-sm w-full sm:w-60">
        <Icon name="search" className="size-4 opacity-50" />
        <input
          type="search"
          value={search}
          onChange={(e) => filters.setSearch(e.target.value)}
          aria-label="Filter these results by title"
        />
      </label>
      {counts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Format">
          {counts.map(([f, n]) => (
            <button key={f} type="button" className={pill(formats.includes(f))} aria-pressed={formats.includes(f)} onClick={() => filters.toggleFormat(f)}>
              {FORMAT_LABEL[f] ?? f} <span className="tabular-nums opacity-60">{n}</span>
            </button>
          ))}
          {continuingCount > 0 && (
            <button
              type="button"
              className={pill(continuingOnly, 'info')}
              aria-pressed={continuingOnly}
              onClick={filters.toggleContinuing}
              title="Show only shows from earlier seasons that are still airing"
            >
              Continuing <span className="tabular-nums opacity-60">{continuingCount}</span>
            </button>
          )}
          {anyFilter && serviceList.length === 0 && (
            <button type="button" className="btn btn-link btn-xs text-base-content/60 no-underline" onClick={filters.clear}>
              Clear
            </button>
          )}
        </div>
      )}
      {serviceList.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Streaming service">
          {serviceList.map(([s, n]) => {
            const logo = index.logoLink.get(s);
            return (
              <button
                key={s}
                type="button"
                className={pill(services.includes(s))}
                aria-pressed={services.includes(s)}
                onClick={() => filters.toggleService(s)}
                title={`Only shows on ${s}`}
              >
                {logo && <ServiceLogo url={logo.url} label={logo.label} className="-ml-1.5 size-5" />}
                {s} <span className="tabular-nums opacity-60">{n}</span>
              </button>
            );
          })}
          {anyFilter && (
            <button type="button" className="btn btn-link btn-xs text-base-content/60 no-underline" onClick={filters.clear}>
              Clear
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ---------- results ----------

/** The grid grouped into format blocks, filtered client-side by `filters`. */
export function DiscoverResults({ query, continuing = [], filters, emptyText }: Props & { emptyText: string }) {
  const index = useServiceIndex();
  if (query.isPending) return <CardGridSkeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const { items, extra } = splitItems(query, continuing);
  if (items.length === 0 && extra.length === 0) return <EmptyState title="No results">{emptyText}</EmptyState>;

  const { search, formats, continuingOnly, services } = filters;
  const keep = (a: Anime) =>
    matchesTitle(a, search) &&
    (formats.length === 0 || formats.includes(a.subtype)) &&
    (services.length === 0 || index.servicesOf(a.id).some((s) => services.includes(s)));
  const visibleMain = continuingOnly ? [] : items.filter(keep);
  const sections = groupIntoSections(visibleMain, extra.filter(keep));

  if (sections.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-base-content/60">
        {search.trim() ? `No titles match “${search.trim()}”.` : 'No titles match these filters.'}
      </p>
    );
  }

  return (
    <div className={`${GRID_CLASSES} ${query.isFetching ? 'opacity-60 transition-opacity' : ''}`}>
      {sections.map((s) => (
        <Fragment key={s.key}>
          {s.heading && (
            <div className="col-span-full mt-4 mb-1 flex items-center gap-3 first:mt-0">
              <h2 className="shrink-0 text-sm font-semibold">{s.heading}</h2>
              <div className="flex-1 border-t border-base-300" aria-hidden />
            </div>
          )}
          {s.items.map((a) => (
            <AnimeCard key={a.id} anime={a} highlight />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
