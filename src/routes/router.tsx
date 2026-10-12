import { Navigate, createBrowserRouter, useLocation } from 'react-router';
import { RootLayout } from './RootLayout';
import { RouteError } from '../pages/RouteError';
import { HomePage } from '../pages/HomePage';
import { AnimeDetailPage } from '../pages/AnimeDetailPage';
import { WatchlistLayout } from '../pages/watchlist/WatchlistLayout';
import { WatchingTab } from '../pages/watchlist/WatchingTab';
import { LibraryGrid } from '../components/LibraryGrid';
import { FavoritesPage } from '../pages/FavoritesPage';
import { ExplorePage } from '../pages/explore/ExplorePage';
import { AboutPage } from '../pages/AboutPage';
import { AdminLinksPage } from '../pages/AdminLinksPage';
import { NotFoundPage } from '../pages/NotFoundPage';

/** Old /explore/season?… links keep working; the query string (season, year) is carried over. */
function ToExplore() {
  const { search } = useLocation();
  return <Navigate to={`/explore${search}`} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'anime/:id', element: <AnimeDetailPage /> },
      {
        path: 'watchlist',
        element: <WatchlistLayout />,
        children: [
          { index: true, element: <Navigate to="watching" replace /> },
          { path: 'watching', element: <WatchingTab /> },
          { path: 'interested', element: <LibraryGrid kind="interested" /> },
          { path: 'completed', element: <LibraryGrid kind="completed" /> },
        ],
      },
      { path: 'favorites', element: <FavoritesPage /> },
      {
        path: 'explore',
        children: [
          { index: true, element: <ExplorePage /> },
          { path: 'season', element: <ToExplore /> },
          { path: 'trending', element: <Navigate to="/" replace /> },
        ],
      },
      { path: 'about', element: <AboutPage /> },
      { path: 'admin', element: <AdminLinksPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
