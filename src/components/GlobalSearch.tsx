import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { MIN_SEARCH_LENGTH } from '../api/queries';
import { Icon } from './Icon';

const DEBOUNCE_MS = 350;

/**
 * Navbar search over the whole Kitsu catalogue. Typing opens /search?q=… after a short pause
 * (Enter goes straight there); further typing replaces the history entry instead of piling up.
 * The box follows the URL, so Back/Forward restore the previous query. Press "/" to focus it.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const onSearchPage = pathname === '/search';
  const urlQuery = onSearchPage ? (new URLSearchParams(search).get('q') ?? '') : '';
  const [text, setText] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Follow the URL when it changes from outside (Back/Forward, leaving the search page).
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setText(urlQuery);
  }

  const go = useCallback(
    (q: string) => void navigate(`/search?q=${encodeURIComponent(q)}`, { replace: onSearchPage }),
    [navigate, onSearchPage],
  );

  useEffect(() => {
    const q = text.trim();
    if (q === urlQuery.trim() || (!onSearchPage && q.length < MIN_SEARCH_LENGTH)) return;
    const timer = setTimeout(() => go(q), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, urlQuery, onSearchPage, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (q) go(q);
  };

  return (
    <form role="search" onSubmit={submit} className="min-w-0 flex-1 md:max-w-xs lg:max-w-sm">
      <label className="input input-sm w-full bg-base-200/70 focus-within:bg-base-100">
        <Icon name="search" className="size-4 opacity-50" />
        <input
          ref={inputRef}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
          placeholder="Search all anime…"
          aria-label="Search all anime on Kitsu"
          enterKeyHint="search"
        />
        <kbd className="kbd kbd-xs hidden opacity-60 sm:inline-flex" aria-hidden>
          /
        </kbd>
      </label>
    </form>
  );
}
