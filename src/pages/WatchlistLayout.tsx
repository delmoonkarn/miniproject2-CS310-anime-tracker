import { NavLink, Outlet } from 'react-router';
import { useStatusCounts } from '../store/selectors';
import { PageHeader } from '../components/PageHeader';

const TABS = [
  { to: 'watching', label: 'Watching' },
  { to: 'interested', label: 'Interested' },
  { to: 'completed', label: 'Completed' },
] as const;

export function WatchlistLayout() {
  const counts = useStatusCounts();
  return (
    <section>
      <PageHeader title="My watchlist" description="Everything you are watching, planning to watch or have finished.">
        <div role="tablist" className="-mb-5 flex gap-1 overflow-x-auto overflow-y-hidden">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              role="tab"
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-base-content/60 hover:text-base-content'
                }`
              }
            >
              {t.label}
              <span className="rounded-full bg-base-300/70 px-1.5 text-[0.6875rem] font-semibold text-base-content/70 tabular-nums">
                {counts[t.to]}
              </span>
            </NavLink>
          ))}
        </div>
      </PageHeader>
      <Outlet />
    </section>
  );
}
