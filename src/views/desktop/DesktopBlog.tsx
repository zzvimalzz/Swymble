import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SWYMBLE_DATA } from '../../data/config';
import '../../styles/desktop-blog.css';

export default function DesktopBlog() {
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
    const basePosts = [...posts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    if (activeCategory === 'all') {
      return basePosts;
    }

    return basePosts.filter((post) => post.categories.includes(activeCategory));
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

  const hasPosts = filteredPosts.length > 0;

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
    <section className="layout-content desktop-page-layout">
      <div className="section-header blog-section-header">
        <h2>{title}</h2>
      </div>
      <div className="page-content-wrapper" style={{ maxWidth: '1200px' }}>
        <section className="blog-folder-section" aria-label="Blog categories">
          <div className="blog-folder-list">
            <button
              type="button"
              className={`blog-folder-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => onCategoryChange('all')}
            >
              ALL <span>{posts.length}</span>
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`blog-folder-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => onCategoryChange(category.id)}
                title={category.description ?? category.label}
              >
                {category.label} <span>{categoryCountMap.get(category.id) ?? 0}</span>
              </button>
            ))}
          </div>
        </section>

        <p className="blog-description">{description}</p>
        
        {!posts || posts.length === 0 ? (
          <p className="blog-empty-state" style={{ marginTop: '4rem' }}>{emptyStateMsg}</p>
        ) : !hasPosts ? (
          <p className="blog-empty-state" style={{ marginTop: '2rem' }}>
            No posts in this folder yet.
          </p>
        ) : (
          <div className="blog-posts-grid">
            {filteredPosts.map((post, index) => (
              <motion.div 
                key={post.id}
                className="blog-post-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                {post.coverImage && (
                  <div className="blog-card-image">
                    <img src={post.coverImage} alt={post.title} />
                  </div>
                )}
                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    <span className="blog-card-date">
                      {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="blog-card-tags">
                      {post.categories.map((categoryId) => (
                        <span key={`${post.id}-${categoryId}`} className="blog-card-tag category">
                          {categoryMap.get(categoryId)?.label ?? categoryId}
                        </span>
                      ))}
                      {post.tags.map(tag => (
                        <span key={tag} className="blog-card-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-summary">{post.summary}</p>
                  <Link
                    to={activeCategory === 'all' ? `/blog/${post.id}` : `/blog/${post.id}?category=${encodeURIComponent(activeCategory)}`}
                    className="blog-card-read-more"
                  >
                    READ MORE
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
