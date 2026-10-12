import type { RelatedAnime, RelationRole } from '../types/kitsu';

export const RELATION_LABEL: Record<RelationRole, string> = {
  prequel: 'Prequel',
  sequel: 'Sequel',
  parent_story: 'Main story',
  side_story: 'Side story',
  full_story: 'Full story',
  summary: 'Recap',
  alternative_setting: 'Alternative setting',
  alternative_version: 'Alternative version',
  spinoff: 'Spin-off',
  adaptation: 'Adaptation',
  character: 'Shared characters',
  other: 'Other',
};

/** Display order: the story line first, then everything else. "character" (crossovers, ads) is left out. */
const ORDER: readonly RelationRole[] = [
  'prequel',
  'sequel',
  'parent_story',
  'full_story',
  'side_story',
  'spinoff',
  'alternative_setting',
  'alternative_version',
  'summary',
  'adaptation',
  'other',
];

const STORY_LINE: ReadonlySet<RelationRole> = new Set(['prequel', 'sequel']);

/**
 * Splits relations into the prequel/sequel line and everything else, each sorted by role, then by
 * start date (unknown dates last), and without duplicates (Kitsu sometimes lists a show twice).
 */
export function groupRelated(items: readonly RelatedAnime[]): { storyLine: RelatedAnime[]; other: RelatedAnime[] } {
  const seen = new Set<number>();
  const sorted = items
    .filter((r) => ORDER.includes(r.role))
    .sort(
      (a, b) =>
        ORDER.indexOf(a.role) - ORDER.indexOf(b.role) ||
        (a.anime.startDate ?? '9999').localeCompare(b.anime.startDate ?? '9999'),
    )
    .filter((r) => (seen.has(r.anime.id) ? false : (seen.add(r.anime.id), true)));
  return {
    storyLine: sorted.filter((r) => STORY_LINE.has(r.role)),
    other: sorted.filter((r) => !STORY_LINE.has(r.role)),
  };
}
