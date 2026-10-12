import type { ReactNode } from 'react';
import { isKitsuError } from '../api/errors';
import { Icon } from './Icon';

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
    <div
      role="alert"
      className={`flex flex-wrap items-center gap-3 rounded-box border border-error/30 bg-error/5 ${compact ? 'p-3 text-sm' : 'my-6 p-4'}`}
    >
      <Icon name="alert" className={`text-error ${compact ? 'size-4' : 'size-5'}`} />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{title}</h3>
        {!compact && <p className="text-sm text-base-content/70">{message}</p>}
      </div>
      <button type="button" className="btn btn-sm" onClick={onRetry}>
        <Icon name="refresh" className="size-3.5" />
        Retry
      </button>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="my-6 flex flex-col items-center gap-2 rounded-box border border-dashed border-base-300 px-6 py-14 text-center">
      <span className="mb-1 grid size-12 place-items-center rounded-full bg-base-300/60 text-base-content/50">
        <Icon name="inbox" className="size-6" />
      </span>
      <h3 className="font-semibold">{title}</h3>
      {children && <div className="text-sm text-base-content/60">{children}</div>}
    </div>
  );
}

// ---------- skeletons ----------

export function CardSkeleton() {
  return (
    <div className="surface overflow-hidden" aria-hidden>
      <div className="skeleton aspect-[2/3] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton mt-2 h-8 w-full" />
      </div>
    </div>
  );
}

/** One horizontally scrolling row of cards (Home's season row). */
export const CARD_ROW_CLASSES = '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:thin] sm:gap-4';
export const CARD_ROW_ITEM = 'w-40 shrink-0 snap-start sm:w-44 lg:w-48';

/** Keep in sync with useGridColumns. */
export const GRID_CLASSES = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

export function CardGridSkeleton({ count = 12 }: { count?: number }) {
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
    <div className="surface flex items-center gap-4 p-3" aria-hidden>
      <div className="skeleton h-20 w-14 shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
      </div>
      <div className="skeleton h-8 w-24" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton h-48 w-full sm:h-64" />
      <div className="flex flex-col gap-6 px-4 md:flex-row md:px-8">
        <div className="skeleton -mt-24 aspect-[2/3] w-40 self-center md:w-60 md:self-start" />
        <div className="flex flex-1 flex-col gap-3 pt-6">
          <div className="skeleton h-9 w-2/3" />
          <div className="skeleton h-5 w-1/2" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
