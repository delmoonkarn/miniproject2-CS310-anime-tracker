/** `Date.getDay()` numbers in display order: Monday first. */
export const WEEK_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAY_LABEL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export interface DayGroup<T> {
  /** `Date.getDay()` number, or null for items with no known airing day. */
  day: number | null;
  isToday: boolean;
  items: T[];
}

/**
 * Groups items into weekdays (Monday → Sunday), keeping their order inside each day.
 * Empty days are dropped except today, which is always present so it can be highlighted.
 * Items whose day is null come last, in one group.
 */
export function groupByWeekday<T>(items: readonly T[], dayOf: (item: T) => number | null, today: number): DayGroup<T>[] {
  const byDay = new Map<number | null, T[]>();
  for (const item of items) {
    const day = dayOf(item);
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  }
  const days: DayGroup<T>[] = WEEK_ORDER.filter((d) => d === today || byDay.has(d)).map((d) => ({
    day: d,
    isToday: d === today,
    items: byDay.get(d) ?? [],
  }));
  const unknown = byDay.get(null);
  return unknown ? [...days, { day: null, isToday: false, items: unknown }] : days;
}
