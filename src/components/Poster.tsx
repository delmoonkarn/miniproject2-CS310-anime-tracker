export function Poster({ src, title, className = '' }: { src: string | null; title: string; className?: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-base-300 p-2 text-center text-xs ${className}`}>
        No poster
      </div>
    );
  }
  return <img src={src} alt={`${title} poster`} loading="lazy" className={`object-cover ${className}`} />;
}
