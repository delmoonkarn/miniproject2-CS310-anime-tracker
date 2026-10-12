import type { ReactNode } from 'react';

/** Title row shared by the top-level pages: eyebrow, heading with an optional count, description, and actions on the right. */
export function PageHeader({
  eyebrow,
  title,
  count,
  description,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  count?: number;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-base-300 pb-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2">{eyebrow}</div>}
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
            {count !== undefined && (
              <span className="rounded-full bg-base-300/70 px-2.5 py-0.5 text-sm font-semibold text-base-content/70 tabular-nums">
                {count}
              </span>
            )}
          </h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-base-content/60">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
