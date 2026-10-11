import { useState } from 'react';

export function Poster({ src, title, className = '' }: { src: string | null; title: string; className?: string }) {
  // Newer Kitsu posters are signed URLs that expire after ~15 min, so a cached one can 403.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className={`flex items-center justify-center bg-base-300 p-2 text-center text-xs ${className}`}>
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
