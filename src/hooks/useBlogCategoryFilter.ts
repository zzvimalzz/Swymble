import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SwymbleBlogCategory, SwymbleBlogPost } from '../data/config';

type UseBlogCategoryFilterOptions = {
  posts: SwymbleBlogPost[];
  categories: SwymbleBlogCategory[];
};

export function useBlogCategoryFilter({ posts, categories }: UseBlogCategoryFilterOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') ?? 'all';
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const activeCategory = selectedCategory === 'all' || categoryMap.has(selectedCategory) ? selectedCategory : 'all';

  const filteredPosts = useMemo(() => {
    const sortedPosts = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (activeCategory === 'all') {
      return sortedPosts;
    }

    return sortedPosts.filter((post) => post.categories.includes(activeCategory));
  }, [activeCategory, posts]);

  const categoryCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    categories.forEach((category) => counts.set(category.id, 0));

    posts.forEach((post) => {
      post.categories.forEach((categoryId) => {
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
      });
    });

    return counts;
  }, [categories, posts]);

  const onCategoryChange = (categoryId: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (categoryId === 'all') {
      nextParams.delete('category');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    nextParams.set('category', categoryId);
    setSearchParams(nextParams, { replace: true });
  };

  return {
    activeCategory,
    categoryMap,
    categoryCountMap,
    filteredPosts,
    onCategoryChange,
  };
}
