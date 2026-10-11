import { MEMBERS } from '../data/members';

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
      <div>
        <h1 className="text-3xl font-bold">About</h1>
        <p className="text-base-content/70">
          Anime Tracker is a React SPA for keeping track of what you watch. Your collection lives in your browser
          (Zustand + localStorage); everything about the shows themselves comes live from the Kitsu API (TanStack Query).
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Team</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MEMBERS.map((m) => (
            <li key={m.studentId} className="card bg-base-200 shadow-sm">
              <div className="card-body items-center text-center">
                <div className={`avatar ${m.photo ? '' : 'avatar-placeholder'}`}>
                  <div className="w-24 rounded-full bg-neutral text-neutral-content">
                    {m.photo ? <img src={m.photo} alt={m.fullName} /> : <span className="text-2xl">{initials(m.fullName)}</span>}
                  </div>
                </div>
                <h3 className="card-title">{m.fullName}</h3>
                <p className="text-sm">“{m.nickname}”</p>
                <p className="font-mono text-sm text-base-content/70">{m.studentId}</p>
                <span className="badge badge-primary badge-outline h-auto">{m.role}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Data source</h2>
          <p>
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
