import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { EXPLORE_CATEGORIES, PAGE_SIZE, isExploreCategory, type ExploreCategory } from '../../api/endpoints';
import { categoryQuery, trendingQuery } from '../../api/queries';
import { AnimeQueryGrid } from '../../components/AnimeQueryGrid';
import { NotFoundPage } from '../NotFoundPage';

export function ExploreCategoryPage() {
  const { category } = useParams();
  if (!isExploreCategory(category)) {
    return <NotFoundPage title="Unknown category" message={`There is no “${category ?? ''}” category.`} />;
  }
  return (
    <>
      <p className="mb-4 text-sm text-base-content/70">{EXPLORE_CATEGORIES[category].description}</p>
      {category === 'trending' ? <TrendingGrid /> : <CategoryGrid category={category} />}
    </>
  );
}

/** Reuses the Home page's trending query: no extra request. */
function TrendingGrid() {
  const query = useQuery(trendingQuery());
  return <AnimeQueryGrid query={query} slice={[0, PAGE_SIZE]} highlight empty="No trending anime right now." />;
}

function CategoryGrid({ category }: { category: Exclude<ExploreCategory, 'trending'> }) {
  const query = useQuery(categoryQuery(category));
  return <AnimeQueryGrid query={query} highlight empty="Kitsu returned no shows for this category." />;
}
