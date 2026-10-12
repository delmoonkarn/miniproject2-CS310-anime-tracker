import { useState } from 'react';
import { faviconUrl, findService } from '../lib/streamLinks';

/**
 * Logo for a streaming link: the official brand mark (Simple Icons) in the brand colour when known,
 * otherwise the site's favicon, and the first letter of the name if that fails to load.
 */
export function ServiceLogo({ url, label, className = 'size-5' }: { url: string; label: string; className?: string }) {
  const service = findService(url, label);
  const favicon = faviconUrl(url, service);
  const [failed, setFailed] = useState<string | null>(null);
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
  if (favicon && failed !== favicon) {
    return (
      <span className={`${base} bg-white`} aria-hidden>
        <img src={favicon} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(favicon)} className="size-[78%] object-contain" />
      </span>
    );
  }
  return (
    <span className={`${base} bg-base-300 text-[0.6rem] font-bold text-base-content/70`} aria-hidden>
      {(service?.name ?? label).trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
