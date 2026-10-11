import type { Anime, AnimeSubtype } from '../types/kitsu';

export const FORMAT_ORDER: readonly AnimeSubtype[] = ['TV', 'ONA', 'movie', 'special', 'OVA', 'music'];

export const FORMAT_LABEL: Record<AnimeSubtype, string> = {
  TV: 'TV',
  ONA: 'ONA',
  OVA: 'OVA',
  movie: 'Movie',
  special: 'Special',
  music: 'Music',
};

const FORMAT_HEADING: Record<AnimeSubtype, string> = {
  TV: 'TV',
  ONA: 'ONA',
  OVA: 'OVAs',
  movie: 'Movies',
  special: 'Specials',
  music: 'Music',
};

/** Formats in the same block render together. TV + ONA share the first block (weekly series). */
const FORMAT_BLOCK: Record<AnimeSubtype, number> = { TV: 0, ONA: 0, movie: 1, special: 2, OVA: 2, music: 3 };
const CONTINUING_BLOCK = 4;
const UNKNOWN_BLOCK = 5;

const orderOf = (f: AnimeSubtype) => {
  const i = FORMAT_ORDER.indexOf(f);
  return i === -1 ? FORMAT_ORDER.length : i;
};

export function matchesTitle(anime: Anime, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [anime.canonicalTitle, anime.titles.en, anime.titles.en_jp].some((t) => t?.toLowerCase().includes(q));
}

/** How many items each format has, in display order. Only formats that occur are returned. */
export function countFormats(items: readonly Anime[]): [AnimeSubtype, number][] {
  const counts = new Map<AnimeSubtype, number>();
  for (const a of items) counts.set(a.subtype, (counts.get(a.subtype) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => orderOf(a) - orderOf(b));
}

export interface DiscoverSection {
  key: number;
  /** null for the first section, which needs no separator. */
  heading: string | null;
  items: Anime[];
}

/**
 * Splits results into blocks: TV & ONA, Movies, Specials & OVAs, Music, then the
 * long-runners from earlier seasons ("Continuing"). Order inside a block is kept (popularity).
 */
export function groupIntoSections(main: readonly Anime[], continuing: readonly Anime[]): DiscoverSection[] {
  const blocks = new Map<number, Anime[]>();
  const push = (block: number, a: Anime) => blocks.set(block, [...(blocks.get(block) ?? []), a]);
  for (const a of main) push(FORMAT_BLOCK[a.subtype] ?? UNKNOWN_BLOCK, a);
  for (const a of continuing) push(CONTINUING_BLOCK, a);

  return [...blocks]
    .sort(([a], [b]) => a - b)
    .map(([key, items], i) => {
      if (i === 0) return { key, heading: null, items };
      if (key === CONTINUING_BLOCK) return { key, heading: 'Continuing', items };
      const formats = [...new Set(items.map((a) => a.subtype))].sort((a, b) => orderOf(a) - orderOf(b));
      return { key, heading: formats.map((f) => FORMAT_HEADING[f] ?? f).join(' & '), items };
    });
}
