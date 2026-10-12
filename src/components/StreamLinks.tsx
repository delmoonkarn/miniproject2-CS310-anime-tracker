import { useState, type FormEvent } from 'react';
import { useLibraryStore, type StreamLink } from '../store/useLibraryStore';
import { useStreamLinks } from '../store/selectors';
import { normalizeStreamUrl, serviceName } from '../lib/streamLinks';
import { SHARED_STREAM_LINKS } from '../data/streamLinks';
import { Icon } from './Icon';
import { ServiceLogo } from './ServiceLogo';

/**
 * "Where to watch": links published with the app (src/data/streamLinks.ts, read-only, same for everyone)
 * followed by the user's own links, saved in the store by anime id.
 */
export function StreamLinks({ animeId, title }: { animeId: number; title: string }) {
  const shared = SHARED_STREAM_LINKS[animeId] ?? [];
  const sharedUrls = new Set(shared.map((l) => l.url));
  // Same rule as useWatchLinks: a personal copy of a published link isn't listed twice.
  const links = useStreamLinks(animeId).filter((l) => !sharedUrls.has(l.url));
  const { removeStreamLink } = useLibraryStore.getState();
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
                <LinkForm animeId={animeId} link={l} onDone={() => setEditing(null)} />
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
          <LinkForm animeId={animeId} onDone={() => setEditing(null)} />
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

/** Add form when `link` is absent, edit form otherwise. */
function LinkForm({ animeId, link, onDone }: { animeId: number; link?: StreamLink; onDone: () => void }) {
  const [url, setUrl] = useState(link?.url ?? '');
  // Left empty, the label is taken from the URL ("Netflix", "example.org").
  const [label, setLabel] = useState(link?.label ?? '');
  const [error, setError] = useState<string | null>(null);
  const { addStreamLink, updateStreamLink } = useLibraryStore.getState();

  const normalized = normalizeStreamUrl(url);
  const suggested = normalized ? serviceName(normalized) : 'e.g. Netflix';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!normalized) {
      setError('Enter a valid web address, e.g. https://www.netflix.com/title/…');
      return;
    }
    const finalLabel = label.trim() || serviceName(normalized);
    if (link) updateStreamLink(animeId, link.id, finalLabel, normalized);
    else addStreamLink(animeId, finalLabel, normalized);
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-field bg-base-200 p-3" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-base-content/70">Link</span>
        <input
          type="url"
          inputMode="url"
          className={`input input-sm w-full ${error ? 'input-error' : ''}`}
          placeholder="https://…"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          aria-invalid={error !== null}
          autoFocus
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-base-content/70">
          Name <span className="font-normal text-base-content/50">(optional)</span>
        </span>
        <input
          type="text"
          className="input input-sm w-full"
          placeholder={suggested}
          value={label}
          maxLength={40}
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm">
          {link ? 'Save' : 'Add link'}
        </button>
      </div>
    </form>
  );
}
