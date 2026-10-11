import { useLibraryStore } from '../store/useLibraryStore';
import { LibraryGrid } from '../components/LibraryGrid';

/** Every show marked ♥, whether or not it is on the watchlist. */
export function FavoritesPage() {
  const count = useLibraryStore((s) => s.favoriteIds.length);
  return (
    <section>
      <h1 className="text-3xl font-bold">
        Favorites <span className="badge badge-secondary align-middle">{count}</span>
      </h1>
      <p className="mb-6 text-base-content/70">Shows you marked with ♥. Favorites are kept separately from your watchlist.</p>
      <LibraryGrid kind="favorites" />
    </section>
  );
}
