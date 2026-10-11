import { describe, expect, it } from 'vitest';
import { behindBy, lastAiredEpisode, needsEpisodeList, nextEpisode } from './airedEpisodes';

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

describe('nextEpisode', () => {
  const ymd = (d: Date | undefined) => (d ? d.toLocaleDateString('en-CA') : null);

  it('ignores shows that are not airing', () => {
    expect(nextEpisode({ status: 'finished', episodeCount: 12, startDate: '2026-01-01', nextRelease: null }, [], now)).toBeNull();
    expect(nextEpisode({ status: 'upcoming', episodeCount: 12, startDate: '2027-01-01', nextRelease: null }, [], now)).toBeNull();
  });

  it('uses the earliest episode dated after today', () => {
    const show = { status: 'current', episodeCount: 10, startDate: '2026-08-01', nextRelease: null } as const;
    const episodes = [
      { number: 10, airdate: '2026-10-26' },
      { number: 9, airdate: '2026-10-19' },
      { number: 8, airdate: '2026-10-12' },
      { number: 7, airdate: '2026-10-11' },
    ];
    const next = nextEpisode(show, episodes, now);
    expect([next?.number, ymd(next?.date), next?.estimated, next?.hasTime]).toEqual([8, '2026-10-12', false, false]);
  });

  it("uses Kitsu's nextRelease timestamp when no future episode is dated", () => {
    const show = { status: 'current', episodeCount: null, startDate: '1999-10-20', nextRelease: '2026-10-18T09:30:00.000+09:00' } as const;
    const next = nextEpisode(show, [{ number: 1410, airdate: null }], now);
    expect(next).toMatchObject({ number: null, hasTime: true, estimated: false });
    expect(next?.date.toISOString()).toBe('2026-10-18T00:30:00.000Z');
  });

  it('estimates a week after the last dated episode, stepping past missed weeks', () => {
    const show = { status: 'current', episodeCount: 12, startDate: '2026-09-11', nextRelease: null } as const;
    const next = nextEpisode(show, [{ number: 6, airdate: null }, { number: 3, airdate: '2026-09-25' }], now);
    // Ep 3 on Sep 25 → ep 4 Oct 2, ep 5 Oct 9, ep 6 Oct 16.
    expect([next?.number, ymd(next?.date), next?.estimated]).toEqual([6, '2026-10-16', true]);
  });

  it('estimates weekly from the start date when nothing is dated', () => {
    const show = { status: 'current', episodeCount: 12, startDate: '2026-10-02', nextRelease: null } as const;
    const next = nextEpisode(show, [], now);
    // Ep 1 Oct 2, ep 2 Oct 9 → ep 3 Oct 16.
    expect([next?.number, ymd(next?.date), next?.estimated]).toEqual([3, '2026-10-16', true]);
  });

  it('counts an episode airing today as aired', () => {
    const show = { status: 'current', episodeCount: 12, startDate: '2026-10-04', nextRelease: null } as const;
    expect(ymd(nextEpisode(show, [], now)?.date)).toBe('2026-10-18');
  });

  it('gives episode 1 on the start date for a show that has not started', () => {
    const show = { status: 'current', episodeCount: 12, startDate: '2026-10-20', nextRelease: null } as const;
    const next = nextEpisode(show, undefined, now);
    expect([next?.number, ymd(next?.date)]).toEqual([1, '2026-10-20']);
  });

  it('returns null when the estimate passes the episode count', () => {
    const show = { status: 'current', episodeCount: 12, startDate: '2026-01-01', nextRelease: null } as const;
    expect(nextEpisode(show, [], now)).toBeNull();
  });
});
