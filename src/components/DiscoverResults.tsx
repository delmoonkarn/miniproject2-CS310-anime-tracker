import { Fragment, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Anime, AnimeSubtype, Page } from '../types/kitsu';
import { FORMAT_LABEL, countFormats, groupIntoSections, matchesTitle } from '../lib/discover';
import { AnimeCard } from './AnimeCard';
import { Icon } from './Icon';
import { CardGridSkeleton, EmptyState, ErrorState, GRID_CLASSES } from './States';

const pill = (active: boolean, tone: 'primary' | 'info' = 'primary') =>
  `inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
    active
      ? tone === 'info'
        ? 'border-info/50 bg-info/15 text-info'
        : 'border-primary/50 bg-primary/10 text-primary'
      : 'border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/30 hover:text-base-content'
  }`;

interface Props {
  query: UseQueryResult<Page<Anime>>;
  /** Long-runners from earlier seasons, shown as a "Continuing" block at the end. */
  continuing?: readonly Anime[];
  emptyText: string;
}

/** Format pills, in-page title search and the grid grouped into format blocks. Filtering is client-side. */
export function DiscoverResults({ query, continuing = [], emptyText }: Props) {
  const [search, setSearch] = useState('');
  const [formats, setFormats] = useState<AnimeSubtype[]>([]);
  const [continuingOnly, setContinuingOnly] = useState(false);

  if (query.isPending) return <CardGridSkeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const items = query.data.items;
  const mainIds = new Set(items.map((a) => a.id));
  const extra = continuing.filter((a) => !mainIds.has(a.id));
  if (items.length === 0 && extra.length === 0) return <EmptyState title="No results">{emptyText}</EmptyState>;

  const keep = (a: Anime) => matchesTitle(a, search) && (formats.length === 0 || formats.includes(a.subtype));
  const visibleMain = continuingOnly ? [] : items.filter(keep);
  const visibleContinuing = extra.filter(keep);
  const sections = groupIntoSections(visibleMain, visibleContinuing);

  // Counts follow the search but not the format filter, so each pill says what it would show.
  const counts = countFormats([...items, ...extra].filter((a) => matchesTitle(a, search)));
  const continuingCount = extra.filter((a) => matchesTitle(a, search)).length;
  const toggleFormat = (f: AnimeSubtype) =>
    setFormats((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  return (
    <div className={query.isFetching ? 'opacity-60 transition-opacity' : ''}>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="input input-sm w-full lg:max-w-xs">
          <Icon name="search" className="size-4 opacity-50" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${items.length + extra.length} title${items.length + extra.length === 1 ? '' : 's'}…`}
            aria-label="Filter these results by title"
          />
        </label>
        <div className="flex items-center gap-3">
          <span className="eyebrow">Format</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {counts.map(([f, n]) => (
              <button key={f} type="button" className={pill(formats.includes(f))} aria-pressed={formats.includes(f)} onClick={() => toggleFormat(f)}>
                {FORMAT_LABEL[f] ?? f} <span className="tabular-nums opacity-60">{n}</span>
              </button>
            ))}
            {continuingCount > 0 && (
              <button
                type="button"
                className={pill(continuingOnly, 'info')}
                aria-pressed={continuingOnly}
                onClick={() => setContinuingOnly((v) => !v)}
                title="Show only shows from earlier seasons that are still airing"
              >
                Continuing <span className="tabular-nums opacity-60">{continuingCount}</span>
              </button>
            )}
            {(formats.length > 0 || continuingOnly) && (
              <button
                type="button"
                className="btn btn-link btn-xs text-base-content/60 no-underline"
                onClick={() => {
                  setFormats([]);
                  setContinuingOnly(false);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="py-12 text-center text-sm text-base-content/60">
          {search.trim() ? `No titles match “${search.trim()}”.` : 'No titles match these filters.'}
        </p>
      ) : (
        <div className={GRID_CLASSES}>
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
      )}
    </div>
  );
}
