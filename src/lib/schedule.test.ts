import { describe, expect, it } from 'vitest';
import { groupByWeekday } from './schedule';

type Show = { name: string; day: number | null };
const shows: Show[] = [
  { name: 'Sun show', day: 0 },
  { name: 'Fri A', day: 5 },
  { name: 'Finished', day: null },
  { name: 'Mon show', day: 1 },
  { name: 'Fri B', day: 5 },
];
const summary = (today: number) =>
  groupByWeekday(shows, (s) => s.day, today).map((g) => [g.day, g.isToday, g.items.map((s) => s.name)]);

describe('groupByWeekday', () => {
  it('orders Monday → Sunday, keeps item order, puts unknown days last', () => {
    expect(summary(1)).toEqual([
      [1, true, ['Mon show']],
      [5, false, ['Fri A', 'Fri B']],
      [0, false, ['Sun show']],
      [null, false, ['Finished']],
    ]);
  });

  it('always includes today, even with nothing airing', () => {
    expect(summary(3)).toEqual([
      [1, false, ['Mon show']],
      [3, true, []],
      [5, false, ['Fri A', 'Fri B']],
      [0, false, ['Sun show']],
      [null, false, ['Finished']],
    ]);
  });

  it('returns just today for an empty list', () => {
    expect(groupByWeekday<Show>([], (s) => s.day, 6)).toEqual([{ day: 6, isToday: true, items: [] }]);
  });
});
