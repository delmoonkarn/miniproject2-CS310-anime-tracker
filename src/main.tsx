import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { queryClient } from './api/queries';
import { router } from './routes/router';
import { useLibraryStore, type Theme } from './store/useLibraryStore';
import './index.css';

// Applied outside React so the persisted theme is in place before the first paint.
const applyTheme = (theme: Theme) => document.documentElement.setAttribute('data-theme', theme);
applyTheme(useLibraryStore.getState().theme);
useLibraryStore.subscribe((s) => applyTheme(s.theme));

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing from index.html');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
