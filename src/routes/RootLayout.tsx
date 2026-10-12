import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { useLibraryStore } from '../store/useLibraryStore';
import { useStatusCounts } from '../store/selectors';
import { Icon } from '../components/Icon';
import { GlobalSearch } from '../components/GlobalSearch';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/about', label: 'About' },
] as const;

function ThemeToggle() {
  const theme = useLibraryStore((s) => s.theme);
  const toggleTheme = useLibraryStore((s) => s.toggleTheme);
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
  return (
    <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={toggleTheme} aria-label={label} title={label}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

export function RootLayout() {
  const counts = useStatusCounts();
  // Small count next to Watchlist / Favorites so the nav doubles as a summary.
  const badge: Partial<Record<(typeof NAV)[number]['to'], number>> = {
    '/watchlist': counts.watching + counts.interested + counts.completed,
    '/favorites': counts.favorites,
  };

  const links = (mobile: boolean) =>
    NAV.map((n) => (
      <li key={n.to}>
        <NavLink
          to={n.to}
          end={n.to === '/'}
          className={({ isActive }) =>
            `rounded-field px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-primary/10 text-primary' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
            } ${mobile ? 'flex justify-between' : 'inline-flex items-center gap-1.5'}`
          }
        >
          {n.label}
          {(badge[n.to] ?? 0) > 0 && (
            <span className="rounded-full bg-base-300/80 px-1.5 text-[0.6875rem] font-semibold text-base-content/70 tabular-nums">
              {badge[n.to]}
            </span>
          )}
        </NavLink>
      </li>
    ));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-base-300 bg-base-100/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 md:gap-4">
          <div className="dropdown md:hidden">
            <button type="button" tabIndex={0} className="btn btn-ghost btn-sm btn-square" aria-label="Open menu">
              <Icon name="menu" className="size-5" />
            </button>
            <ul tabIndex={0} className="dropdown-content surface z-30 mt-2 flex w-52 flex-col gap-0.5 p-1.5 shadow-lg">
              {links(true)}
            </ul>
          </div>

          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-content">
              <Icon name="play" filled className="size-4" />
            </span>
            <span className="hidden text-[0.95rem] sm:inline">Anime Tracker</span>
          </Link>

          <nav aria-label="Main" className="ml-2 hidden md:block">
            <ul className="flex items-center gap-1">{links(false)}</ul>
          </nav>

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
            <GlobalSearch />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-base-content/60 sm:flex-row">
          <p>
            Anime data from{' '}
            <a className="link link-hover font-medium text-base-content/80" href="https://kitsu.app" target="_blank" rel="noreferrer">
              Kitsu
            </a>
            . Not affiliated with Kitsu.
          </p>
          <p>Your collection is stored only in this browser.</p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
