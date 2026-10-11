import { NavLink, Outlet } from 'react-router';
import { useStatusCounts } from '../../store/selectors';

const TABS = [
  { to: 'watching', label: 'Watching' },
  { to: 'interested', label: 'Interested' },
  { to: 'completed', label: 'Completed' },
  { to: 'favorites', label: 'Favorites' },
] as const;

export function CollectionLayout() {
  const counts = useStatusCounts();
  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">My collection</h1>
      <div role="tablist" className="tabs tabs-box mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} role="tab" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
            {t.label}
            <span className="badge badge-sm ml-2">{counts[t.to]}</span>
          </NavLink>
        ))}
      </div>
      <Outlet />
    </section>
  );
}
