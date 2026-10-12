import { useState, type ReactNode } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { MIN_SEARCH_LENGTH, searchQuery, seasonQuery, trendingQuery } from '../api/queries';
import { useAnimeDetails } from '../api/hooks';
import { CAN_EDIT_PUBLISHED_LINKS, usePublishedLinks, useSavePublishedLinks } from '../api/publishedLinks';
import { Icon } from '../components/Icon';
import { LinkForm } from '../components/LinkForm';
import { PageHeader } from '../components/PageHeader';
import { Poster } from '../components/Poster';
import { ServiceLogo } from '../components/ServiceLogo';
import { EmptyState, ErrorState, RowSkeleton } from '../components/States';
import { FORMAT_LABEL, matchesTitle } from '../lib/discover';
import { ANIME_STATUS_LABEL, posterUrl } from '../lib/format';
import type { SharedLinkMap, SharedStreamLink } from '../lib/sharedLinks';
import { SEASONS, SEASON_LABEL, currentSeason, isSeason, type Season } from '../lib/season';
import type { Anime, Page } from '../types/kitsu';

const VIEWS = [
  { key: 'season', label: 'By season' },
  { key: 'trending', label: 'Trending' },
  { key: 'search', label: 'Search Kitsu' },
  { key: 'published', label: 'Has links' },
] as const;
type View = (typeof VIEWS)[number]['key'];
const isView = (v: unknown): v is View => VIEWS.some((x) => x.key === v);

const MIN_YEAR = 1960;

/**
 * /admin: edit the streaming links published with the app (src/data/streamLinks.json).
 * Shows come from the same Kitsu queries as Explore and Home, so lists are usually already cached.
 * Saving needs `npm run dev`; the deployed site shows this page read-only.
 */
export function AdminLinksPage() {
  const [params, setParams] = useSearchParams();
  const rawView = params.get('view');
  const view: View = isView(rawView) ? rawView : 'season';
  const published = usePublishedLinks();
  const save = useSavePublishedLinks();
  const [filter, setFilter] = useState('');
  const publishedCount = Object.keys(published).length;

  const setView = (v: View) => setParams({ view: v }, { replace: true });

  /** Replaces one show's links and saves the whole file. */
  const setLinks = (id: number, links: SharedStreamLink[]) => {
    const next: SharedLinkMap = { ...published };
    if (links.length > 0) next[id] = links;
    else delete next[id];
    save.mutate(next);
  };

  return (
    <section>
      <PageHeader
        title="Streaming links"
        description="Links published with the app. Everyone who opens the site sees them under Where to watch."
        actions={
          CAN_EDIT_PUBLISHED_LINKS && (
            <span className="text-xs text-base-content/60" aria-live="polite">
              {save.isPending ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="loading loading-spinner loading-xs" /> Saving…
                </span>
              ) : save.isSuccess ? (
                <span className="inline-flex items-center gap-1 text-success">
                  <Icon name="check" className="size-3.5" /> Saved to src/data/streamLinks.json
                </span>
              ) : null}
            </span>
          )
        }
      >
        <div className="flex flex-col gap-3">
          {CAN_EDIT_PUBLISHED_LINKS ? (
            <p className="text-xs text-base-content/60">
              Changes are written to <code className="font-mono">src/data/streamLinks.json</code> straight away. Commit and redeploy to publish them.
            </p>
          ) : (
            <div role="note" className="flex items-start gap-2 rounded-box border border-info/30 bg-info/5 p-3 text-sm">
              <Icon name="alert" className="mt-0.5 size-4 text-info" />
              <p>
                Read-only here. To edit, run <code className="font-mono">npm run dev</code> and open <code className="font-mono">/admin</code> locally,
                then commit and redeploy.
              </p>
            </div>
          )}
          {save.isError && (
            <div role="alert" className="flex flex-wrap items-center gap-2 rounded-box border border-error/30 bg-error/5 p-3 text-sm">
              <Icon name="alert" className="size-4 text-error" />
              <span className="flex-1">Not saved: {save.error.message}</span>
              <button type="button" className="btn btn-sm" onClick={() => save.reset()}>
                Dismiss
              </button>
            </div>
          )}
          <nav aria-label="Show list" className="inline-flex w-fit flex-wrap rounded-field border border-base-300 bg-base-100 p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                type="button"
                aria-pressed={view === v.key}
                onClick={() => setView(v.key)}
                className={`rounded-[calc(var(--radius-field)-2px)] px-3 py-1 text-xs font-semibold transition-colors ${
                  view === v.key ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/60 hover:text-base-content'
                }`}
              >
                {v.label}
                {v.key === 'published' && <span className="ml-1 tabular-nums opacity-70">{publishedCount}</span>}
              </button>
            ))}
          </nav>
        </div>
      </PageHeader>

      {view === 'season' && <SeasonList published={published} onChange={setLinks} filter={filter} setFilter={setFilter} />}
      {view === 'trending' && <TrendingList published={published} onChange={setLinks} filter={filter} setFilter={setFilter} />}
      {view === 'search' && <SearchList published={published} onChange={setLinks} />}
      {view === 'published' && <PublishedList published={published} onChange={setLinks} filter={filter} setFilter={setFilter} />}
    </section>
  );
}

