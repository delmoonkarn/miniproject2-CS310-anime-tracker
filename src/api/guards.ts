import type {
  Anime,
  AnimeAttributes,
  AnimeStatus,
  EpisodeAttributes,
  Flat,
  JsonApiErrorDocument,
  Page,
  RelatedAnime,
  RelationRole,
} from '../types/kitsu';
import { KitsuError } from './errors';

// Type guards for Kitsu's JSON:API documents. They check the fields the UI relies on,
// so a schema change shows up as a clear "unexpected response" error instead of a crash deep in a component.

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isStringOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string';
const isNumberOrNull = (v: unknown): v is number | null => v === null || typeof v === 'number';

const ANIME_STATUSES: ReadonlySet<string> = new Set(['current', 'finished', 'tba', 'unreleased', 'upcoming']);
export const isAnimeStatus = (v: unknown): v is AnimeStatus => typeof v === 'string' && ANIME_STATUSES.has(v);

export function isAnimeAttributes(v: unknown): v is AnimeAttributes {
  return (
    isRecord(v) &&
    typeof v.canonicalTitle === 'string' &&
    isStringOrNull(v.synopsis) &&
    isStringOrNull(v.averageRating) &&
    isNumberOrNull(v.episodeCount) &&
    isAnimeStatus(v.status) &&
    isStringOrNull(v.startDate) &&
    isStringOrNull(v.endDate) &&
    isStringOrNull(v.ageRating) &&
    isStringOrNull(v.youtubeVideoId) &&
    (v.posterImage === null || isRecord(v.posterImage))
  );
}

export function isEpisodeAttributes(v: unknown): v is EpisodeAttributes {
  return isRecord(v) && isNumberOrNull(v.number) && isStringOrNull(v.airdate);
}

export function isJsonApiErrorDocument(v: unknown): v is JsonApiErrorDocument {
  return isRecord(v) && Array.isArray(v.errors);
}

// ---------- JSON:API unwrapping ----------

export type Parser<T> = (json: unknown) => T;
type AttributesGuard<A> = (v: unknown) => v is A;

/** Turns `{ id: "7442", type, attributes: {...} }` into `{ id: 7442, ...attributes }`, or null if it doesn't match. */
function flatten<A>(resource: unknown, type: string, isAttributes: AttributesGuard<A>): Flat<A> | null {
  if (!isRecord(resource) || resource.type !== type || typeof resource.id !== 'string') return null;
  const id = Number(resource.id);
  if (!Number.isInteger(id) || !isAttributes(resource.attributes)) return null;
  return { ...resource.attributes, id };
}

/** Parser for a single-resource document: `{ data: {...} }`. */
export function one<A>(type: string, isAttributes: AttributesGuard<A>): Parser<Flat<A>> {
  return (json) => {
    const item = isRecord(json) ? flatten(json.data, type, isAttributes) : null;
    if (!item) throw new KitsuError('parse', `Unexpected response shape for ${type}.`);
    return item;
  };
}

/** Parser for a collection document: `{ data: [...], meta: { count } }`. Malformed items are skipped, not fatal. */
export function many<A>(type: string, isAttributes: AttributesGuard<A>): Parser<Page<Flat<A>>> {
  return (json) => {
    if (!isRecord(json) || !Array.isArray(json.data)) {
      throw new KitsuError('parse', `Unexpected response shape for ${type} list.`);
    }
    const items = json.data
      .map((r) => flatten(r, type, isAttributes))
      .filter((r): r is Flat<A> => r !== null);
    const total = isRecord(json.meta) && typeof json.meta.count === 'number' ? json.meta.count : null;
    return { items, total };
  };
}

// ---------- relations ----------

const RELATION_ROLES: ReadonlySet<string> = new Set([
  'prequel', 'sequel', 'parent_story', 'side_story', 'full_story', 'summary',
  'alternative_setting', 'alternative_version', 'spinoff', 'adaptation', 'character', 'other',
]);
const isRelationRole = (v: unknown): v is RelationRole => typeof v === 'string' && RELATION_ROLES.has(v);

/**
 * Parser for `/anime/:id/media-relationships?include=destination`: pairs each relationship's `role`
 * with its destination from `included`. Manga destinations, unknown roles and malformed entries are skipped.
 */
export const relatedAnime: Parser<RelatedAnime[]> = (json) => {
  if (!isRecord(json) || !Array.isArray(json.data)) {
    throw new KitsuError('parse', 'Unexpected response shape for related anime.');
  }
  const animeById = new Map<number, Anime>();
  for (const r of Array.isArray(json.included) ? json.included : []) {
    const anime = flatten(r, 'anime', isAnimeAttributes);
    if (anime) animeById.set(anime.id, anime);
  }
  const out: RelatedAnime[] = [];
  for (const rel of json.data) {
    if (!isRecord(rel) || !isRecord(rel.attributes) || !isRecord(rel.relationships)) continue;
    const role = rel.attributes.role;
    const destination = rel.relationships.destination;
    const target = isRecord(destination) ? destination.data : null;
    if (!isRelationRole(role) || !isRecord(target) || target.type !== 'anime') continue;
    const anime = animeById.get(Number(target.id));
    if (anime) out.push({ role, anime });
  }
  return out;
};
