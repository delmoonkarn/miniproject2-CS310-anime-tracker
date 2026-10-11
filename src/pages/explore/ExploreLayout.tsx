import { NavLink, Outlet } from 'react-router';
import { EXPLORE_CATEGORIES, type ExploreCategory } from '../../api/endpoints';

const CATEGORIES = Object.keys(EXPLORE_CATEGORIES).filter((k): k is ExploreCategory => k in EXPLORE_CATEGORIES);

export function ExploreLayout() {
  return (
    <section>
      <h1 className="mb-1 text-3xl font-bold">Explore</h1>
      <p className="mb-4 text-base-content/70">Shows already in your collection are outlined.</p>
      <div role="tablist" className="tabs tabs-box mb-6 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <NavLink key={c} to={c} role="tab" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
            {EXPLORE_CATEGORIES[c].label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </section>
  );
}
