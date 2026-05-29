import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SmartImage from '../../components/SmartImage';
import { SWYMBLE_DATA } from '../../data/config';
import { useBlogCategoryFilter } from '../../hooks/useBlogCategoryFilter';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import '../../styles/desktop-blog.css';

export default function DesktopBlog() {
  const { title, description, emptyStateMsg, posts, categories } = SWYMBLE_DATA.blog;
  const { activeCategory, categoryMap, categoryCountMap, filteredPosts, onCategoryChange } = useBlogCategoryFilter({
    posts,
    categories,
  });
  const hasPosts = filteredPosts.length > 0;

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
                className={`blog-folder-btn category-accent-button ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => onCategoryChange(category.id)}
                title={category.description ?? category.label}
                style={getCategoryAccentStyle(category.label, category.categoryColor)}
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
                    <SmartImage src={post.coverImage} alt={post.title} />
                  </div>
                )}
                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    <span className="blog-card-date">
                      {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="blog-card-tags">
                      {post.categories.map((categoryId) => (
                        <span
                          key={`${post.id}-${categoryId}`}
                          className="blog-card-tag category category-accent-tag"
                          style={getCategoryAccentStyle(
                            categoryMap.get(categoryId)?.label ?? categoryId,
                            categoryMap.get(categoryId)?.categoryColor,
                          )}
                        >
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
