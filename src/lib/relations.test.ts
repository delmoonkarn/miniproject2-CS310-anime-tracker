import { describe, expect, it } from 'vitest';
import type { Anime, RelatedAnime, RelationRole } from '../types/kitsu';
import { groupRelated } from './relations';

const rel = (id: number, role: RelationRole, startDate: string | null): RelatedAnime => ({
  role,
  anime: { id, startDate } as Anime,
});

describe('groupRelated', () => {
  it('puts prequels then sequels in the story line, the rest after, by role then date', () => {
    const { storyLine, other } = groupRelated([
      rel(1, 'summary', '2013-07-07'),
      rel(2, 'sequel', '2019-04-01'),
      rel(3, 'side_story', null),
      rel(4, 'sequel', '2017-04-01'),
      rel(5, 'prequel', '2010-01-01'),
      rel(6, 'side_story', '2013-12-09'),
    ]);
    expect(storyLine.map((r) => r.anime.id)).toEqual([5, 4, 2]);
    expect(other.map((r) => r.anime.id)).toEqual([6, 3, 1]);
  });

  it('drops crossover "character" links and duplicates', () => {
    const { storyLine, other } = groupRelated([rel(1, 'character', null), rel(2, 'sequel', null), rel(2, 'side_story', null)]);
    expect(storyLine.map((r) => r.anime.id)).toEqual([2]);
    expect(other).toEqual([]);
  });
});
