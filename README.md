# Anime Tracker (Mini Project 2)

Anime Tracker is a React app for keeping track of the anime you watch. You can browse shows by season, save them to your watchlist, count the episodes you've seen and see which day the next episode comes out.

Show data comes from the public [Kitsu API](https://kitsu.docs.apiary.io/). Your own stuff (watchlist, progress, favorites, theme) is saved in the browser with Zustand. There's no backend.

Built with Vite, React 19, TypeScript (strict), React Router 7, Zustand, TanStack Query 5, Tailwind 4 + DaisyUI 5 and Vitest. Streaming service logos come from Simple Icons.

## Running it

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. No API key is needed.

Other scripts:

```bash
npm test          # unit tests
npm run build     # type check + production build in dist/
npm run preview   # run the production build
```

## Pages

The five pages from the assignment:

- Items: **Explore** (`/explore`)
- Detail: **anime page** (`/anime/:id`)
- Collection: **Watchlist** (`/watchlist`)
- About: **About** (`/about`)
- Extended page: **Favorites** (`/favorites`)

There's also a Home page and a page for editing streaming links, described below. Any other address shows a 404 page.

### Home (`/`)

The first row shows the 10 most popular shows of the current season, with a link to see more on Explore. Under it is Kitsu's trending list. It shows 6 rows at first, and "Show more" adds 6 more rows each time, up to 60 shows.

### Explore (`/explore`)

Pick a season and year (or "All year") to see what aired. Everything is in one row under the title: the season and year pickers, a Refresh button, a search box and format filters (TV, ONA, Movie, Special, OVA, Music). You can pick more than one format. The results are grouped by format.

For the current season there's also a "Continuing" group with older shows that are still airing.

The season and year are kept in the URL (`/explore?season=fall&year=2026`), so a reload or a shared link opens the same season. The search and filters only work on the shows that are already loaded, so they don't send any requests.

### Anime page (`/anime/:id`)

Shows the cover image, poster, rating, episode count, airing dates, synopsis and trailer. For shows that are still airing, it also shows when the next episode is expected.

On the side you can set your status (Watching, Interested, Completed), change how many episodes you've watched and add the show to favorites.

"Prequel & sequel" is a section you can open and close. It lists the show's prequel and sequel, plus other related shows like side stories, spin-offs and recaps.

"Where to watch" lists streaming links for the show (see below). The Back button goes back to the page you came from.

Invalid ids and shows Kitsu doesn't have get a "not found" page.

### Watchlist (`/watchlist`)

Three tabs: Watching, Interested and Completed.

The Watching tab is grouped by the day of the week the next episode airs, and today's day is highlighted. A row of day buttons at the top lets you show only one day. Each show has a +/− counter for episodes watched, tells you how many episodes behind you are, and has a menu to mark it completed, favorite it or remove it.

When you reach the last episode, the show is marked completed automatically.

### Favorites (`/favorites`)

Every show you've hearted. Favorites are separate from the watchlist, so removing a show from the watchlist doesn't remove it from favorites.

### About (`/about`)

Team members and a credit for the Kitsu API.

### Search

The search box at the top of every page searches all of Kitsu, not just one season. Results show up in a dropdown as you type. You can use the arrow keys and Enter, and pressing `/` jumps to the box. Kitsu only returns the 20 best matches for a search.

## How the state is split

This is the main point of the assignment, so here's how it works.

**Zustand** (`src/store/useLibraryStore.ts`) only keeps what the user did:

- watchlist entries (status, episodes watched, date added)
- favorite ids
- the user's own streaming links
- light/dark theme

It's saved to localStorage with `persist`. It never stores titles, posters or anything else from Kitsu, only the ids.

**TanStack Query** (`src/api/`) handles everything that comes from Kitsu: lists, show details, episodes, related shows and search. Each query has its own `staleTime` (15 minutes for trending, 30 minutes for season lists, 2 hours for details, 4 hours for episodes). All query keys come from one place (`queryKeys.ts`), so the Watchlist, Favorites and anime pages share the same cached details instead of fetching a show again.

The two only meet when a component renders. For example, the Watching tab gets the ids from the store and then loads each show's details with `useQueries`. Things that need both, like "3 episodes behind", are worked out during render and never saved.

Every Kitsu request has a loading state (skeletons) and an error state with a Retry button.

## Working with the Kitsu API

All requests go through `kitsuFetch` in `src/api/client.ts`. It sends one request at a time with at least 300 ms between them, so pages that load many shows don't get rate limited. If Kitsu still answers with 429 (too many requests), it waits and tries again.

Kitsu uses the JSON:API format, where every item looks like `{ id, type, attributes }`. The functions in `src/api/guards.ts` check the response and turn it into plain objects like `{ id: 7442, canonicalTitle: "Attack on Titan", ... }`. The types in `src/types/kitsu.ts` were written from real responses. There's no `any` in the project.

Some Kitsu quirks we had to work around:

- Lists return at most 20 items per request, so a season is loaded in several pages (up to 8). Sometimes Kitsu repeats a page, so duplicates are removed.
- The trending list and text search ignore paging, so we just show the first 60 trending shows and the first 20 search results.
- Most shows don't have future episode dates on Kitsu. When there's no date, the app guesses one episode per week from the start date and shows the date with "≈".
- Newer poster image links expire after about 15 minutes. If one has expired, the card shows a placeholder.

The episode logic (last aired episode, next episode date, grouping by weekday) is in `src/lib/` and has unit tests.

## Streaming links

Kitsu doesn't tell you where a show is streaming, so we added "Where to watch" links. There are two kinds:

1. **Published links** are saved in `src/data/streamLinks.json` and are part of the app, so everyone who opens the site sees them. To edit them, run `npm run dev` and open "Edit links" in the menu (`/admin`). You can browse shows the same way as on Explore, Home or search, and add, edit or remove links. Changes are written to the JSON file straight away. After that, commit and redeploy.

   Saving only works under `npm run dev`. A small Vite plugin (`vite-plugins/streamLinksAdmin.ts`) adds the save endpoint to the dev server only. It checks every link before writing. On the deployed site the page is read-only and isn't in the menu.

2. **Personal links** are added on the anime page and only exist in your own browser (Zustand).

Links have to be normal `http`/`https` addresses. The app shows a logo for each link. For Netflix, Crunchyroll, YouTube, Bilibili, HBO Max, Apple TV and Paramount+ it uses the official logo from [Simple Icons](https://simpleicons.org). For other services like iQIYI, Prime Video, Disney+, Viu, WeTV and TrueID it uses the website's own icon from Google's favicon service. If there's no icon, it shows the first letter of the name. Logos also show on the cards and on Watching rows, and clicking one opens the link.

## Folder structure

```
src/
  api/          Kitsu requests, JSON:API parsing, query keys and queries
  types/        Kitsu types
  store/        Zustand store and selectors
  lib/          episode, season, filter and streaming link logic (with tests)
  hooks/        small React hooks
  components/   cards, rows, loading/error/empty states, icons
  pages/        one file per page
  routes/       router and the main layout
  data/         team members and published streaming links
vite-plugins/   dev-only plugin that saves streaming links
data/           sample-anime.json, 25 real shows from Kitsu
screenshots/    screenshots of every page
```

## Notes

- Explore is based on the layout of our group's earlier app. We left out the tag filter from that version.
- Marking a show completed sets its episodes to the total when Kitsu knows the episode count. Shows with an unknown count are never completed automatically.
- The team info in `src/data/members.ts` is still placeholder data. Photos go in `public/members/`.

## Credits

Anime data, posters and ratings are from [Kitsu](https://kitsu.app). This project isn't affiliated with Kitsu. Brand logos are trademarks of their owners.
