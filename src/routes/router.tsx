import { Navigate, createBrowserRouter } from 'react-router';
import { RootLayout } from './RootLayout';
import { RouteError } from '../pages/RouteError';
import { HomePage } from '../pages/HomePage';
import { AnimeDetailPage } from '../pages/AnimeDetailPage';
import { WatchlistLayout } from '../pages/WatchlistLayout';
import { WatchingTab } from '../pages/WatchingTab';
import { LibraryGrid } from '../components/LibraryGrid';
import { FavoritesPage } from '../pages/FavoritesPage';
import { ExplorePage } from '../pages/ExplorePage';
import { AboutPage } from '../pages/AboutPage';
import { AdminLinksPage } from '../pages/AdminLinksPage';
import { NotFoundPage } from '../pages/NotFoundPage';

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
      { path: 'explore', element: <ExplorePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'admin', element: <AdminLinksPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
