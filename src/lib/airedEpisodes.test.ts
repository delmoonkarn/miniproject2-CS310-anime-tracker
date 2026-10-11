import { describe, expect, it } from 'vitest';
import { behindBy, lastAiredEpisode, needsEpisodeList } from './airedEpisodes';

const now = new Date('2026-10-11T12:00:00');

describe('lastAiredEpisode', () => {
  it('uses the episode count for finished shows', () => {
    expect(lastAiredEpisode({ status: 'finished', episodeCount: 25, startDate: '2013-04-07' }, undefined, now)).toEqual(
      { aired: 25, estimated: false },
    );
    expect(needsEpisodeList({ status: 'finished' })).toBe(false);
  });

  it('returns null for a finished show with unknown length', () => {
    expect(lastAiredEpisode({ status: 'finished', episodeCount: null, startDate: null }, undefined, now)).toBeNull();
  });

  it('takes the last episode aired on or before today, ignoring future and undated ones', () => {
    const show = { status: 'current', episodeCount: 12, startDate: '2026-09-01' } as const;
    const episodes = [
      { number: 7, airdate: null },
      { number: 6, airdate: '2026-10-12' },
      { number: 5, airdate: '2026-10-11' },
      { number: 4, airdate: '2026-10-04' },
    ];
    expect(needsEpisodeList(show)).toBe(true);
    expect(lastAiredEpisode(show, episodes, now)).toEqual({ aired: 5, estimated: false });
  });

  it('estimates one episode per week from the start date when no dates are known', () => {
    const show = { status: 'current', episodeCount: 12, startDate: '2026-09-20' } as const;
    // 21 days since start: episodes on day 0, 7, 14, 21.
    expect(lastAiredEpisode(show, [{ number: 1, airdate: null }], now)).toEqual({ aired: 4, estimated: true });
    expect(lastAiredEpisode(show, [], now)).toEqual({ aired: 4, estimated: true });
  });

  it('caps the estimate at the episode count', () => {
    const show = { status: 'current', episodeCount: 12, startDate: '2025-01-01' } as const;
    expect(lastAiredEpisode(show, [], now)).toEqual({ aired: 12, estimated: true });
  });

  it('does not cap when the episode count is unknown', () => {
    const show = { status: 'current', episodeCount: null, startDate: '2026-01-04' } as const;
    expect(lastAiredEpisode(show, undefined, now)?.aired).toBe(41);
  });

  it('returns 0 for shows that have not started', () => {
    expect(lastAiredEpisode({ status: 'upcoming', episodeCount: 12, startDate: '2027-01-01' }, undefined, now)).toEqual(
      { aired: 0, estimated: false },
    );
    expect(lastAiredEpisode({ status: 'current', episodeCount: 12, startDate: '2026-12-01' }, [], now)).toEqual({
      aired: 0,
      estimated: true,
    });
  });
});

describe('behindBy', () => {
  it('never goes negative', () => {
    expect(behindBy(10, 7)).toBe(3);
    expect(behindBy(10, 10)).toBe(0);
    expect(behindBy(10, 12)).toBe(0);
  });
});
