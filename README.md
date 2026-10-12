# Anime Tracker — Mini Project 2

A single-page app for tracking the anime you watch. It is built to show a clean split between **client state** (what *you* did: Zustand, persisted to localStorage) and **server state** (everything about the shows: TanStack Query, fetched from the [Kitsu API](https://kitsu.docs.apiary.io/)). There is no backend.

**Stack:** Vite · React 19 · TypeScript (strict) · React Router v7 (`createBrowserRouter`) · Zustand (`persist`) · TanStack Query v5 · Tailwind CSS v4 + DaisyUI 5 · Simple Icons · Vitest

## Setup

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (aired-episode logic, store, streaming links, JSON:API parsing)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

No API key is needed: the Kitsu endpoints used are public.

## Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Home | First row: **Trending this season**, the 10 most popular shows of the current season (one request, `sort=-userCount`) in a horizontal scroller with a *See more* link to Explore. Below: Kitsu's overall trending list as a grid, 6 rows at first (the column count follows the screen width) with **Show more** adding 6 rows at a time up to the top 60. No search or filters. |
| `/explore` | Explore: discover by season (items page) | Season and year pickers (`?season=fall&year=2026`, or `season=all` for the whole year), title search, format filters and a **Refresh** button, all in one row under the title. The current season also gets a **Continuing** block for older shows that are still airing. Old `/explore/season` links redirect here; `/explore/trending` redirects to `/`. |
| `/anime/:id` | Detail | Cover banner, synopsis, ratings, dates, trailer. Status select, progress stepper, favorite toggle and **Where to watch** (your own streaming links). **Back** returns to the page you came from, or to Explore on a direct visit. Handles invalid ids and 404s. |
| `/watchlist` | Watchlist (collection page) | Tabs built with `<NavLink>` and `<Outlet/>`. The index route redirects to `watching`. |
| `/watchlist/watching` | Watching | Grouped by the weekday of each show's next episode (Monday → Sunday, then "No upcoming episode"). Today's day is highlighted and scrolled into view on open. A sticky **day filter** (All days, Mon … Sun with counts, No date) shows a single day; it is kept in the URL (`?day=fri`, `?day=none`). Each row shows progress, last aired episode, next episode date, "behind by N" or "caught up", a − / + progress stepper and a ⋮ menu (complete, favorite, remove). |
| `/watchlist/interested` | Interested | Card grid. |
| `/watchlist/completed` | Completed | Card grid. |
| `/favorites` | Favorites (extended page) | Every show marked with a heart, kept separately from the watchlist. |
| `/about` | About | Team members (`src/data/members.ts`) and Kitsu attribution. |
| `/admin` | Edit links | Editor for the published streaming links (see below). In the nav only under `npm run dev`; read-only on the deployed site. |
| `*` | Not found | Unknown paths, including `/explore/<anything else>`. |

**Search everything:** the box in the navbar searches the whole Kitsu catalogue by title (`filter[text]`) and shows the results in a dropdown (poster, format, year, status, rating). It waits 300 ms after you stop typing, keeps the previous results visible while the next ones load, and supports ↑/↓, Enter and Esc. Press `/` anywhere to focus it. Picking a result opens its Detail page.

How the pages map to the assignment's five required pages: **Items** = Explore, **Detail** = `/anime/:id`, **Collection** = Watchlist, **About** = `/about`, **Extended page** = Favorites.

The Explore page:
- **Format** pills (TV, ONA, Movie, Special, OVA, Music, plus Continuing) with live counts. You can select several; **Clear** resets them.
- A search box that filters the loaded results by title.
- The grid is grouped into labelled sections: TV & ONA first, then *Movies*, *Specials & OVAs*, *Music* and *Continuing*.
- Shows already in your collection are outlined.

All filtering is done client-side on data already in the TanStack Query cache (`src/lib/discover.ts`, unit-tested), so it never triggers a request.

## State architecture: Zustand vs TanStack Query

| | Zustand (`src/store`) | TanStack Query (`src/api`) |
| --- | --- | --- |
| Owns | The user's collection: `entries` (status, progress, addedAt), `favoriteIds`, `streamLinks`, `theme` | All Kitsu data: lists, details, episodes |
| Source of truth | The browser (localStorage key `anime-tracker`) | Kitsu |
| Lifetime | Forever (persisted) | Cached with `staleTime` / `gcTime` |
| Never contains | Titles, posters, episode counts or any other API data | User choices |

The two meet only at render time. A component reads ids and progress from the store and passes the ids to query hooks. The Watching tab, for example, gets ids from `useCollectionIds('watching')` and then calls `useWatchingData(ids)`, which uses `useQueries`. Values derived from both sides (aired episode, next episode date, "behind by N") are computed during render and never stored.

**Store** (`src/store/useLibraryStore.ts`): the state and actions are typed explicitly as `LibraryState` and `LibraryActions`. The actions are `add`, `setStatus`, `setProgress` (clamped to `0..episodeCount` when the count is known), `increment` (+1, also clamped), `toggleFavorite`, `remove`, `addStreamLink` / `updateStreamLink` / `removeStreamLink` and `toggleTheme`. Selectors that return arrays use `useShallow`, so components don't re-render on unrelated changes.

**Queries** (`src/api/queryKeys.ts`, `src/api/queries.ts`):

- A query-key factory (`animeKeys`) creates every key. `animeKeys.detail(id)` is shared by the Detail page the Watchlist and the Favorites page, so each show is fetched once and then served from the cache.
- `staleTime` per query: trending 15 min, season lists and airing 30 min, detail 2 h, latest episodes 4 h.
- Global settings: `refetchOnWindowFocus: false`. `shouldRetry` retries network errors, 5xx and 429. It does not retry other 4xx errors (such as 404) or responses that fail to parse.

## Talking to Kitsu (JSON:API)

All requests go through one function, `kitsuFetch<T>(path, parse, signal)` in `src/api/client.ts`:

1. **Queue.** Requests run one at a time, at least **300 ms apart**. When the Watchlist or Favorites page fires many `useQueries` at once, they drain in order and never hit Kitsu in a burst. A query cancelled while it waits in the queue never reaches the network.
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
| Text search (`filter[text]`) ignores `page[offset]`: every offset returns the first page | The search dropdown shows the top 20 matches and the total, and suggests adding words, instead of paging through repeats |
| `/anime/:id/episodes` ignores `sort` | `/episodes?filter[mediaId]=…&sort=-number&page[limit]=20&fields[episodes]=number,airdate` fetches the 20 newest episodes in one request, even for 1000+ episode shows |
| Future episodes appear as placeholders with `airdate: null` | Ignored when finding the last aired episode |

## Last aired and next episode

`src/lib/airedEpisodes.ts` is pure and unit-tested (`airedEpisodes.test.ts`):

1. **Finished show:** aired = `episodeCount`. No episode request is made.
2. **Airing show** (`status === 'current'`): the highest `number` whose `airdate` is on or before today.
3. **Fallback:** if no episode has a usable date, estimate one episode per week since `startDate` (episode 1 airs on the start date), capped at `episodeCount`. Estimates are shown as **"≈ ep N"**. The fallback is also used if the episode request fails.
4. `behind = max(0, aired − progress)`, shown as a "Behind by N" badge or "Caught up".

### Next episode date (Watching tab and Detail page)

`nextEpisode()` in the same file works out when an airing show's next episode comes out, using the best source Kitsu has:

1. The earliest episode with an `airdate` after today (exact).
2. Kitsu's `nextRelease` timestamp, which includes a broadcast time (exact, but rarely filled).
3. One week after the last dated episode that has aired (estimate).
4. One episode a week from `startDate` (estimate). Nothing is shown if this would go past `episodeCount`.

The Watching tab groups shows by the weekday of this date (`groupByWeekday` in `src/lib/schedule.ts`, unit-tested). Estimates are shown with "≈", e.g. "Next: ≈ Ep 3 · Fri, Oct 16". In October 2026, none of the 20 most popular shows of the season had any of this data, so most shows get the weekly estimate. Breaks and delays aren't known to Kitsu, so they aren't reflected.

Aired and next-episode data live only in the TanStack Query cache (`animeKeys.latestEpisodes(id)`), never in Zustand. The Detail page uses the same query, so opening an airing show you watch costs no extra request.

### Streaming links ("Where to watch")

Kitsu doesn't say where a show is legally streamed in your region, so the Detail page shows links from two places (Netflix, Crunchyroll, a YouTube channel, …):

- **Published links** live in `src/data/streamLinks.json` (keyed by Kitsu id). They ship with the build, so every visitor of the deployed site sees them, read-only, at the top of the panel. They are static app data like `src/data/members.ts`: the JSON is validated by `parseSharedLinks` (`src/lib/sharedLinks.ts`), held in TanStack Query (`publishedLinksQuery`, `src/api/publishedLinks.ts`) and merged with the personal links at render time (`useWatchLinks`). They are never copied into Zustand. Unit tests check the file is valid and in its saved format.
- **Editing them:** run `npm run dev` and open **Edit links** (`/admin`). The page lists shows from the same queries as the rest of the app (a season like Explore, Trending like Home, Kitsu search, or only the shows that already have links), each with its links and an *Add link* form. Every change is saved straight away: a dev-server-only Vite plugin (`vite-plugins/streamLinksAdmin.ts`, `apply: 'serve'`) accepts a `PUT /__admin/stream-links` from the same origin, validates the body with the same `parseSharedLinks` and rewrites the JSON file. The save is optimistic (`useSavePublishedLinks`) and skips the page reload Vite would otherwise trigger. Commit and redeploy to publish. A production build has no such endpoint, and its `/admin` page is read-only.
- **Personal links** live in the store as `streamLinks: Record<animeId, { id, label, url }[]>`, persisted with everything else, and only exist in that browser. A personal link with the same URL as a published one isn't shown twice. Because they are keyed by Kitsu id, they appear on the Detail page however you open it (Explore, Watchlist, Favorites, a bookmark or a reload), and the first link (published or personal) becomes the logo button on the show's Watching row.
- `normalizeStreamUrl` (`src/lib/streamLinks.ts`, unit-tested) adds `https://` when it is missing and only accepts `http(s)` URLs, so a saved link can never be `javascript:`. Links open in a new tab with `rel="noopener noreferrer"`.
- The name is optional: `serviceName` fills in "Netflix", "Crunchyroll" and similar for known hosts, otherwise the hostname.
- **Logos:** `findService` (`src/lib/streamLinks.ts`, unit-tested) recognises a link by hostname, or by its name when the URL is a short link, among services common in Thailand: Netflix, Crunchyroll, YouTube, Bilibili, iQIYI, Prime Video, Disney+, HBO Max, Apple TV, Paramount+, Viu, WeTV, TrueID, HIDIVE, Hulu, Ani-One and Muse Asia. `ServiceLogo` shows the official brand mark from [Simple Icons](https://simpleicons.org) (CC0 icon data; the trademarks belong to their owners) in the brand colour for Netflix, Crunchyroll, YouTube, Bilibili, HBO Max, Apple TV and Paramount+. Brands Simple Icons doesn't include (iQIYI, Prime Video, Disney+, Viu, WeTV, TrueID, …) and unknown sites show the site's own favicon, fetched through DuckDuckGo's icon service, with the first letter as a last fallback.
- Like favorites, links are independent of the watchlist: removing a show keeps them.

## UX

- Every API-backed view has a skeleton while loading (card grid, Watching rows, detail layout).
- Error states have a working **Retry** button and messages specific to the error type.
- Empty states cover a season with no shows, filters that match nothing, empty Watchlist tabs, no favorites and an empty Watching list.
- Responsive layout: the card grid has 2 to 6 columns depending on width, the navbar collapses into a dropdown on mobile, and on the Detail page the tracking panel moves from the sidebar to under the title on small screens.
- Light/dark theme toggle, persisted in the store and applied before the first paint. Both themes are custom DaisyUI themes in `src/index.css` (slate neutrals, indigo primary, Inter font); pages sit on `base-200` and panels use the `surface` utility (`base-100` with a hairline border).
- Icons are inline SVGs (`src/components/Icon.tsx`), so there is no icon dependency and no emoji in the UI.

## Project structure

```
src/
  api/         client.ts (kitsuFetch + queue), errors.ts, guards.ts (JSON:API unwrapping),
               endpoints.ts, queryKeys.ts, queries.ts (queryOptions + QueryClient), hooks.ts
  types/       kitsu.ts (JSON:API + Kitsu interfaces)
  store/       useLibraryStore.ts (Zustand + persist), selectors.ts
  lib/         airedEpisodes.ts, schedule.ts, discover.ts, season.ts, streamLinks.ts (each + test), format.ts
  hooks/       useMediaQuery.ts
  components/  AnimeCard, DiscoverResults, LibraryGrid, LibraryControls, StreamLinks, PageHeader, Icon, Poster,
               States (skeleton/error/empty)
  pages/       Home, AnimeDetail, Favorites, About, NotFound, RouteError, watchlist/*, explore/*
  routes/      router.tsx, RootLayout.tsx
  data/        members.ts, streamLinks.json (published streaming links) + streamLinks.ts (loads and validates it)
vite-plugins/  streamLinksAdmin.ts (dev-server endpoint that saves streamLinks.json)
data/sample-anime.json   25 real trending items in Kitsu's JSON:API shape (also used by a parser test)
screenshots/             app screenshots
```

## Assumptions

- **Home vs. Explore:** `/` shows the trending list as a plain grid. Explore is the items page in the rubric sense (search, filters, 20+ items in every season). Data refreshes on its own through each query's `staleTime`, so there is no Refresh button.
- **Card actions:** the "Add to list" menu sets *Watching*, *Interested* or *Completed*, or removes the show. The heart button on the poster toggles the favorite.
- **Watching rows:** a − / + stepper for episodes watched (clamped to the episode count) and a ⋮ menu with Mark completed, Favorite and Remove.
- **Marking completed** fills progress to the episode count when Kitsu knows it.
- **Favorites are independent:** removing a show from the watchlist keeps its favorite, and you can favorite a show without adding it.
- **Long-running shows** (One Piece and similar): Kitsu often lists recent episodes without airdates, so the Watching tab shows an estimate ("≈").
- **Season lists:** Kitsu caps pages at 20, so a season is fetched as up to 8 pages through the request queue, which takes a few seconds the first time. Kitsu sometimes ignores `page[offset]` and repeats a page. Results are de-duplicated by id, so a season can show slightly fewer shows than Kitsu reports in total.
- **Poster URLs:** newer Kitsu posters are signed URLs that expire after about 15 minutes. If a cached URL has expired, the card shows a "No poster" placeholder.
- The Explore page takes its layout and filtering from the group's earlier app (season/year pickers, format pills, grouped grid). The tag filter was left out, as the brief requires.
- Team details in `src/data/members.ts` are placeholders. To use real photos, put them in `public/members/` and set `photo: '/members/name.jpg'`.

## Attribution

Anime data, posters and ratings come from [Kitsu](https://kitsu.app) ([API docs](https://kitsu.docs.apiary.io/)). This project is not affiliated with Kitsu.
