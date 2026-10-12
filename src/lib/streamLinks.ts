// Helpers for "where to watch" links. Pure functions so they can be unit-tested.

import {
  siAppletv,
  siBilibili,
  siCrunchyroll,
  siHbomax,
  siNetflix,
  siParamountplus,
  siYoutube,
  type SimpleIcon,
} from 'simple-icons';

/** A streaming service the app recognises, by hostname or by the link's name. */
export interface StreamingService {
  name: string;
  /** Hostname suffixes: "netflix.com" also matches "www.netflix.com". */
  hosts: readonly string[];
  /** Other ways people write the name ("iqiyi", "prime"); compared ignoring case, spaces and punctuation. */
  aliases?: readonly string[];
  /** Official logo from Simple Icons, when the brand is in it. Otherwise the site's own favicon is shown. */
  icon: SimpleIcon | null;
}

/** Services common in Thailand and worldwide. Order matters only when two could match. */
const STREAMING_SERVICES: readonly StreamingService[] = [
  { name: 'Netflix', hosts: ['netflix.com'], icon: siNetflix },
  { name: 'Crunchyroll', hosts: ['crunchyroll.com'], icon: siCrunchyroll },
  { name: 'YouTube', hosts: ['youtube.com', 'youtu.be'], icon: siYoutube },
  { name: 'Bilibili', hosts: ['bilibili.tv', 'bilibili.com', 'b23.tv'], aliases: ['bstation'], icon: siBilibili },
  { name: 'iQIYI', hosts: ['iq.com', 'iqiyi.com'], aliases: ['iqiyi', 'iq'], icon: null },
  { name: 'Prime Video', hosts: ['primevideo.com'], aliases: ['amazon prime', 'prime', 'amazon prime video'], icon: null },
  { name: 'Disney+', hosts: ['disneyplus.com', 'hotstar.com'], aliases: ['disney plus', 'disney', 'disney+ hotstar'], icon: null },
  { name: 'HBO Max', hosts: ['hbomax.com', 'max.com'], aliases: ['max', 'hbo'], icon: siHbomax },
  { name: 'Apple TV', hosts: ['tv.apple.com'], aliases: ['apple tv+', 'appletv'], icon: siAppletv },
  { name: 'Paramount+', hosts: ['paramountplus.com'], aliases: ['paramount plus', 'paramount'], icon: siParamountplus },
  { name: 'Viu', hosts: ['viu.com'], icon: null },
  { name: 'WeTV', hosts: ['wetv.vip'], icon: null },
  { name: 'TrueID', hosts: ['trueid.net'], aliases: ['true id'], icon: null },
  { name: 'HIDIVE', hosts: ['hidive.com'], icon: null },
  { name: 'Hulu', hosts: ['hulu.com'], icon: null },
  { name: 'Ani-One', hosts: ['ani-one.com'], aliases: ['anione', 'ani one asia'], icon: null },
  { name: 'Muse Asia', hosts: ['museasia.com'], aliases: ['muse', 'muse thailand'], icon: null },
];

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9+]/g, '');

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Which service a link belongs to: by hostname first (reliable), then by its name, so a link
 * labelled "Netflix" still gets the Netflix logo when the URL is a short link.
 */
export function findService(url: string, label = ''): StreamingService | null {
  const host = hostOf(url);
  if (host) {
    const byHost = STREAMING_SERVICES.find((s) => s.hosts.some((h) => host === h || host.endsWith(`.${h}`)));
    if (byHost) return byHost;
  }
  const key = squash(label);
  if (!key) return null;
  return STREAMING_SERVICES.find((s) => squash(s.name) === key || s.aliases?.some((a) => squash(a) === key)) ?? null;
}

// Lives in sharedLinks.ts so the dev-server plugin can use it without pulling in Simple Icons.
export { normalizeStreamUrl } from './sharedLinks';

/** "Netflix" for netflix.com links, otherwise the bare hostname ("example.org"). */
export function serviceName(url: string): string {
  return findService(url)?.name ?? hostOf(url) ?? url;
}

/**
 * Icon for services without a Simple Icons logo and for unknown sites: Google's favicon service at
 * 128 px, which usually returns the site's square app icon, so it fills the tile like the official logos.
 * A recognised service uses its main domain, so a short link labelled "Disney+" still shows Disney+.
 */
export function faviconUrl(url: string, service: StreamingService | null = findService(url)): string | null {
  const host = service?.hosts[0] ?? hostOf(url);
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128` : null;
}
