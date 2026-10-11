import { describe, expect, it } from 'vitest';
import sample from '../../data/sample-anime.json';
import { isAnimeAttributes, many, one } from './guards';
import { KitsuError } from './errors';

describe('JSON:API unwrapping', () => {
  it('flattens a real Kitsu collection into typed items with numeric ids', () => {
    const page = many('anime', isAnimeAttributes)(sample);
    expect(page.items).toHaveLength(sample.data.length);
    expect(page.items.length).toBeGreaterThanOrEqual(20);
    expect(page.total).toBe(sample.meta.count);
    const first = page.items[0];
    expect(first?.id).toBe(Number(sample.data[0]?.id));
    expect(first?.canonicalTitle).toBe(sample.data[0]?.attributes.canonicalTitle);
  });

  it('skips malformed items but keeps the rest', () => {
    const page = many('anime', isAnimeAttributes)({ data: [sample.data[0], { id: 'x', type: 'anime', attributes: {} }] });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBeNull();
  });

  it('throws a parse KitsuError for a document of the wrong shape', () => {
    expect(() => one('anime', isAnimeAttributes)({ errors: [] })).toThrow(KitsuError);
    expect(() => many('anime', isAnimeAttributes)({ data: null })).toThrow(KitsuError);
  });
});
