import { beforeEach, describe, expect, it } from 'vitest';
import { clampProgress, useLibraryStore } from './useLibraryStore';

const { getState } = useLibraryStore;

describe('library store', () => {
  beforeEach(() => useLibraryStore.setState({ entries: {}, favoriteIds: [], streamLinks: {} }));

  it('clamps progress to 0..total', () => {
    expect(clampProgress(-3, 12)).toBe(0);
    expect(clampProgress(15, 12)).toBe(12);
    expect(clampProgress(500, null)).toBe(500);
  });

  it('adds, steps progress and stops at the episode count', () => {
    getState().add(1, 'watching');
    getState().setProgress(1, 11, 12);
    getState().increment(1, 12);
    getState().increment(1, 12);
    expect(getState().entries[1]).toMatchObject({ status: 'completed', progress: 12 });
  });

  it('does not reset an existing entry when added again', () => {
    getState().add(1, 'watching');
    getState().setProgress(1, 5, null);
    getState().add(1);
    expect(getState().entries[1]).toMatchObject({ status: 'watching', progress: 5 });
  });

  it('marking completed fills progress only when the episode count is known', () => {
    getState().add(3, 'watching');
    getState().setProgress(3, 4, 12);
    getState().setStatus(3, 'completed', 12);
    expect(getState().entries[3]).toMatchObject({ status: 'completed', progress: 12 });
    getState().setStatus(4, 'completed', null);
    expect(getState().entries[4]?.progress).toBe(0);
  });

  it('setStatus creates missing entries; remove drops the entry but keeps the favorite', () => {
    getState().setStatus(2, 'completed');
    getState().toggleFavorite(2);
    getState().remove(2);
    expect(getState().entries[2]).toBeUndefined();
    expect(getState().favoriteIds).toEqual([2]);
  });

  it('adds, edits and removes streaming links per show, independent of the watchlist', () => {
    getState().add(5, 'watching');
    getState().addStreamLink(5, 'Netflix', 'https://www.netflix.com/title/1');
    getState().addStreamLink(5, 'YouTube', 'https://youtube.com/watch?v=x');
    const [first, second] = getState().streamLinks[5] ?? [];
    expect(first?.label).toBe('Netflix');
    expect(first?.id).not.toBe(second?.id);

    getState().updateStreamLink(5, second?.id ?? '', 'Muse Asia', 'https://youtube.com/@MuseAsia');
    expect(getState().streamLinks[5]?.[1]).toMatchObject({ label: 'Muse Asia', url: 'https://youtube.com/@MuseAsia' });

    getState().remove(5);
    expect(getState().streamLinks[5]).toHaveLength(2);

    getState().removeStreamLink(5, first?.id ?? '');
    getState().removeStreamLink(5, second?.id ?? '');
    expect(getState().streamLinks[5]).toBeUndefined();
  });

  it('marks a show completed when progress reaches the episode count, not before or when it is unknown', () => {
    getState().add(7, 'watching');
    getState().setProgress(7, 11, 12);
    expect(getState().entries[7]?.status).toBe('watching');
    getState().increment(7, 12);
    expect(getState().entries[7]).toMatchObject({ status: 'completed', progress: 12 });

    getState().add(8, 'interested');
    getState().setProgress(8, 30, 24);
    expect(getState().entries[8]).toMatchObject({ status: 'completed', progress: 24 });

    getState().add(9, 'watching');
    getState().setProgress(9, 500, null);
    expect(getState().entries[9]?.status).toBe('watching');
  });

  it('moves an interested show to watching when the first episode is watched', () => {
    getState().add(10, 'interested');
    getState().increment(10, 12);
    expect(getState().entries[10]).toMatchObject({ status: 'watching', progress: 1 });

    // A one-episode show goes straight to completed.
    getState().add(11, 'interested');
    getState().increment(11, 1);
    expect(getState().entries[11]?.status).toBe('completed');

    // Lowering a completed show to 0 and back up doesn't reopen it.
    getState().setStatus(12, 'completed');
    getState().setProgress(12, 1, null);
    expect(getState().entries[12]?.status).toBe('completed');
  });
});
