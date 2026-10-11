import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Client state only: what the user did. Titles, posters, episode counts etc. live in TanStack Query.

export type WatchStatus = 'watching' | 'interested' | 'completed';
export type Theme = 'light' | 'dark';

export interface LibraryEntry {
  status: WatchStatus;
  /** Episodes watched. */
  progress: number;
  addedAt: number;
}

export interface LibraryState {
  /** Keyed by Kitsu anime id. */
  entries: Record<number, LibraryEntry>;
  favoriteIds: number[];
  theme: Theme;
}

export interface LibraryActions {
  add: (id: number, status?: WatchStatus) => void;
  /** Adds the show if it isn't in the collection yet. "completed" fills progress to `total` when it is known. */
  setStatus: (id: number, status: WatchStatus, total?: number | null) => void;
  /** `total` is the episode count when known; progress is clamped to 0..total. */
  setProgress: (id: number, progress: number, total: number | null) => void;
  increment: (id: number, total: number | null) => void;
  toggleFavorite: (id: number) => void;
  /** Removes the entry. Favorites are independent and stay. */
  remove: (id: number) => void;
  toggleTheme: () => void;
}

export type LibraryStore = LibraryState & LibraryActions;

export const WATCH_STATUSES: readonly WatchStatus[] = ['watching', 'interested', 'completed'];

export const isWatchStatus = (v: unknown): v is WatchStatus => WATCH_STATUSES.some((s) => s === v);

export function clampProgress(progress: number, total: number | null): number {
  const max = total ?? Number.POSITIVE_INFINITY;
  return Math.min(Math.max(0, Math.floor(progress)), max);
}

const prefersDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      entries: {},
      favoriteIds: [],
      theme: prefersDark() ? 'dark' : 'light',

      add: (id, status = 'interested') =>
        set((s) =>
          s.entries[id] ? s : { entries: { ...s.entries, [id]: { status, progress: 0, addedAt: Date.now() } } },
        ),

      setStatus: (id, status, total = null) =>
        set((s) => {
          const entry = s.entries[id] ?? { status, progress: 0, addedAt: Date.now() };
          const progress = status === 'completed' && total !== null ? total : entry.progress;
          return { entries: { ...s.entries, [id]: { ...entry, status, progress } } };
        }),

      setProgress: (id, progress, total) =>
        set((s) => {
          const entry = s.entries[id];
          if (!entry) return s;
          return { entries: { ...s.entries, [id]: { ...entry, progress: clampProgress(progress, total) } } };
        }),

      increment: (id, total) =>
        set((s) => {
          const entry = s.entries[id];
          if (!entry) return s;
          return { entries: { ...s.entries, [id]: { ...entry, progress: clampProgress(entry.progress + 1, total) } } };
        }),

      toggleFavorite: (id) =>
        set((s) => ({
          favoriteIds: s.favoriteIds.includes(id) ? s.favoriteIds.filter((f) => f !== id) : [...s.favoriteIds, id],
        })),

      remove: (id) =>
        set((s) => {
          const { [id]: _removed, ...entries } = s.entries;
          return { entries };
        }),

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'anime-tracker', version: 1 },
  ),
);
