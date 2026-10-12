import { useState, type FormEvent } from 'react';
import { MAX_LABEL_LENGTH } from '../lib/sharedLinks';
import { normalizeStreamUrl, serviceName } from '../lib/streamLinks';

/**
 * URL + optional name form for a streaming link. Used for personal links (Detail page) and published
 * ones (/admin). The URL is normalized and checked here; an empty name becomes the service name.
 */
export function LinkForm({
  initial,
  onSubmit,
  onCancel,
}: {
  /** Present when editing an existing link. */
  initial?: { label: string; url: string };
  onSubmit: (label: string, url: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(initial?.url ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizeStreamUrl(url);
  const suggested = normalized ? serviceName(normalized) : 'e.g. Netflix';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!normalized) {
      setError('Enter a valid web address, e.g. https://www.netflix.com/title/…');
      return;
    }
    onSubmit(label.trim() || serviceName(normalized), normalized);
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
          maxLength={MAX_LABEL_LENGTH}
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm">
          {initial ? 'Save' : 'Add link'}
        </button>
      </div>
    </form>
  );
}
