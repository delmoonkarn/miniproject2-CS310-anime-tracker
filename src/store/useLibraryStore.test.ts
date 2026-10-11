import { beforeEach, describe, expect, it } from 'vitest';
import { clampProgress, useLibraryStore } from './useLibraryStore';

const { getState } = useLibraryStore;

describe('library store', () => {
  beforeEach(() => useLibraryStore.setState({ entries: {}, favoriteIds: [] }));

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
    expect(getState().entries[1]).toMatchObject({ status: 'watching', progress: 12 });
  });

  it('does not reset an existing entry when added again', () => {
    getState().add(1, 'watching');
    getState().setProgress(1, 5, null);
    getState().add(1);
    expect(getState().entries[1]).toMatchObject({ status: 'watching', progress: 5 });
  });

  it('setStatus creates missing entries; remove drops entry and favorite', () => {
    getState().setStatus(2, 'completed');
    getState().toggleFavorite(2);
    expect(getState().favoriteIds).toEqual([2]);
    getState().remove(2);
    expect(getState().entries[2]).toBeUndefined();
    expect(getState().favoriteIds).toEqual([]);
  });
});