interface ListProps {
  published: SharedLinkMap;
  onChange: (id: number, links: SharedStreamLink[]) => void;
}

interface FilterProps {
  filter: string;
  setFilter: (v: string) => void;
}

function TitleFilter({ filter, setFilter }: FilterProps) {
  return (
    <label className="input input-sm w-full sm:w-60">
      <Icon name="search" className="size-4 opacity-50" />
      <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter shows by title" />
    </label>
  );
}

// ---------- sources (same queries as Explore, Home and the navbar search) ----------

function SeasonList(props: ListProps & FilterProps) {
  const [params, setParams] = useSearchParams();
  const now = currentSeason();
  const rawSeason = params.get('season');
  const season: Season = isSeason(rawSeason) ? rawSeason : now.season;
  const rawYear = Number(params.get('year'));
  const year = Number.isInteger(rawYear) && rawYear >= MIN_YEAR && rawYear <= now.year + 2 ? rawYear : now.year;
  const query = useQuery(seasonQuery(season, year));
  const select = (s: Season, y: number) => setParams({ view: 'season', season: s, year: String(y) }, { replace: true });
  const years: number[] = [];
  for (let y = now.year + 2; y >= MIN_YEAR; y--) years.push(y);

  return (
    <QueryList
      {...props}
      query={query}
      controls={
        <>
          <select className="select select-sm w-auto" aria-label="Season" value={season} onChange={(e) => isSeason(e.target.value) && select(e.target.value, year)}>
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {SEASON_LABEL[s]}
              </option>
            ))}
          </select>
          <select className="select select-sm w-auto" aria-label="Year" value={year} onChange={(e) => select(season, Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </>
      }
    />
  );
}

function TrendingList(props: ListProps & FilterProps) {
  return <QueryList {...props} query={useQuery(trendingQuery())} />;
}

function SearchList({ published, onChange }: ListProps) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [text, setText] = useState(q);
  const query = useQuery(searchQuery(q.trim()));
  const ready = q.trim().length >= MIN_SEARCH_LENGTH;

  return (
    <>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ view: 'search', q: text.trim() }, { replace: true });
        }}
      >
        <label className="input input-sm w-full sm:w-80">
          <Icon name="search" className="size-4 opacity-50" />
          <input type="search" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search all anime on Kitsu" autoFocus />
        </label>
        <button type="submit" className="btn btn-primary btn-sm">
          Search
        </button>
      </form>
      {ready ? (
        <Rows query={query} published={published} onChange={onChange} filter="" />
      ) : (
        <EmptyState title="Search Kitsu">Type at least two letters and press Search. Shows the 20 best matches.</EmptyState>
      )}
    </>
  );
}

