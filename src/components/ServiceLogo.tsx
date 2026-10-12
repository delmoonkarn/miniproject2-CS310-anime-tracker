import { useState } from 'react';
import { faviconUrls, findService } from '../lib/streamLinks';

/**
 * Logo for a streaming link, always a full rounded tile: the official brand mark (Simple Icons) in the
 * brand colour when known, otherwise the site's own icon filling the tile, and the first letter of the
 * name if no icon loads.
 */
export function ServiceLogo({ url, label, className = 'size-5' }: { url: string; label: string; className?: string }) {
  const service = findService(url, label);
  const sources = faviconUrls(url, service);
  // Icon URLs that failed to load; the next source is tried.
  const [failed, setFailed] = useState<readonly string[]>([]);
  const src = sources.find((s) => !failed.includes(s));
  const base = `inline-grid shrink-0 place-items-center overflow-hidden rounded-[22%] ${className}`;

  if (service?.icon) {
    return (
      <span className={base} style={{ backgroundColor: `#${service.icon.hex}` }} aria-hidden>
        <svg viewBox="0 0 24 24" fill="#fff" className="size-[62%]">
          <path d={service.icon.path} />
        </svg>
      </span>
    );
  }
  if (src) {
    return (
      // White only shows through icons with transparent parts.
      <span className={`${base} bg-white`} aria-hidden>
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed((f) => [...f, src])}
          className="size-full object-cover"
        />
      </span>
    );
  }
  return (
    <span className={`${base} bg-base-300 text-[0.6rem] font-bold text-base-content/70`} aria-hidden>
      {(service?.name ?? label).trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
