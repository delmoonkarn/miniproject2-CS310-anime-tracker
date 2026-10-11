import { describe, expect, it } from 'vitest';
import { currentSeason, nextSeason, seasonStart } from './season';

describe('season helpers', () => {
  it('maps months to seasons', () => {
    expect(currentSeason(new Date('2026-01-15T12:00:00'))).toEqual({ season: 'winter', year: 2026 });
    expect(currentSeason(new Date('2026-06-30T12:00:00'))).toEqual({ season: 'spring', year: 2026 });
    expect(currentSeason(new Date('2026-10-11T12:00:00'))).toEqual({ season: 'fall', year: 2026 });
  });

  it('rolls fall over into next winter', () => {
    expect(nextSeason({ season: 'fall', year: 2026 })).toEqual({ season: 'winter', year: 2027 });
    expect(nextSeason({ season: 'spring', year: 2026 })).toEqual({ season: 'summer', year: 2026 });
  });

  it('gives the first day of the season', () => {
    expect(seasonStart({ season: 'fall', year: 2026 })).toBe('2026-10-01');
    expect(seasonStart({ season: 'winter', year: 2027 })).toBe('2027-01-01');
  });
});
