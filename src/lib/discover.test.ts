import { describe, expect, it } from 'vitest';
import sample from '../../data/sample-anime.json';
import { many, isAnimeAttributes } from '../api/guards';
import type { Anime, AnimeSubtype } from '../types/kitsu';
import { countFormats, groupIntoSections, matchesTitle } from './discover';

const base = many('anime', isAnimeAttributes)(sample).items[0];
if (!base) throw new Error('sample-anime.json is empty');
const make = (id: number, subtype: AnimeSubtype, title = `Show ${id}`): Anime => ({ ...base, id, subtype, canonicalTitle: title });

describe('discover grouping', () => {
  const items = [make(1, 'movie'), make(2, 'TV'), make(3, 'OVA'), make(4, 'ONA'), make(5, 'special'), make(6, 'TV')];

  it('counts formats in display order', () => {
    expect(countFormats(items)).toEqual([
      ['TV', 2],
      ['ONA', 1],
      ['movie', 1],
      ['special', 1],
      ['OVA', 1],
    ]);
  });

  it('groups into blocks with headings, keeping order inside each block', () => {
    const sections = groupIntoSections(items, [make(9, 'TV')]);
    expect(sections.map((s) => [s.heading, s.items.map((a) => a.id)])).toEqual([
      [null, [2, 4, 6]],
      ['Movies', [1]],
      ['Specials & OVAs', [3, 5]],
      ['Continuing', [9]],
    ]);
  });

  it('gives the first block no heading even when it is not TV', () => {
    expect(groupIntoSections([make(1, 'movie')], [])[0]?.heading).toBeNull();
  });

  it('matches canonical and English titles case-insensitively', () => {
    const a = { ...make(1, 'TV', 'Shingeki no Kyojin'), titles: { en: 'Attack on Titan' } };
    expect(matchesTitle(a, 'titan')).toBe(true);
    expect(matchesTitle(a, 'KYOJIN')).toBe(true);
    expect(matchesTitle(a, 'naruto')).toBe(false);
    expect(matchesTitle(a, '  ')).toBe(true);
  });
});
