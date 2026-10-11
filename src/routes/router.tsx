import { Navigate, createBrowserRouter } from 'react-router';
import { RootLayout } from './RootLayout';
import { RouteError } from '../pages/RouteError';
import { AnimeDetailPage } from '../pages/AnimeDetailPage';
import { CollectionLayout } from '../pages/collection/CollectionLayout';
import { WatchingTab } from '../pages/collection/WatchingTab';
import { CollectionGridTab } from '../pages/collection/CollectionGridTab';
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
        path: 'collection',
        element: <CollectionLayout />,
        children: [
          { index: true, element: <Navigate to="watching" replace /> },
          { path: 'watching', element: <WatchingTab /> },
          { path: 'interested', element: <CollectionGridTab kind="interested" /> },
          { path: 'completed', element: <CollectionGridTab kind="completed" /> },
          { path: 'favorites', element: <CollectionGridTab kind="favorites" /> },
        ],
      },
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
