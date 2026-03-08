import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SWYMBLE_DATA } from '../../data/config';

export default function MobileBlog() {
  const { title, description, emptyStateMsg, posts, categories } = SWYMBLE_DATA.blog;
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get('category') ?? 'all';
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const activeCategory =
    selectedCategory === 'all' || categoryMap.has(selectedCategory) ? selectedCategory : 'all';

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

  return (
    <main className="mobile-blog-page">
      <header className="mobile-blog-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <section className="mobile-blog-category-strip" aria-label="Blog categories">
        <button
          type="button"
          className={`mobile-blog-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => onCategoryChange('all')}
        >
          ALL
          <span>{posts.length}</span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`mobile-blog-chip ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(category.id)}
            title={category.description ?? category.label}
          >
            {category.label}
            <span>{categoryCountMap.get(category.id) ?? 0}</span>
          </button>
        ))}
      </section>

      <section className="mobile-blog-feed" aria-label="Blog posts">
        {posts.length === 0 ? (
          <p className="mobile-blog-empty">{emptyStateMsg}</p>
        ) : filteredPosts.length === 0 ? (
          <p className="mobile-blog-empty">No posts in this category yet.</p>
        ) : (
          filteredPosts.map((post) => {
            const postHref =
              activeCategory === 'all'
                ? `/blog/${post.id}`
                : `/blog/${post.id}?category=${encodeURIComponent(activeCategory)}`;

            return (
              <Link key={post.id} to={postHref} className="mobile-blog-card" aria-label={`Read ${post.title}`}>
              {post.coverImage && (
                <div className="mobile-blog-card-image">
                  <img src={post.coverImage} alt={post.title} loading="lazy" />
                </div>
              )}

              <div className="mobile-blog-card-body">
                <p className="mobile-blog-card-date">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>

                <h2>{post.title}</h2>
                <p className="mobile-blog-card-summary">{post.summary}</p>

                <div className="mobile-blog-card-tags">
                  {post.categories.map((categoryId) => (
                    <span key={`${post.id}-${categoryId}`} className="mobile-blog-tag category">
                      {categoryMap.get(categoryId)?.label ?? categoryId}
                    </span>
                  ))}
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={`${post.id}-${tag}`} className="mobile-blog-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
