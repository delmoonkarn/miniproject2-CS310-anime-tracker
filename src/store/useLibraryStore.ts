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

/** A user-supplied "where to watch" link. `url` is always an http(s) URL (see normalizeStreamUrl). */
export interface StreamLink {
  id: string;
  label: string;
  url: string;
}

export interface LibraryState {
  /** Keyed by Kitsu anime id. */
  entries: Record<number, LibraryEntry>;
  favoriteIds: number[];
  /** Keyed by Kitsu anime id, independent of `entries` so links survive removing a show. */
  streamLinks: Record<number, StreamLink[]>;
  theme: Theme;
}

export interface LibraryActions {
  add: (id: number, status?: WatchStatus) => void;
  /** Adds the show if it isn't in the collection yet. "completed" fills progress to `total` when it is known. */
  setStatus: (id: number, status: WatchStatus, total?: number | null) => void;
  /**
   * `total` is the episode count when known; progress is clamped to 0..total.
   * Reaching the last episode marks the show completed.
   */
  setProgress: (id: number, progress: number, total: number | null) => void;
  increment: (id: number, total: number | null) => void;
  toggleFavorite: (id: number) => void;
  /** Removes the entry. Favorites are independent and stay. */
  remove: (id: number) => void;
  /** `url` must already be normalized. */
  addStreamLink: (animeId: number, label: string, url: string) => void;
  updateStreamLink: (animeId: number, linkId: string, label: string, url: string) => void;
  removeStreamLink: (animeId: number, linkId: string) => void;
  toggleTheme: () => void;
}

export type LibraryStore = LibraryState & LibraryActions;

export const WATCH_STATUSES: readonly WatchStatus[] = ['watching', 'interested', 'completed'];

export const isWatchStatus = (v: unknown): v is WatchStatus => WATCH_STATUSES.some((s) => s === v);

/** The entry with new progress; watching the last episode (when the count is known) marks it completed. */
function withProgress(entry: LibraryEntry, progress: number, total: number | null): LibraryEntry {
  const clamped = clampProgress(progress, total);
  const finished = total !== null && total > 0 && clamped >= total;
  return { ...entry, progress: clamped, status: finished ? 'completed' : entry.status };
}

export function clampProgress(progress: number, total: number | null): number {
  const max = total ?? Number.POSITIVE_INFINITY;
  return Math.min(Math.max(0, Math.floor(progress)), max);
}

const newLinkId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const prefersDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      entries: {},
      favoriteIds: [],
      streamLinks: {},
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
          return { entries: { ...s.entries, [id]: withProgress(entry, progress, total) } };
        }),

      increment: (id, total) =>
        set((s) => {
          const entry = s.entries[id];
          if (!entry) return s;
          return { entries: { ...s.entries, [id]: withProgress(entry, entry.progress + 1, total) } };
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

      addStreamLink: (animeId, label, url) =>
        set((s) => ({
          streamLinks: { ...s.streamLinks, [animeId]: [...(s.streamLinks[animeId] ?? []), { id: newLinkId(), label, url }] },
        })),

      updateStreamLink: (animeId, linkId, label, url) =>
        set((s) => ({
          streamLinks: {
            ...s.streamLinks,
            [animeId]: (s.streamLinks[animeId] ?? []).map((l) => (l.id === linkId ? { ...l, label, url } : l)),
          },
        })),

      removeStreamLink: (animeId, linkId) =>
        set((s) => {
          const { [animeId]: current = [], ...rest } = s.streamLinks;
          const kept = current.filter((l) => l.id !== linkId);
          return { streamLinks: kept.length > 0 ? { ...rest, [animeId]: kept } : rest };
        }),

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    // Older saves have no `streamLinks`; persist's shallow merge keeps the `{}` default for them.
    { name: 'anime-tracker', version: 1 },
  ),
);
