// Hand-written from real Kitsu responses (Oct 2026). Kitsu follows JSON:API:
// every resource is { id: string, type, attributes, relationships, links }.

// ---------- raw JSON:API envelope ----------

export interface JsonApiResource<TType extends string, TAttributes> {
  id: string;
  type: TType;
  attributes: TAttributes;
}

export interface JsonApiLinks {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
}

/** `/anime?...` and `/episodes?...` (paginated). `/trending/anime` has no meta/links. */
export interface JsonApiCollectionDocument<R> {
  data: R[];
  meta?: { count?: number };
  links?: JsonApiLinks;
}

export interface JsonApiSingleDocument<R> {
  data: R;
}

export interface JsonApiErrorObject {
  title?: string;
  detail?: string;
  code?: string;
  status?: string;
}

export interface JsonApiErrorDocument {
  errors: JsonApiErrorObject[];
}

// ---------- anime ----------

/** `current` = airing now. `tba`/`unreleased`/`upcoming` have not aired yet. */
export type AnimeStatus = 'current' | 'finished' | 'tba' | 'unreleased' | 'upcoming';
export type AgeRating = 'G' | 'PG' | 'R' | 'R18';
export type AnimeSubtype = 'ONA' | 'OVA' | 'TV' | 'movie' | 'music' | 'special';

export interface KitsuImageSet {
  tiny?: string;
  small?: string;
  medium?: string;
  large?: string;
  original?: string;
}

export interface AnimeAttributes {
  canonicalTitle: string;
  titles: Record<string, string | null>;
  synopsis: string | null;
  /** Percentage as a string, e.g. "84.41". null when nobody has rated it. */
  averageRating: string | null;
  /** null while a show is airing and its length is unknown. */
  episodeCount: number | null;
  episodeLength: number | null;
  status: AnimeStatus;
  /** "YYYY-MM-DD" */
  startDate: string | null;
  endDate: string | null;
  /** ISO timestamp of the next episode, rarely filled in. */
  nextRelease: string | null;
  ageRating: AgeRating | null;
  ageRatingGuide: string | null;
  subtype: AnimeSubtype;
  posterImage: KitsuImageSet | null;
  coverImage: KitsuImageSet | null;
  youtubeVideoId: string | null;
  popularityRank: number | null;
}

export type AnimeResource = JsonApiResource<'anime', AnimeAttributes>;

// ---------- episodes ----------

/** Requested with `fields[episodes]=number,airdate`. Future episodes exist as placeholders with airdate null. */
export interface EpisodeAttributes {
  /** Absolute episode number across the whole show (1-based). */
  number: number | null;
  /** "YYYY-MM-DD" */
  airdate: string | null;
}

export type EpisodeResource = JsonApiResource<'episodes', EpisodeAttributes>;

// ---------- unwrapped (what the app uses) ----------

/** A JSON:API resource flattened into its attributes, with a numeric id. */
export type Flat<A> = A & { id: number };

export type Anime = Flat<AnimeAttributes>;

// ---------- relations ----------

/** `role` of a `/media-relationships` resource: how the destination relates to the show. */
export type RelationRole =
  | 'prequel'
  | 'sequel'
  | 'parent_story'
  | 'side_story'
  | 'full_story'
  | 'summary'
  | 'alternative_setting'
  | 'alternative_version'
  | 'spinoff'
  | 'adaptation'
  | 'character'
  | 'other';

/** One related anime (manga destinations are dropped). */
export interface RelatedAnime {
  role: RelationRole;
  anime: Anime;
}
export type Episode = Flat<EpisodeAttributes>;

export interface Page<T> {
  items: T[];
  /** From `meta.count`, null when the endpoint doesn't report it (trending). */
  total: number | null;
}
