import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router';
import { animeDetailQuery, latestEpisodesQuery } from '../api/queries';
import { isKitsuError } from '../api/errors';
import { DetailSkeleton, ErrorState } from '../components/States';
import { LibraryControls } from '../components/LibraryControls';
import { StreamLinks } from '../components/StreamLinks';
import { RelatedAnimeSection } from '../components/RelatedAnime';
import { Poster } from '../components/Poster';
import { Icon } from '../components/Icon';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { needsEpisodeList, nextEpisode } from '../lib/airedEpisodes';
import { FORMAT_LABEL } from '../lib/discover';
import { ANIME_STATUS_LABEL, formatDate, formatEpisodes, formatNextEpisode, formatRating, parseId, posterUrl } from '../lib/format';
import type { Anime } from '../types/kitsu';
import { NotFoundPage } from './NotFoundPage';

export function AnimeDetailPage() {
  const { id: rawId } = useParams();
  const id = parseId(rawId);
  if (id === null) {
    return <NotFoundPage title="Invalid anime id" message={`“${rawId ?? ''}” is not a valid Kitsu anime id.`} />;
  }
  return <AnimeDetail id={id} />;
}

/** Goes back to wherever the user came from (Explore, Watchlist, Favorites…); a direct visit falls back to Explore. */
function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = location.key !== 'default';
  return (
    <button
      type="button"
      onClick={() => (hasHistory ? void navigate(-1) : void navigate('/explore'))}
      className="btn btn-sm absolute top-3 left-3 z-10 border-0 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
    >
      <Icon name="chevronLeft" className="size-4" />
      {hasHistory ? 'Back' : 'Explore'}
    </button>
  );
}

/** Wide cover image when Kitsu has one, otherwise the poster blurred. Signed URLs can expire, so it degrades to a gradient. */
function Backdrop({ anime }: { anime: Anime }) {
  const cover = anime.coverImage?.large ?? anime.coverImage?.original ?? null;
  const src = cover ?? posterUrl(anime, 'medium');
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <div className="relative h-44 overflow-hidden rounded-box bg-gradient-to-br from-primary/30 via-base-300 to-secondary/20 sm:h-64 lg:h-72">
      {src && failed !== src && (
        <img
          src={src}
          alt=""
          onError={() => setFailed(src)}
          className={`absolute inset-0 size-full object-cover ${cover ? '' : 'scale-125 blur-2xl'}`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-base-200 via-base-200/30 to-black/20" />
      <BackButton />
    </div>
  );
}

function AnimeDetail({ id }: { id: number }) {
  const query = useQuery(animeDetailQuery(id));
  // Only airing shows need episodes; same key and cache as the Watching tab.
  const episodes = useQuery(latestEpisodesQuery(id, query.data !== undefined && needsEpisodeList(query.data)));
  // Matches Tailwind's `md`: the controls move from under the title into the sidebar.
  const wide = useMediaQuery('(min-width: 48rem)');

  if (query.isPending) return <DetailSkeleton />;
  if (query.isError) {
    if (isKitsuError(query.error) && query.error.isNotFound) {
      return <NotFoundPage title="Anime not found" message={`Kitsu has no anime with id ${id}.`} />;
    }
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  const anime = query.data;
  const facts: [string, string][] = [
    ['Format', FORMAT_LABEL[anime.subtype] ?? anime.subtype],
    ['Episodes', formatEpisodes(anime)],
    ['Status', ANIME_STATUS_LABEL[anime.status]],
    ['Age rating', anime.ageRating ? `${anime.ageRating}${anime.ageRatingGuide ? ` – ${anime.ageRatingGuide}` : ''}` : 'Unrated'],
    ['Started', formatDate(anime.startDate)],
    ['Ended', anime.status === 'finished' ? formatDate(anime.endDate) : '—'],
  ];
  if (anime.episodeLength) facts.splice(2, 0, ['Episode length', `${anime.episodeLength} min`]);
  if (needsEpisodeList(anime)) {
    const next = episodes.isPending ? undefined : nextEpisode(anime, episodes.data?.items);
    facts.push(['Next episode', next === undefined ? 'Checking…' : next === null ? 'Unknown' : formatNextEpisode(next)]);
  }
  const englishTitle = anime.titles.en ?? anime.titles.en_jp;
  const altTitles = [englishTitle !== anime.canonicalTitle ? englishTitle : null, anime.titles.ja_jp].filter(Boolean).join(' · ');
  const controls = (
    <div className="flex flex-col gap-4">
      <LibraryControls id={anime.id} total={anime.episodeCount} />
      <StreamLinks animeId={anime.id} title={anime.canonicalTitle} />
    </div>
  );

  return (
    <article>
      <Backdrop anime={anime} />

      <div className="relative grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-8 md:px-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="-mt-28 flex flex-col gap-4 sm:-mt-36">
          <Poster
            src={posterUrl(anime, 'medium')}
            title={anime.canonicalTitle}
            className="aspect-[2/3] w-40 self-center rounded-box shadow-xl ring-4 ring-base-200 sm:w-48 md:w-full"
          />
          {wide && controls}
        </aside>

        <div className="flex min-w-0 flex-col gap-6 md:pt-5">
          <header className="text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{anime.canonicalTitle}</h1>
            {altTitles && <p className="mt-1 text-base-content/60">{altTitles}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {anime.averageRating !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  <Icon name="star" filled className="size-3.5" />
                  {formatRating(anime.averageRating)}
                </span>
              )}
              {anime.popularityRank !== null && (
                <span className="rounded-full bg-base-300/70 px-3 py-1 text-sm font-medium text-base-content/70">
                  #{anime.popularityRank} most popular
                </span>
              )}
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  anime.status === 'current' ? 'bg-success/15 text-success' : 'bg-base-300/70 text-base-content/70'
                }`}
              >
                {ANIME_STATUS_LABEL[anime.status]}
              </span>
            </div>
          </header>

          {!wide && controls}

          <dl className="surface grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3 lg:grid-cols-4">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-1 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <RelatedAnimeSection animeId={anime.id} />

          <section>
            <h2 className="mb-2 text-lg font-semibold">Synopsis</h2>
            <p className="leading-relaxed whitespace-pre-line text-base-content/80">{anime.synopsis || 'No synopsis available.'}</p>
          </section>


          {anime.youtubeVideoId && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Trailer</h2>
              <iframe
                className="aspect-video w-full rounded-box border border-base-300 bg-black"
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(anime.youtubeVideoId)}`}
                title={`${anime.canonicalTitle} trailer`}
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
