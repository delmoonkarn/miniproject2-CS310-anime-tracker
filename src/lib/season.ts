/** Kitsu's `filter[season]` values. Winter = Jan–Mar, Spring = Apr–Jun, Summer = Jul–Sep, Fall = Oct–Dec. */
export type Season = 'winter' | 'spring' | 'summer' | 'fall';

export const SEASONS: readonly Season[] = ['winter', 'spring', 'summer', 'fall'];

export const SEASON_LABEL: Record<Season, string> = { winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall' };

export const isSeason = (v: unknown): v is Season => SEASONS.some((s) => s === v);

export interface SeasonRef {
  season: Season;
  year: number;
}

export function currentSeason(now: Date = new Date()): SeasonRef {
  const season = SEASONS[Math.floor(now.getMonth() / 3)] ?? 'winter';
  return { season, year: now.getFullYear() };
}

export function nextSeason({ season, year }: SeasonRef): SeasonRef {
  const i = SEASONS.indexOf(season);
  return i === SEASONS.length - 1 ? { season: 'winter', year: year + 1 } : { season: SEASONS[i + 1] ?? 'winter', year };
}

/** First day of the season as "YYYY-MM-DD", comparable with Kitsu's startDate. */
export function seasonStart({ season, year }: SeasonRef): string {
  const month = SEASONS.indexOf(season) * 3 + 1;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}
