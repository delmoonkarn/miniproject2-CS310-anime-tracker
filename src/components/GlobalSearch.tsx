import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { MIN_SEARCH_LENGTH, searchQuery } from '../api/queries';
import { FORMAT_LABEL } from '../lib/discover';
import { ANIME_STATUS_LABEL, formatRating, posterUrl } from '../lib/format';
import type { Anime } from '../types/kitsu';
import { Icon } from './Icon';
import { Poster } from './Poster';
import { ErrorState } from './States';

const DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/**
 * Navbar search over the whole Kitsu catalogue, with results in a dropdown under the box.
 * ↑/↓ move through the results, Enter opens one, Esc closes. Press "/" anywhere to focus it.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const q = useDebouncedValue(text.trim(), DEBOUNCE_MS);
  const ready = q.length >= MIN_SEARCH_LENGTH;
  // Keeps the previous results on screen while the next query loads, so the list doesn't flash.
  const query = useQuery({ ...searchQuery(q), placeholderData: keepPreviousData });
  const results: Anime[] = ready ? (query.data?.items ?? []) : [];
  const total = query.data?.total ?? null;
  const showPanel = open && text.trim().length >= MIN_SEARCH_LENGTH;

  // A new result list starts from the top.
  const [listFor, setListFor] = useState(q);
  if (listFor !== q) {
    setListFor(q);
    setActive(0);
  }

  // Close and clear after navigating anywhere (picking a result, or any other link).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setText('');
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    // Clicking outside the box or the dropdown closes it.
    const onPointer = (e: PointerEvent) => {
      if (e.target instanceof Node && !rootRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  const optionId = (i: number) => `${listId}-opt-${i}`;
  const pick = (anime: Anime) => void navigate(`/anime/${anime.id}`);

  // Keep the highlighted option visible when moving with the arrow keys.
  useEffect(() => {
    if (showPanel) document.getElementById(`${listId}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [showPanel, active, listId]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (showPanel) setOpen(false);
      else e.currentTarget.blur();
      return;
    }
    if (results.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length);
    }
  };

  return (
    <form
      ref={rootRef}
      role="search"
      className="relative min-w-0 flex-1 md:max-w-xs lg:max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const target = results[active];
        if (showPanel && target) pick(target);
      }}
    >
      <label className="input input-sm w-full bg-base-200/70 focus-within:bg-base-100">
        <Icon name="search" className="size-4 opacity-50" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && results[active] ? optionId(active) : undefined}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search all anime…"
          aria-label="Search all anime on Kitsu"
          enterKeyHint="go"
          autoComplete="off"
        />
        {query.isFetching && ready ? (
          <span className="loading loading-spinner loading-xs opacity-60" aria-label="Searching" />
        ) : (
          <kbd className="kbd kbd-xs hidden opacity-60 sm:inline-flex" aria-hidden>
            /
          </kbd>
        )}
      </label>

      {showPanel && (
        <div className="surface absolute top-full right-0 z-40 mt-2 w-[26rem] overflow-hidden shadow-xl max-sm:fixed max-sm:inset-x-4 max-sm:top-14 max-sm:w-auto">
          {!ready || (query.isPending && results.length === 0) ? (
            <p className="flex items-center gap-2 px-4 py-6 text-sm text-base-content/60">
              <span className="loading loading-spinner loading-xs" /> Searching Kitsu…
            </p>
          ) : query.isError && results.length === 0 ? (
            <div className="p-2">
              <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-base-content/60">
              No anime found for “{q}”. Try the English or romaji title.
            </p>
          ) : (
            <>
              <ul id={listId} role="listbox" aria-label="Search results" className="max-h-[min(28rem,70vh)] overflow-y-auto p-1.5">
                {results.map((a, i) => (
                  <li
                    key={a.id}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === active}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => pick(a)}
                    className={`flex cursor-pointer items-center gap-3 rounded-field p-1.5 ${i === active ? 'bg-base-200' : ''}`}
                  >
                    <Poster src={posterUrl(a, 'small')} title={a.canonicalTitle} className="h-14 w-10 shrink-0 rounded" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.canonicalTitle}</p>
                      <p className="truncate text-xs text-base-content/60">
                        {FORMAT_LABEL[a.subtype] ?? a.subtype}
                        {a.startDate && ` · ${a.startDate.slice(0, 4)}`} · {ANIME_STATUS_LABEL[a.status]}
                      </p>
                    </div>
                    {a.averageRating !== null && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-base-content/70">
                        <Icon name="star" filled className="size-3 text-amber-400" />
                        {formatRating(a.averageRating)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="flex justify-between gap-2 border-t border-base-300 px-4 py-2 text-xs text-base-content/50">
                <span>
                  {total !== null && total > results.length
                    ? `Top ${results.length} of ${total.toLocaleString()} matches. Add words to narrow it down.`
                    : `${results.length} match${results.length === 1 ? '' : 'es'}`}
                </span>
                <span className="hidden shrink-0 sm:inline">↑↓ · Enter</span>
              </p>
            </>
          )}
        </div>
      )}
    </form>
  );
}
