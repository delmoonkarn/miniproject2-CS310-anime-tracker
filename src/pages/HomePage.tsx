import type { FormEvent } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { PAGE_SIZE } from '../api/endpoints';
import { searchQuery, trendingQuery } from '../api/queries';
import { AnimeQueryGrid } from '../components/AnimeQueryGrid';
import { Pagination } from '../components/Pagination';

function parseOffset(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export function HomePage() {
  // Search text and page live in the URL (?q=...&offset=40), so they survive reloads and back/forward.
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const offset = parseOffset(params.get('offset'));

  const search = useQuery({ ...searchQuery(q, offset), enabled: q !== '', placeholderData: keepPreviousData });
  const trending = useQuery({ ...trendingQuery(), enabled: q === '' });
  const active = q ? search : trending;

  const setOffset = (next: number) => {
    const p = new URLSearchParams(params);
    if (next > 0) p.set('offset', String(next));
    else p.delete('offset');
    setParams(p);
    window.scrollTo({ top: 0 });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = String(new FormData(e.currentTarget).get('q') ?? '').trim();
    setParams(text ? { q: text } : {});
  };

  // Search pages come from Kitsu (page[offset]); trending is one request paged locally.
  const total = q ? (search.data?.total ?? null) : (trending.data?.items.length ?? null);
  const shown = q ? (search.data?.items.length ?? 0) : PAGE_SIZE;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{q ? `Results for “${q}”` : 'Trending now'}</h1>
          <p className="text-base-content/70">
            {q ? `${search.data?.total ?? '…'} matches on Kitsu` : 'The most talked-about anime on Kitsu this week.'}
          </p>
        </div>
        <form role="search" onSubmit={onSubmit} className="join w-full md:w-96" key={q}>
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search anime…"
            aria-label="Search anime"
            className="input join-item w-full"
          />
          <button type="submit" className="btn btn-primary join-item">
            Search
          </button>
        </form>
      </div>

      <AnimeQueryGrid
        query={active}
        slice={q ? undefined : [offset, offset + PAGE_SIZE]}
        empty={q ? `No anime matches “${q}”. Try another title.` : 'No trending anime right now.'}
      />

      {active.isSuccess && total !== 0 && (
        <Pagination offset={offset} pageSize={PAGE_SIZE} total={total} shown={shown} onChange={setOffset} />
      )}
    </section>
  );
}
