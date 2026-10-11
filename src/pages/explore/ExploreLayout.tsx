import { NavLink, Outlet } from 'react-router';
import { EXPLORE_CATEGORIES, type ExploreCategory } from '../../api/endpoints';

const CATEGORIES = Object.keys(EXPLORE_CATEGORIES).filter((k): k is ExploreCategory => k in EXPLORE_CATEGORIES);

export function ExploreLayout() {
  return (
    <section>
      <nav role="tablist" aria-label="Explore categories" className="tabs tabs-box tabs-sm mb-6 w-fit max-w-full overflow-x-auto">
        {CATEGORIES.map((c) => (
          <NavLink key={c} to={c} role="tab" className={({ isActive }) => `tab whitespace-nowrap ${isActive ? 'tab-active' : ''}`}>
            {EXPLORE_CATEGORIES[c].label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </section>
  );
}
