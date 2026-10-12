import { MEMBERS } from '../data/members';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function AboutPage() {
  return (
    <section className="flex flex-col gap-8">
      <PageHeader
        title="About"
        description={
          <>
            Anime Tracker is a React SPA for keeping track of what you watch. Your collection lives in your browser (Zustand +
            localStorage); everything about the shows themselves comes live from the Kitsu API (TanStack Query).
          </>
        }
      />

      <div>
        <h2 className="eyebrow mb-3">Team</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MEMBERS.map((m) => (
            <li key={m.studentId} className="surface flex flex-col items-center gap-1 p-6 text-center">
              <div className={`avatar mb-3 ${m.photo ? '' : 'avatar-placeholder'}`}>
                <div className="w-20 rounded-full bg-primary/10 text-primary ring-4 ring-base-200">
                  {m.photo ? <img src={m.photo} alt={m.fullName} /> : <span className="text-xl font-semibold">{initials(m.fullName)}</span>}
                </div>
              </div>
              <h3 className="font-semibold">{m.fullName}</h3>
              <p className="text-sm text-base-content/60">“{m.nickname}”</p>
              <p className="font-mono text-xs text-base-content/50">{m.studentId}</p>
              <span className="mt-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{m.role}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="surface flex gap-4 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon name="link" className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold">Data source</h2>
          <p className="mt-1 text-sm text-base-content/70">
            All anime data, posters and ratings come from the{' '}
            <a className="link link-primary" href="https://kitsu.app" target="_blank" rel="noreferrer">
              Kitsu
            </a>{' '}
            public API (
            <a className="link" href="https://kitsu.docs.apiary.io/" target="_blank" rel="noreferrer">
              documentation
            </a>
            ). This project is not affiliated with Kitsu.
          </p>
        </div>
      </div>
    </section>
  );
}
