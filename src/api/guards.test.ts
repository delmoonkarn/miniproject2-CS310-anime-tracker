import { describe, expect, it } from 'vitest';
import sample from '../../data/sample-anime.json';
import { isAnimeAttributes, many, one, relatedAnime } from './guards';
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

describe('relatedAnime', () => {
  // Shape of a real /anime/50024/media-relationships?include=destination response, trimmed.
  const anime = sample.data[0];
  const doc = {
    data: [
      { id: '1', type: 'mediaRelationships', attributes: { role: 'prequel' }, relationships: { destination: { data: { type: 'anime', id: anime?.id } } } },
      { id: '2', type: 'mediaRelationships', attributes: { role: 'adaptation' }, relationships: { destination: { data: { type: 'manga', id: '27527' } } } },
      { id: '3', type: 'mediaRelationships', attributes: { role: 'made_up' }, relationships: { destination: { data: { type: 'anime', id: anime?.id } } } },
      { id: '4', type: 'mediaRelationships', attributes: { role: 'sequel' }, relationships: { destination: { data: { type: 'anime', id: '999999' } } } },
    ],
    included: [anime, { id: '27527', type: 'manga', attributes: { canonicalTitle: 'Black Clover' } }],
  };

  it('pairs anime destinations with their role and skips manga, unknown roles and missing includes', () => {
    const related = relatedAnime(doc);
    expect(related).toHaveLength(1);
    expect(related[0]?.role).toBe('prequel');
    expect(related[0]?.anime.id).toBe(Number(anime?.id));
  });

  it('throws a parse KitsuError for a document without data', () => {
    expect(() => relatedAnime({ included: [] })).toThrow(KitsuError);
  });
});
