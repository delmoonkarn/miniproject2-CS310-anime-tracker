import { useLibraryStore } from '../store/useLibraryStore';
import { LibraryGrid } from '../components/LibraryGrid';
import { PageHeader } from '../components/PageHeader';

/** Every show marked ♥, whether or not it is on the watchlist. */
export function FavoritesPage() {
  const count = useLibraryStore((s) => s.favoriteIds.length);
  return (
    <section>
      <PageHeader
        title="Favorites"
        count={count}
        description="Shows you marked with a heart. Favorites are kept separately from your watchlist."
      />
      <LibraryGrid kind="favorites" />
    </section>
  );
}
