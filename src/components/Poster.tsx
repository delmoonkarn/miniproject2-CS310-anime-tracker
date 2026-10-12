import { useState } from 'react';
import { Icon } from './Icon';

export function Poster({ src, title, className = '' }: { src: string | null; title: string; className?: string }) {
  // Newer Kitsu posters are signed URLs that expire after ~15 min, so a cached one can 403.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1.5 bg-base-300/60 p-2 text-center text-xs text-base-content/40 ${className}`}>
        <Icon name="logo" className="size-6" />
        No poster
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${title} poster`}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={`object-cover ${className}`}
    />
  );
}
