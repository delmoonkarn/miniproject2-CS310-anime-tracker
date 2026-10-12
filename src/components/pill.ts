/** Rounded filter chip used by the Explore format filter and the Watching day filter. */
export const pillClass = (active: boolean, tone: 'primary' | 'info' = 'primary') =>
  `inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
    active
      ? tone === 'info'
        ? 'border-info/50 bg-info/15 text-info'
        : 'border-primary/50 bg-primary/10 text-primary'
      : 'border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/30 hover:text-base-content'
  }`;
