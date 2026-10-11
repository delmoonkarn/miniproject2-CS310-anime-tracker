import { useQueries } from '@tanstack/react-query';
import { animeDetailQuery, latestEpisodesQuery } from './queries';
import { needsEpisodeList } from '../lib/airedEpisodes';

/** One detail query per id, under the same key as the Detail page, so a show is fetched once. */
export function useAnimeDetails(ids: readonly number[]) {
  return useQueries({ queries: ids.map((id) => animeDetailQuery(id)) });
}

/**
 * Details for every watched show, plus the latest episodes only for shows that are still airing
 * (finished shows use episodeCount, no extra request). Requests go through the kitsuFetch queue.
 */
export function useWatchingData(ids: readonly number[]) {
  const details = useAnimeDetails(ids);
  const episodes = useQueries({
    queries: ids.map((id, i) => {
      const detail = details[i]?.data;
      return latestEpisodesQuery(id, detail !== undefined && needsEpisodeList(detail));
    }),
  });
  return { details, episodes };
}
