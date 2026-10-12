# Anime Tracker

Mini Project 2. Web app for tracking anime you're watching. Data from the [Kitsu API](https://kitsu.docs.apiary.io/).

React 19 + Vite + TypeScript, React Router v7, Zustand, TanStack Query, Tailwind + DaisyUI.

## Run

```bash
npm install
npm run dev
```

Opens on http://localhost:5173. `npm test` runs the tests, `npm run build` builds to `dist/`.

## Pages

- `/` home, popular this season + trending
- `/explore` browse by season/year, search and filter by format (items page)
- `/anime/:id` detail page
- `/watchlist` watching / interested / completed (collection page)
- `/favorites` favorites (extended page)
- `/about` team + API credit
- `/admin` edit streaming links (dev only)

## State

Zustand (`src/store/useLibraryStore.ts`) only keeps user stuff: watchlist status and episode progress, favorite ids, personal streaming links and theme. Saved to localStorage with `persist`. Anime data is never put in the store, only ids.

TanStack Query (`src/api/`) handles everything from Kitsu. staleTime is set per query: trending 15 min, seasons 30 min, details 2 h, episodes 4 h. Query keys are in `queryKeys.ts` so pages share the same cache.

## Kitsu notes

- Kitsu returns max 20 items per request, so a season is loaded in a few pages (in parallel after the first one).
- Max 4 requests at a time, 100 ms apart, so we don't get rate limited (429 pauses everything and retries).
- Show details are fetched 20 at a time with `filter[id]`, so the watchlist doesn't send one request per show.
- Most shows have no future episode dates on Kitsu, so the next episode is estimated as one per week (shown with ≈).
- Some poster links expire after ~15 min, a placeholder shows if that happens.

## Streaming links

Links shared with everyone are in `src/data/streamLinks.json`. Edit them from `/admin` while running `npm run dev` (a Vite plugin in `vite-plugins/` saves the file), then commit. On the deployed site it's read only.

Logos are from [Simple Icons](https://simpleicons.org), or the site's favicon from Google if Simple Icons doesn't have it.

## Folders

- `src/api` Kitsu requests and queries
- `src/store` Zustand
- `src/lib` logic + tests
- `src/components`, `src/pages`, `src/routes`
- `data/sample-anime.json` sample data (25 shows)
- `screenshots/`

## TODO

- real member names and photos in `src/data/members.ts`
