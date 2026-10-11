# Anime Tracker — Mini Project 2

A single-page app for tracking the anime you watch. It is built to show a clean split between **client state** (what *you* did: Zustand, persisted to localStorage) and **server state** (everything about the shows: TanStack Query, fetched from the [Kitsu API](https://kitsu.docs.apiary.io/)). There is no backend.

**Stack:** Vite · React 19 · TypeScript (strict) · React Router v7 (`createBrowserRouter`) · Zustand (`persist`) · TanStack Query v5 · Tailwind CSS v4 + DaisyUI 5 · Vitest

## Setup

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (aired-episode logic, store, JSON:API parsing)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

No API key is needed: the Kitsu endpoints used are public.

## Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | | Redirects to `/explore/season`. |
| `/explore/season` | Explore: discover by season (items page) | Season and year pickers (`?season=fall&year=2026`, or `season=all` for the whole year). The current season also gets a **Continuing** block for older shows that are still airing. |
| `/explore/trending` | Explore: trending (items page) | Top 60 trending anime on Kitsu. Switch views with the buttons next to the page title. |
| `/anime/:id` | Detail | Synopsis, ratings, dates, trailer. Status select, progress stepper, favorite toggle. Handles invalid ids and 404s. |
| `/collection` | Collection layout | Tabs built with `<NavLink>` and `<Outlet/>`. The index route redirects to `watching`. |
| `/collection/watching` | Watching | Progress, last aired episode, "behind by N" or "caught up", and a +1 button. |
| `/collection/interested` | Interested | Card grid. |
| `/collection/completed` | Completed | Card grid. |
| `/collection/favorites` | Favorites | Card grid. |
| `/about` | About | Team members (`src/data/members.ts`) and Kitsu attribution. |
| `*` | Not found | Unknown paths, including `/explore/<anything else>`. |

Both Explore views share the same list:
- **Format** pills (TV, ONA, Movie, Special, OVA, Music, plus Continuing) with live counts. You can select several; **Clear** resets them.
- A search box that filters the loaded results by title.
- The grid is grouped into labelled sections: TV & ONA first, then *Movies*, *Specials & OVAs*, *Music* and *Continuing*.
- A **Refresh** button and an "updated N min ago" note.
- Shows already in your collection are outlined.

All filtering is done client-side on data already in the TanStack Query cache (`src/lib/discover.ts`, unit-tested), so it never triggers a request.

## State architecture: Zustand vs TanStack Query

| | Zustand (`src/store`) | TanStack Query (`src/api`) |
| --- | --- | --- |
| Owns | The user's collection: `entries` (status, progress, addedAt), `favoriteIds`, `theme` | All Kitsu data: lists, details, episodes |
| Source of truth | The browser (localStorage key `anime-tracker`) | Kitsu |
| Lifetime | Forever (persisted) | Cached with `staleTime` / `gcTime` |
| Never contains | Titles, posters, episode counts or any other API data | User choices |

The two meet only at render time. A component reads ids and progress from the store and passes the ids to query hooks. The Watching tab, for example, gets ids from `useCollectionIds('watching')` and then calls `useWatchingData(ids)`, which uses `useQueries`. Values derived from both sides (aired episode, "behind by N") are computed during render and never stored.

**Store** (`src/store/useLibraryStore.ts`): the state and actions are typed explicitly as `LibraryState` and `LibraryActions`. The actions are `add`, `setStatus`, `setProgress` (clamped to `0..episodeCount` when the count is known), `increment` (+1, also clamped), `toggleFavorite`, `remove` and `toggleTheme`. Selectors that return arrays use `useShallow`, so components don't re-render on unrelated changes.

**Queries** (`src/api/queryKeys.ts`, `src/api/queries.ts`):

- A query-key factory (`animeKeys`) creates every key. `animeKeys.detail(id)` is shared by the Detail page and all Collection tabs, so each show is fetched once and then served from the cache.
- `staleTime` per query: trending 15 min, season lists and airing 30 min, detail 2 h, latest episodes 4 h.
- Global settings: `refetchOnWindowFocus: false`. `shouldRetry` retries network errors, 5xx and 429. It does not retry other 4xx errors (such as 404) or responses that fail to parse.

## Talking to Kitsu (JSON:API)

All requests go through one function, `kitsuFetch<T>(path, parse, signal)` in `src/api/client.ts`:

1. **Queue.** Requests run one at a time, at least **300 ms apart**. When a Collection page fires many `useQueries` at once, they drain in order and never hit Kitsu in a burst. A query cancelled while it waits in the queue never reaches the network.
2. **Rate limits.** A `429` is retried up to 3 times with exponential backoff, or after the `Retry-After` delay when Kitsu sends one. The backoff holds the queue, so the whole app slows down rather than just one request.
3. **Typed errors.** Every failure becomes a `KitsuError` with `kind: 'network' | 'http' | 'parse'` and `status`. The UI uses it for distinct messages: network error, API error (HTTP n), rate limit, or unexpected response.
4. **Unwrapping.** The `parse` argument is built with `one(type, guard)` or `many(type, guard)` (`src/api/guards.ts`). These turn

   ```json
   { "data": [{ "id": "7442", "type": "anime", "attributes": { "canonicalTitle": "Attack on Titan", ... } }], "meta": { "count": 123 } }
   ```

   into `{ items: [{ id: 7442, canonicalTitle: "Attack on Titan", ... }], total: 123 }`.

   Type guards (`isAnimeAttributes`, `isEpisodeAttributes`) validate the attributes without casts. A malformed item in a list is skipped. A malformed single document throws a `parse` error.

The interfaces in `src/types/kitsu.ts` are hand-written from real responses (fetched October 2026) and checked against the docs:

| Finding | How the app handles it |
| --- | --- |
| `id` is a string | Converted to a number when unwrapping |
| `averageRating` is a percentage string (`"84.41"`) or `null` | Typed `string \| null` |
| `episodeCount` is `null` while a show is airing | Typed `number \| null` |
| `status` is one of `current \| finished \| tba \| unreleased \| upcoming` | Union type `AnimeStatus` |
| Dates are `"YYYY-MM-DD"` strings | Typed as nullable strings |
| `/anime` rejects `page[limit]` above 20 | Page size is **20** |
| `/trending/anime` takes `?limit=` but ignores offsets and returns no `meta`/`links` | The Trending view fetches the top 60 in one request. Season lists use `/anime` with `page[offset]` instead. |
| Episodes are numbered by the absolute `number` field | That field is used |
| `/anime/:id/episodes` ignores `sort` | `/episodes?filter[mediaId]=…&sort=-number&page[limit]=20&fields[episodes]=number,airdate` fetches the 20 newest episodes in one request, even for 1000+ episode shows |
| Future episodes appear as placeholders with `airdate: null` | Ignored when finding the last aired episode |

## Last aired episode (Watching tab)

`src/lib/airedEpisodes.ts` is pure and unit-tested (`airedEpisodes.test.ts`):

1. **Finished show:** aired = `episodeCount`. No episode request is made.
2. **Airing show** (`status === 'current'`): the highest `number` whose `airdate` is on or before today.
3. **Fallback:** if no episode has a usable date, estimate one episode per week since `startDate` (episode 1 airs on the start date), capped at `episodeCount`. Estimates are shown as **"≈ ep N"**. The fallback is also used if the episode request fails.
4. `behind = max(0, aired − progress)`, shown as a "Behind by N" badge or "Caught up".

Aired data lives only in the TanStack Query cache (`animeKeys.latestEpisodes(id)`), never in Zustand.

## UX

- Every API-backed view has a skeleton while loading (card grid, Watching rows, detail layout).
- Error states have a working **Retry** button and messages specific to the error type.
- Empty states cover a season with no shows, filters that match nothing, empty collection tabs and an empty Watching list.
- Responsive layout: the card grid has 1, 2, 3, 4 or 5 columns depending on width, and the navbar collapses into a dropdown on mobile.
- Light/dark theme toggle, persisted in the store and applied before the first paint.

## Project structure

```
src/
  api/         client.ts (kitsuFetch + queue), errors.ts, guards.ts (JSON:API unwrapping),
               endpoints.ts, queryKeys.ts, queries.ts (queryOptions + QueryClient), hooks.ts
  types/       kitsu.ts (JSON:API + Kitsu interfaces)
  store/       useLibraryStore.ts (Zustand + persist), selectors.ts
  lib/         airedEpisodes.ts (+ test), format.ts
  components/  AnimeCard, DiscoverResults, LibraryControls, Poster, States (skeleton/error/empty)
  pages/       AnimeDetail, About, NotFound, RouteError, collection/*, explore/*
  routes/      router.tsx, RootLayout.tsx
  data/        members.ts
data/sample-anime.json   25 real trending items in Kitsu's JSON:API shape (also used by a parser test)
screenshots/             app screenshots
```

## Assumptions

- **No separate home page:** `/` opens Explore, which serves as the items page (20+ items in every view).
- **Card actions:** the "+ Add ▾" menu adds a show as *Watching* or *Interested*, switches between them, or removes it. The ♥ button toggles the favorite. *Completed* and progress are set on the Detail page.
- **Favorites are independent:** removing a show from the collection keeps its favorite, and you can favorite a show without adding it.
- **Long-running shows** (One Piece and similar): Kitsu often lists recent episodes without airdates, so the Watching tab shows an estimate ("≈").
- **Season lists:** Kitsu caps pages at 20, so a season is fetched as up to 8 pages through the request queue, which takes a few seconds the first time. Kitsu sometimes ignores `page[offset]` and repeats a page. Results are de-duplicated by id, so a season can show slightly fewer shows than its total ("top 100 of 116").
- **Poster URLs:** newer Kitsu posters are signed URLs that expire after about 15 minutes. If a cached URL has expired, the card shows a "No poster" placeholder.
- The Explore page takes its layout and filtering from the group's earlier app (season/year pickers, format pills, grouped grid). The tag filter was left out, as the brief requires.
- Team details in `src/data/members.ts` are placeholders. To use real photos, put them in `public/members/` and set `photo: '/members/name.jpg'`.

## Attribution

Anime data, posters and ratings come from [Kitsu](https://kitsu.app) ([API docs](https://kitsu.docs.apiary.io/)). This project is not affiliated with Kitsu.
