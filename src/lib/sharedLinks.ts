// Published streaming links: validation and the JSON file format (src/data/streamLinks.json).
// Kept free of browser and React imports, because the dev-server plugin in vite-plugins/ uses it too.

export interface SharedStreamLink {
  label: string;
  url: string;
}

/** Keyed by Kitsu anime id. */
export type SharedLinkMap = Record<number, SharedStreamLink[]>;

export const MAX_LABEL_LENGTH = 40;

/** Dev-server route that saves the file (vite-plugins/streamLinksAdmin.ts). Not present in production. */
export const STREAM_LINKS_ENDPOINT = '/__admin/stream-links';

/**
 * Turns user input into a safe absolute URL, or null. A missing scheme gets "https://".
 * Only http(s) is accepted, so a stored link can never be a `javascript:` or `data:` URL.
 */
export function normalizeStreamUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  // A host without a dot ("https://netflix") is almost always a typo; localhost is the exception.
  if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
  return url.href;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Validates data read from the JSON file or sent to the dev server. Throws an Error naming the
 * first problem. Shows with no links are dropped.
 */
export function parseSharedLinks(data: unknown): SharedLinkMap {
  if (!isRecord(data)) throw new Error('Expected an object keyed by anime id.');
  const out: SharedLinkMap = {};
  for (const [key, links] of Object.entries(data)) {
    const id = Number(key);
    if (!/^\d+$/.test(key) || !Number.isSafeInteger(id) || id <= 0) throw new Error(`"${key}" is not a Kitsu anime id.`);
    if (!Array.isArray(links)) throw new Error(`Links for ${key} must be a list.`);
    const parsed: SharedStreamLink[] = links.map((l: unknown, i) => {
      if (!isRecord(l) || typeof l.label !== 'string' || typeof l.url !== 'string') {
        throw new Error(`Link ${i + 1} of ${key} needs a label and a url.`);
      }
      const label = l.label.trim();
      if (!label || label.length > MAX_LABEL_LENGTH) throw new Error(`Link ${i + 1} of ${key} needs a name of 1–${MAX_LABEL_LENGTH} characters.`);
      const url = normalizeStreamUrl(l.url);
      if (url === null) throw new Error(`Link ${i + 1} of ${key} is not a valid http(s) URL.`);
      return { label, url };
    });
    if (parsed.length > 0) out[id] = parsed;
  }
  return out;
}

/** The file's text: ids in ascending order, two-space indent, trailing newline, so diffs stay small. */
export function serializeSharedLinks(map: SharedLinkMap): string {
  const sorted: Record<string, SharedStreamLink[]> = {};
  for (const id of Object.keys(map).map(Number).sort((a, b) => a - b)) {
    const links = map[id];
    if (links && links.length > 0) sorted[String(id)] = links;
  }
  return `${JSON.stringify(sorted, null, 2)}\n`;
}
