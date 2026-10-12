import { useState } from 'react';
import { useLibraryStore } from '../store/useLibraryStore';
import { useStreamLinks } from '../store/selectors';
import { LinkForm } from './LinkForm';
import { usePublishedLinks } from '../api/publishedLinks';
import { Icon } from './Icon';
import { ServiceLogo } from './ServiceLogo';

/**
 * "Where to watch": links published with the app (src/data/streamLinks.json, read-only, same for everyone)
 * followed by the user's own links, saved in the store by anime id.
 */
export function StreamLinks({ animeId, title }: { animeId: number; title: string }) {
  const shared = usePublishedLinks()[animeId] ?? [];
  const sharedUrls = new Set(shared.map((l) => l.url));
  // Same rule as useWatchLinks: a personal copy of a published link isn't listed twice.
  const links = useStreamLinks(animeId).filter((l) => !sharedUrls.has(l.url));
  const { addStreamLink, updateStreamLink, removeStreamLink } = useLibraryStore.getState();
  // null = no form open, 'new' = adding, otherwise the id of the link being edited.
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <section className="surface p-4" aria-labelledby={`stream-${animeId}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={`stream-${animeId}`} className="eyebrow">
          Where to watch
        </h2>
        {links.length + shared.length > 0 && editing === null && (
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditing('new')}>
            <Icon name="plus" className="size-3.5" />
            Add
          </button>
        )}
      </div>

      {shared.length > 0 && (
        <ul className="mb-2 flex flex-col gap-2">
          {shared.map((l) => (
            <li key={l.url} className="flex items-center gap-1">
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm min-w-0 flex-1 justify-start border-base-300 bg-base-100 hover:border-primary/50"
                title={l.url}
              >
                <ServiceLogo url={l.url} label={l.label} />
                <span className="truncate">{l.label}</span>
                <Icon name="external" className="ml-auto size-3.5 opacity-70" />
              </a>
              <span
                className="grid size-8 shrink-0 place-items-center text-base-content/40"
                title="Published with the app: everyone sees this link"
                aria-label="Published link"
              >
                <Icon name="link" className="size-3.5" />
              </span>
            </li>
          ))}
        </ul>
      )}

      {links.length > 0 && (
        <ul className="flex flex-col gap-2">
          {links.map((l) =>
            editing === l.id ? (
              <li key={l.id}>
                <LinkForm
                  initial={l}
                  onSubmit={(label, url) => {
                    updateStreamLink(animeId, l.id, label, url);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={l.id} className="group flex items-center gap-1">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm min-w-0 flex-1 justify-start border-base-300 bg-base-100 hover:border-primary/50"
                  title={l.url}
                >
                  <ServiceLogo url={l.url} label={l.label} />
                  <span className="truncate">{l.label}</span>
                  <Icon name="external" className="ml-auto size-3.5 opacity-70" />
                </a>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-square"
                  aria-label={`Edit ${l.label} link`}
                  title="Edit"
                  onClick={() => setEditing(l.id)}
                >
                  <Icon name="pencil" className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-square hover:text-error"
                  aria-label={`Remove ${l.label} link`}
                  title="Remove"
                  onClick={() => removeStreamLink(animeId, l.id)}
                >
                  <Icon name="trash" className="size-3.5" />
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      {editing === 'new' && (
        <div className={links.length + shared.length > 0 ? 'mt-3' : ''}>
          <LinkForm
            onSubmit={(label, url) => {
              addStreamLink(animeId, label, url);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {links.length === 0 && shared.length === 0 && editing === null && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-base-content/60">Save the page where you stream {title}, then open it from here in one click.</p>
          <button type="button" className="btn btn-sm btn-outline border-base-300" onClick={() => setEditing('new')}>
            <Icon name="link" className="size-3.5" />
            Add streaming link
          </button>
        </div>
      )}
    </section>
  );
}
