import { useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { SWYMBLE_DATA } from '../../data/config';
import '../../styles/desktop-blog-post.css';

const INLINE_TOKEN_REGEX = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|`[^`]+`)/g;

function clampIndent(indent?: 0 | 1 | 2 | 3) {
  if (indent === undefined) {
    return 0;
  }
  return Math.min(3, Math.max(0, indent));
}

function normalizeRichText(text: string | string[]) {
  return Array.isArray(text) ? text.join('\n') : text;
}

function renderInlineRichText(text: string | string[], keyPrefix: string) {
  const normalizedText = normalizeRichText(text);
  const lines = normalizedText.split('\n');

  return lines.flatMap((line, lineIndex) => {
    const nodes: Array<string | React.JSX.Element> = [];
    let cursor = 0;

    for (const match of line.matchAll(INLINE_TOKEN_REGEX)) {
      const token = match[0];
      const start = match.index ?? 0;
      const end = start + token.length;

      if (start > cursor) {
        nodes.push(line.slice(cursor, start));
      }

      if (token.startsWith('**') && token.endsWith('**')) {
        nodes.push(<strong key={`${keyPrefix}-b-${lineIndex}-${start}`}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('__') && token.endsWith('__')) {
        nodes.push(
          <span className="post-underline" key={`${keyPrefix}-u-${lineIndex}-${start}`}>
            {token.slice(2, -2)}
          </span>,
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        nodes.push(<em key={`${keyPrefix}-i-${lineIndex}-${start}`}>{token.slice(1, -1)}</em>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        nodes.push(
          <code className="post-inline-code" key={`${keyPrefix}-c-${lineIndex}-${start}`}>
            {token.slice(1, -1)}
          </code>,
        );
      } else {
        nodes.push(token);
      }

      cursor = end;
    }

    if (cursor < line.length) {
      nodes.push(line.slice(cursor));
    }

    if (lineIndex < lines.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${lineIndex}`} />);
    }

    return nodes;
  });
}

export default function DesktopBlogPost() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');

  const categoryMap = useMemo(
    () => new Map(SWYMBLE_DATA.blog.categories.map((category) => [category.id, category])),
    [],
  );

  const post = SWYMBLE_DATA.blog.posts.find((p) => p.id === id);
  const backLink = activeCategory ? `/blog?category=${encodeURIComponent(activeCategory)}` : '/blog';

  const relatedPosts = useMemo(() => {
    if (!post) {
      return [];
    }

    return SWYMBLE_DATA.blog.posts
      .filter(
        (candidate) =>
          candidate.id !== post.id &&
          candidate.categories.some((categoryId) => post.categories.includes(categoryId)),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [post]);

  if (!post) {
    return (
      <section className="layout-content blog-post-page">
        <div className="blog-post-not-found-header">
          <Link to={backLink} className="back-link">
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
        <Link to={backLink} className="back-link">
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
          <div className="post-categories-header">
            {post.categories.map((categoryId) => (
              <span key={`${post.id}-${categoryId}`} className="post-category-header">
                {categoryMap.get(categoryId)?.label ?? categoryId}
              </span>
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
          const indentClass = `post-indent-${clampIndent('indent' in block ? block.indent : 0)}`;

          if (block.type === 'paragraph') {
            return (
              <p key={index} className={`post-paragraph ${indentClass}`}>
                {renderInlineRichText(block.text, `p-${index}`)}
              </p>
            );
          }

          if (block.type === 'question') {
            return (
              <p key={index} className={`post-question ${indentClass}`}>
                {renderInlineRichText(block.text, `q-${index}`)}
              </p>
            );
          }

          if (block.type === 'quote') {
            return (
              <blockquote key={index} className={`post-quote ${indentClass}`}>
                <p>{renderInlineRichText(block.text, `qt-${index}`)}</p>
                {block.cite && <cite>{renderInlineRichText(block.cite, `cite-${index}`)}</cite>}
              </blockquote>
            );
          }

          if (block.type === 'list') {
            const ListTag = block.style === 'numbered' ? 'ol' : 'ul';
            return (
              <ListTag key={index} className={`post-list ${block.style === 'numbered' ? 'is-numbered' : 'is-bullet'} ${indentClass}`}>
                {block.items.map((item, itemIndex) => (
                  <li key={`${index}-${itemIndex}`}>{renderInlineRichText(item, `li-${index}-${itemIndex}`)}</li>
                ))}
              </ListTag>
            );
          }

          if (block.type === 'spacer') {
            return <div key={index} className={`post-spacer size-${block.size || 'md'}`} aria-hidden="true" />;
          }

          if (block.type === 'heading') {
            const HTag = `h${block.level || 2}` as keyof React.JSX.IntrinsicElements;
            return (
              <HTag key={index} className={`post-heading-${block.level || 2}`}>
                {renderInlineRichText(block.text, `h-${index}`)}
              </HTag>
            );
          }

          if (block.type === 'image') {
            const imageAlt = block.caption ? normalizeRichText(block.caption) : 'Blog post image';
            return (
              <figure key={index} className="post-image-figure">
                <img src={block.src} alt={imageAlt} className="post-inline-image" />
                {block.caption && (
                  <figcaption className="post-image-caption">{renderInlineRichText(block.caption, `cap-${index}`)}</figcaption>
                )}
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

      {relatedPosts.length > 0 && (
        <section className="related-posts-section" aria-label="Related posts">
          <h2 className="related-posts-title">More In This Category</h2>
          <div className="related-posts-grid">
            {relatedPosts.map((relatedPost) => {
              const relatedCategory = activeCategory ?? relatedPost.categories[0];
              const relatedHref = relatedCategory
                ? `/blog/${relatedPost.id}?category=${encodeURIComponent(relatedCategory)}`
                : `/blog/${relatedPost.id}`;

              return (
                <Link key={relatedPost.id} to={relatedHref} className="related-post-card">
                  <p className="related-post-date">
                    {new Date(relatedPost.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <h3>{relatedPost.title}</h3>
                  <p>{relatedPost.summary}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </motion.section>
  );
}