import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { animeDetailQuery, latestEpisodesQuery } from '../api/queries';
import { isKitsuError } from '../api/errors';
import { DetailSkeleton, ErrorState } from '../components/States';
import { LibraryControls } from '../components/LibraryControls';
import { Poster } from '../components/Poster';
import { needsEpisodeList, nextEpisode } from '../lib/airedEpisodes';
import { ANIME_STATUS_LABEL, formatDate, formatEpisodes, formatNextEpisode, formatRating, parseId, posterUrl } from '../lib/format';
import { NotFoundPage } from './NotFoundPage';

export function AnimeDetailPage() {
  const { id: rawId } = useParams();
  const id = parseId(rawId);
  if (id === null) {
    return <NotFoundPage title="Invalid anime id" message={`“${rawId ?? ''}” is not a valid Kitsu anime id.`} />;
  }
  return <AnimeDetail id={id} />;
}

function AnimeDetail({ id }: { id: number }) {
  const query = useQuery(animeDetailQuery(id));
  // Only airing shows need episodes; same key and cache as the Watching tab.
  const episodes = useQuery(latestEpisodesQuery(id, query.data !== undefined && needsEpisodeList(query.data)));

  if (query.isPending) return <DetailSkeleton />;
  if (query.isError) {
    if (isKitsuError(query.error) && query.error.isNotFound) {
      return <NotFoundPage title="Anime not found" message={`Kitsu has no anime with id ${id}.`} />;
    }
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  const anime = query.data;
  const facts: [string, string][] = [
    ['Average rating', formatRating(anime.averageRating)],
    ['Episodes', formatEpisodes(anime)],
    ['Status', ANIME_STATUS_LABEL[anime.status]],
    ['Type', anime.subtype],
    ['Age rating', anime.ageRating ? `${anime.ageRating}${anime.ageRatingGuide ? ` – ${anime.ageRatingGuide}` : ''}` : 'Unrated'],
    ['Started', formatDate(anime.startDate)],
    ['Ended', anime.status === 'finished' ? formatDate(anime.endDate) : '—'],
  ];
  if (needsEpisodeList(anime)) {
    const next = episodes.isPending ? undefined : nextEpisode(anime, episodes.data?.items);
    facts.push(['Next episode', next === undefined ? 'Checking…' : next === null ? 'Unknown' : formatNextEpisode(next)]);
  }

  return (
    <article className="flex flex-col gap-6 md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-4 md:w-64">
        <Poster
          src={posterUrl(anime, 'medium')}
          title={anime.canonicalTitle}
          className="aspect-[2/3] w-full max-w-64 self-center rounded-box shadow"
        />
        <LibraryControls id={anime.id} total={anime.episodeCount} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header>
          <Link to="/" className="link link-hover text-sm">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">{anime.canonicalTitle}</h1>
          {anime.titles.ja_jp && <p className="text-base-content/70">{anime.titles.ja_jp}</p>}
        </header>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-box bg-base-200 p-3">
              <dt className="text-xs text-base-content/60">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Synopsis</h2>
          <p className="whitespace-pre-line text-base-content/90">{anime.synopsis || 'No synopsis available.'}</p>
        </section>

        {anime.youtubeVideoId && (
          <section>
            <h2 className="mb-2 text-xl font-semibold">Trailer</h2>
            <iframe
              className="aspect-video w-full rounded-box"
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(anime.youtubeVideoId)}`}
              title={`${anime.canonicalTitle} trailer`}
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </section>
        )}
      </div>
    </article>
  );
}
