import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { useLibraryStore } from '../store/useLibraryStore';

const NAV = [
  { to: '/explore', label: 'Explore', end: false },
  { to: '/collection', label: 'Collection', end: false },
  { to: '/about', label: 'About', end: false },
];

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'menu-active' : '');

function ThemeToggle() {
  const theme = useLibraryStore((s) => s.theme);
  const toggleTheme = useLibraryStore((s) => s.toggleTheme);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-circle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export function RootLayout() {
  const links = NAV.map((n) => (
    <li key={n.to}>
      <NavLink to={n.to} end={n.end} className={navClass}>
        {n.label}
      </NavLink>
    </li>
  ));

  return (
    <div className="flex min-h-screen flex-col bg-base-100">
      <header className="navbar sticky top-0 z-20 bg-base-200/95 px-4 shadow-sm backdrop-blur">
        <div className="navbar-start">
          <div className="dropdown md:hidden">
            <button type="button" tabIndex={0} className="btn btn-ghost btn-square" aria-label="Open menu">
              ☰
            </button>
            <ul tabIndex={0} className="menu dropdown-content z-30 mt-3 w-48 rounded-box bg-base-200 p-2 shadow">
              {links}
            </ul>
          </div>
          <Link to="/" className="btn btn-ghost text-xl">
            📺 Anime Tracker
          </Link>
        </div>
        <nav className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal gap-1">{links}</ul>
        </nav>
        <div className="navbar-end">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="footer footer-center bg-base-200 p-4 text-sm text-base-content/70">
        <aside>
          <p>
            Anime data from{' '}
            <a className="link" href="https://kitsu.app" target="_blank" rel="noreferrer">
              Kitsu
            </a>
            . Your collection is stored only in this browser.
          </p>
        </aside>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
