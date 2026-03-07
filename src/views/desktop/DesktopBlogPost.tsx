import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { SWYMBLE_DATA } from '../../data/config';
import '../../styles/desktop-blog-post.css';

export default function DesktopBlogPost() {
  const { id } = useParams();
  const post = SWYMBLE_DATA.blog.posts.find((p) => p.id === id);

  if (!post) {
    return (
      <section className="layout-content blog-post-page">
        <div className="blog-post-not-found-header">
          <Link to="/blog" className="back-link">
            <ArrowLeft size={16} /> Back to Blog
          </Link>

          <div className="section-header">
            <h2>POST NOT FOUND</h2>
          </div>
        </div>

        <div className="page-content-wrapper blog-post-not-found-body">
          <p className="blog-post-not-found-message">We couldn't find the article you were looking for.</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section 
      className="layout-content blog-post-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ paddingBottom: '10rem' }}
    >
      <div className="blog-post-header">
        <Link to="/blog" className="back-link">
          <ArrowLeft size={16} /> Back to Blog
        </Link>
        <h1 className="post-main-title">{post.title}</h1>
        
        <div className="post-meta-data">
          <span className="post-date">{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <div className="post-tags-header">
            {post.tags.map(tag => (
              <span key={tag} className="post-tag-header">#{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {post.coverImage && (
        <div className="post-cover-image">
          <img src={post.coverImage} alt={post.title} />
        </div>
      )}

      <div className="post-body">
        {post.content.map((block, index) => {
          if (block.type === 'paragraph') {
            return <p key={index} className="post-paragraph">{block.text}</p>;
          }
          if (block.type === 'heading') {
            const HTag = `h${block.level || 2}` as keyof React.JSX.IntrinsicElements;
            return <HTag key={index} className={`post-heading-${block.level || 2}`}>{block.text}</HTag>;
          }
          if (block.type === 'image') {
            return (
              <figure key={index} className="post-image-figure">
                <img src={block.src} alt={block.caption || 'Blog post image'} className="post-inline-image" />
                {block.caption && <figcaption className="post-image-caption">{block.caption}</figcaption>}
              </figure>
            );
          }
          if (block.type === 'code') {
            return (
              <div key={index} className="post-code-block">
                <div className="code-language-tag">{block.language}</div>
                <pre><code>{block.code}</code></pre>
              </div>
            );
          }
          return null;
        })}
      </div>
    </motion.section>
  );
}