import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SWYMBLE_DATA } from '../../data/config';
import '../../styles/desktop-blog.css';

export default function DesktopBlog() {
  const { title, description, emptyStateMsg, posts } = SWYMBLE_DATA.blog;

  return (
    <section className="layout-content desktop-page-layout">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      <div className="page-content-wrapper" style={{ maxWidth: '1200px' }}>
        <p className="blog-description">{description}</p>
        
        {(!posts || posts.length === 0) ? (
          <p className="blog-empty-state" style={{ marginTop: '4rem' }}>{emptyStateMsg}</p>
        ) : (
          <div className="blog-posts-grid">
            {posts.map((post, index) => (
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
                      {post.tags.map(tag => (
                        <span key={tag} className="blog-card-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-summary">{post.summary}</p>
                  <Link to={`/blog/${post.id}`} className="blog-card-read-more">
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
