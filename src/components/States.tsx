import type { ReactNode } from 'react';
import { isKitsuError } from '../api/errors';

function describeError(error: unknown): { title: string; message: string } {
  if (!isKitsuError(error)) return { title: 'Something went wrong', message: 'An unexpected error occurred.' };
  switch (error.kind) {
    case 'network':
      return { title: 'Network error', message: error.message };
    case 'parse':
      return { title: 'Unexpected API response', message: error.message };
    case 'http':
      return {
        title: error.isRateLimit ? 'Too many requests' : `Kitsu API error (HTTP ${error.status ?? '?'})`,
        message: error.message,
      };
  }
}

export function ErrorState({ error, onRetry, compact = false }: { error: unknown; onRetry: () => void; compact?: boolean }) {
  const { title, message } = describeError(error);
  return (
    <div role="alert" className={`alert alert-error alert-soft ${compact ? 'text-sm' : 'my-6'} flex-wrap`}>
      <div className="flex-1">
        <h3 className="font-bold">{title}</h3>
        {!compact && <p className="text-sm">{message}</p>}
      </div>
      <button type="button" className="btn btn-sm" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="my-10 flex flex-col items-center gap-3 text-center">
      <p className="text-4xl" aria-hidden>
        📭
      </p>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="text-base-content/70">{children}</div>}
    </div>
  );
}

// ---------- skeletons ----------

export function CardSkeleton() {
  return (
    <div className="card bg-base-200 shadow-sm" aria-hidden>
      <div className="skeleton aspect-[2/3] w-full rounded-b-none" />
      <div className="card-body gap-2 p-4">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-8 w-full" />
      </div>
    </div>
  );
}

export const GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

export function CardGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className={GRID_CLASSES} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-box bg-base-200 p-3" aria-hidden>
      <div className="skeleton h-24 w-16 shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton h-4 w-1/3" />
      </div>
      <div className="skeleton h-8 w-16" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 md:flex-row" aria-busy="true" aria-label="Loading">
      <div className="skeleton aspect-[2/3] w-full max-w-64 self-center md:self-start" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="skeleton h-9 w-2/3" />
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    </div>
  );
}
