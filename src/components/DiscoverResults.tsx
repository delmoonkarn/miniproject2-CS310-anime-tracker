import { Fragment, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Anime, AnimeSubtype, Page } from '../types/kitsu';
import { FORMAT_LABEL, countFormats, groupIntoSections, matchesTitle } from '../lib/discover';
import { AnimeCard } from './AnimeCard';
import { Icon } from './Icon';
import { CardGridSkeleton, EmptyState, ErrorState, GRID_CLASSES } from './States';
import { pillClass as pill } from './pill';

// ---------- filter state ----------

export interface DiscoverFilters {
  search: string;
  formats: AnimeSubtype[];
  continuingOnly: boolean;
  setSearch: (search: string) => void;
  toggleFormat: (format: AnimeSubtype) => void;
  toggleContinuing: () => void;
  clear: () => void;
}

/** Search + format state, owned by the page so the controls and the grid can sit in different places. */
export function useDiscoverFilters(): DiscoverFilters {
  const [search, setSearch] = useState('');
  const [formats, setFormats] = useState<AnimeSubtype[]>([]);
  const [continuingOnly, setContinuingOnly] = useState(false);
  return {
    search,
    formats,
    continuingOnly,
    setSearch,
    toggleFormat: (f) => setFormats((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f])),
    toggleContinuing: () => setContinuingOnly((v) => !v),
    clear: () => {
      setFormats([]);
      setContinuingOnly(false);
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

/** Title search and format pills. The pills appear once the list has loaded. */
export function DiscoverFilterBar({ query, continuing = [], filters }: Props) {
  const { items, extra } = splitItems(query, continuing);
  const all = [...items, ...extra];
  const { search, formats, continuingOnly } = filters;

  // Counts follow the search but not the format filter, so each pill says what it would show.
  const counts = countFormats(all.filter((a) => matchesTitle(a, search)));
  const continuingCount = extra.filter((a) => matchesTitle(a, search)).length;

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
          {(formats.length > 0 || continuingOnly) && (
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
  if (query.isPending) return <CardGridSkeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const { items, extra } = splitItems(query, continuing);
  if (items.length === 0 && extra.length === 0) return <EmptyState title="No results">{emptyText}</EmptyState>;

  const { search, formats, continuingOnly } = filters;
  const keep = (a: Anime) => matchesTitle(a, search) && (formats.length === 0 || formats.includes(a.subtype));
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
