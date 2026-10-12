// Helpers for the user's own "where to watch" links. Pure functions so they can be unit-tested.

/** Known services, matched on the hostname, so a pasted URL gets a readable default label. */
const KNOWN_SERVICES: [suffix: string, name: string][] = [
  ['netflix.com', 'Netflix'],
  ['crunchyroll.com', 'Crunchyroll'],
  ['youtube.com', 'YouTube'],
  ['youtu.be', 'YouTube'],
  ['bilibili.tv', 'Bilibili'],
  ['bilibili.com', 'Bilibili'],
  ['iq.com', 'iQIYI'],
  ['iqiyi.com', 'iQIYI'],
  ['disneyplus.com', 'Disney+'],
  ['primevideo.com', 'Prime Video'],
  ['amazon.com', 'Prime Video'],
  ['hidive.com', 'HIDIVE'],
  ['hulu.com', 'Hulu'],
  ['max.com', 'Max'],
  ['viu.com', 'Viu'],
  ['wetv.vip', 'WeTV'],
  ['trueid.net', 'TrueID'],
  ['ani-one.com', 'Ani-One'],
  ['museasia.com', 'Muse Asia'],
];

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

/** "Netflix" for netflix.com links, otherwise the bare hostname ("example.org"). */
export function serviceName(url: string): string {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return url;
  }
  const known = KNOWN_SERVICES.find(([suffix]) => host === suffix || host.endsWith(`.${suffix}`));
  return known ? known[1] : host;
}
