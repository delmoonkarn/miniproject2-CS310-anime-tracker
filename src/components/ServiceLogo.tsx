import { useState } from 'react';
import { faviconUrl, findService } from '../lib/streamLinks';

/**
 * Logo for a streaming link, always a full rounded tile: the official brand mark (Simple Icons) in the
 * brand colour when known, otherwise the site's own icon filling the tile, and the first letter of the
 * name when there is no icon.
 */
export function ServiceLogo({ url, label, className = 'size-5' }: { url: string; label: string; className?: string }) {
  const service = findService(url, label);
  const icon = faviconUrl(url, service);
  // The icon URL that turned out to have no real icon (load error or Google's default globe).
  const [missing, setMissing] = useState<string | null>(null);
  const src = icon !== missing ? icon : null;
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
          onError={() => setMissing(src)}
          // Google answers "no icon" with a 16 px default globe that loads fine; show the letter instead.
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth <= 16) setMissing(src);
          }}
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
