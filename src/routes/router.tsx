import { Navigate, createBrowserRouter } from 'react-router';
import { RootLayout } from './RootLayout';
import { RouteError } from '../pages/RouteError';
import { AnimeDetailPage } from '../pages/AnimeDetailPage';
import { WatchlistLayout } from '../pages/watchlist/WatchlistLayout';
import { WatchingTab } from '../pages/watchlist/WatchingTab';
import { LibraryGrid } from '../components/LibraryGrid';
import { FavoritesPage } from '../pages/FavoritesPage';
import { ExploreCategoryPage } from '../pages/explore/ExploreCategoryPage';
import { AboutPage } from '../pages/AboutPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/explore/season" replace /> },
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
          { index: true, element: <Navigate to="season" replace /> },
          { path: ':category', element: <ExploreCategoryPage /> },
        ],
      },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