function PublishedList({ published, onChange, filter, setFilter }: ListProps & FilterProps) {
  const ids = Object.keys(published).map(Number);
  const details = useAnimeDetails(ids);
  if (ids.length === 0) {
    return <EmptyState title="No published links yet">Pick a show in another tab and add its first link.</EmptyState>;
  }
  return (
    <>
      <div className="mb-4">
        <TitleFilter filter={filter} setFilter={setFilter} />
      </div>
      <ul className="flex flex-col gap-3">
        {details.map((d, i) => {
          const id = ids[i] ?? 0;
          if (d.isPending) return <li key={id}><RowSkeleton /></li>;
          if (d.isError) {
            return (
              <li key={id}>
                <ErrorState compact error={d.error} onRetry={() => void d.refetch()} />
              </li>
            );
          }
          if (!matchesTitle(d.data, filter)) return null;
          return (
            <li key={id}>
              <LinkRow anime={d.data} links={published[id] ?? []} onChange={(links) => onChange(id, links)} />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function QueryList({ query, controls, ...props }: ListProps & FilterProps & { query: UseQueryResult<Page<Anime>>; controls?: ReactNode }) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {controls}
        <TitleFilter filter={props.filter} setFilter={props.setFilter} />
      </div>
      <Rows query={query} {...props} />
    </>
  );
}

function Rows({ query, published, onChange, filter }: ListProps & { query: UseQueryResult<Page<Anime>>; filter: string }) {
  if (query.isPending) {
    return (
      <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i}>
            <RowSkeleton />
          </li>
        ))}
      </ul>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const items = query.data.items.filter((a) => matchesTitle(a, filter));
  if (items.length === 0) return <EmptyState title="No shows">Nothing matches here.</EmptyState>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((a) => (
        <li key={a.id}>
          <LinkRow anime={a} links={published[a.id] ?? []} onChange={(links) => onChange(a.id, links)} />
        </li>
      ))}
    </ul>
  );
}

// ---------- one show ----------

function LinkRow({ anime, links, onChange }: { anime: Anime; links: SharedStreamLink[]; onChange: (links: SharedStreamLink[]) => void }) {
  // null = no form, -1 = adding, otherwise the index being edited.
  const [editing, setEditing] = useState<number | null>(null);
  const year = anime.startDate?.slice(0, 4);

  return (
    <div className={`surface flex flex-col gap-3 p-3 sm:flex-row ${links.length > 0 ? 'border-primary/40' : ''}`}>
      <div className="flex min-w-0 gap-3 sm:w-72 sm:shrink-0">
        <Link to={`/anime/${anime.id}`} className="shrink-0">
          <Poster src={posterUrl(anime, 'small')} title={anime.canonicalTitle} className="h-20 w-14 rounded-md" />
        </Link>
        <div className="min-w-0">
          <Link to={`/anime/${anime.id}`} className="line-clamp-2 text-sm font-semibold hover:text-primary">
            {anime.canonicalTitle}
          </Link>
          <p className="text-xs text-base-content/60">
            {FORMAT_LABEL[anime.subtype] ?? anime.subtype}
            {year && ` · ${year}`} · {ANIME_STATUS_LABEL[anime.status]}
          </p>
          <p className="font-mono text-[0.6875rem] text-base-content/40">id {anime.id}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {links.map((l, i) =>
          editing === i ? (
            <LinkForm
              key={`${l.url}-edit`}
              initial={l}
              onSubmit={(label, url) => {
                onChange(links.map((x, j) => (j === i ? { label, url } : x)));
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div key={`${i}-${l.url}`} className="flex items-center gap-1">
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm min-w-0 flex-1 justify-start border-base-300 bg-base-100 font-normal"
                title={l.url}
              >
                <ServiceLogo url={l.url} label={l.label} />
                <span className="font-medium">{l.label}</span>
                <span className="truncate text-xs text-base-content/50">{l.url}</span>
              </a>
              {CAN_EDIT_PUBLISHED_LINKS && (
                <>
                  <button type="button" className="btn btn-ghost btn-sm btn-square" aria-label={`Edit ${l.label} link`} title="Edit" onClick={() => setEditing(i)}>
                    <Icon name="pencil" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square hover:text-error"
                    aria-label={`Remove ${l.label} link`}
                    title="Remove"
                    onClick={() => onChange(links.filter((_, j) => j !== i))}
                  >
                    <Icon name="trash" className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          ),
        )}

        {editing === -1 ? (
          <LinkForm
            onSubmit={(label, url) => {
              onChange([...links, { label, url }]);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          CAN_EDIT_PUBLISHED_LINKS && (
            <button type="button" className="btn btn-ghost btn-sm w-fit text-base-content/70" onClick={() => setEditing(-1)}>
              <Icon name="plus" className="size-3.5" />
              Add link
            </button>
          )
        )}
        {!CAN_EDIT_PUBLISHED_LINKS && links.length === 0 && <p className="text-sm text-base-content/50">No links.</p>}
      </div>
    </div>
  );
}
