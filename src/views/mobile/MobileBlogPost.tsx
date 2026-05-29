import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import MobileSiteFooter from '../../components/mobile/MobileSiteFooter';
import SmartImage from '../../components/SmartImage';
import { SWYMBLE_DATA } from '../../data/config';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import { normalizeRichText, renderInlineRichText as renderBlogInlineRichText } from '../../utils/blogContent';

const renderInlineRichText = (text: string | string[], keyPrefix: string) =>
  renderBlogInlineRichText(text, keyPrefix, {
    underline: 'mobile-blog-underline',
    inlineCode: 'mobile-blog-inline-code',
  });

export default function MobileBlogPost() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');

  const categoryMap = useMemo(
    () => new Map(SWYMBLE_DATA.blog.categories.map((category) => [category.id, category])),
    [],
  );

  const post = SWYMBLE_DATA.blog.posts.find((entry) => entry.id === id);

  const relatedPosts = useMemo(() => {
    if (!post) return [];

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
      <main className="mobile-blog-post-page">
        <header className="mobile-blog-post-header">
          <h1>Post Not Found</h1>
          <p>We could not find the article you are looking for.</p>
        </header>
        <MobileSiteFooter />
      </main>
    );
  }

  return (
    <main className="mobile-blog-post-page">
      <header className="mobile-blog-post-header">
        <p className="mobile-blog-post-date">
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <h1>{post.title}</h1>

        <div className="mobile-blog-post-tags">
          {post.categories.map((categoryId) => (
            <span
              key={`${post.id}-${categoryId}`}
              className="mobile-blog-tag category category-accent-tag"
              style={getCategoryAccentStyle(
                categoryMap.get(categoryId)?.label ?? categoryId,
                categoryMap.get(categoryId)?.categoryColor,
              )}
            >
              {categoryMap.get(categoryId)?.label ?? categoryId}
            </span>
          ))}
          {post.tags.map((tag) => (
            <span key={`${post.id}-${tag}`} className="mobile-blog-tag">
              #{tag}
            </span>
          ))}
        </div>
      </header>

      {post.coverImage && (
        <div className="mobile-blog-post-cover">
          <SmartImage src={post.coverImage} alt={post.title} loading="eager" />
        </div>
      )}

      <article className="mobile-blog-post-content">
        {post.content.map((block, index) => {
          const indent = 'indent' in block && block.indent ? block.indent : 0;
          const indentStyle = { marginLeft: `${indent * 0.65}rem` };

          if (block.type === 'paragraph') {
            return (
              <p key={index} style={indentStyle} className="mobile-blog-post-paragraph">
                {renderInlineRichText(block.text, `p-${index}`)}
              </p>
            );
          }

          if (block.type === 'question') {
            return (
              <p key={index} style={indentStyle} className="mobile-blog-post-question">
                {renderInlineRichText(block.text, `q-${index}`)}
              </p>
            );
          }

          if (block.type === 'quote') {
            return (
              <blockquote key={index} style={indentStyle} className="mobile-blog-post-quote">
                <p>{renderInlineRichText(block.text, `qt-${index}`)}</p>
                {block.cite && <cite>{renderInlineRichText(block.cite, `cite-${index}`)}</cite>}
              </blockquote>
            );
          }

          if (block.type === 'list') {
            const ListTag = block.style === 'numbered' ? 'ol' : 'ul';
            return (
              <ListTag key={index} style={indentStyle} className="mobile-blog-post-list">
                {block.items.map((item, itemIndex) => (
                  <li key={`${index}-${itemIndex}`}>{renderInlineRichText(item, `li-${index}-${itemIndex}`)}</li>
                ))}
              </ListTag>
            );
          }

          if (block.type === 'heading') {
            if (block.level === 3) {
              return (
                <h3 key={index} className="mobile-blog-post-heading level-3">
                  {renderInlineRichText(block.text, `h-${index}`)}
                </h3>
              );
            }

            if (block.level === 4) {
              return (
                <h4 key={index} className="mobile-blog-post-heading level-4">
                  {renderInlineRichText(block.text, `h-${index}`)}
                </h4>
              );
            }

            return (
              <h2 key={index} className="mobile-blog-post-heading level-2">
                {renderInlineRichText(block.text, `h-${index}`)}
              </h2>
            );
          }

          if (block.type === 'image') {
            const imageAlt = block.caption ? normalizeRichText(block.caption) : 'Blog image';
            return (
              <figure key={index} className="mobile-blog-post-image-wrap">
                <SmartImage src={block.src} alt={imageAlt} className="mobile-blog-post-image" loading="lazy" />
                {block.caption && (
                  <figcaption>{renderInlineRichText(block.caption, `cap-${index}`)}</figcaption>
                )}
              </figure>
            );
          }

          if (block.type === 'code') {
            return (
              <div key={index} className="mobile-blog-post-code-wrap">
                <span className="mobile-blog-code-language">{block.language}</span>
                <pre>
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          }

          if (block.type === 'spacer') {
            const sizeClass = block.size ?? 'md';
            return <div key={index} className={`mobile-blog-spacer size-${sizeClass}`} aria-hidden="true" />;
          }

          return null;
        })}
      </article>

      {relatedPosts.length > 0 && (
        <section className="mobile-blog-related" aria-label="Related posts">
          <h2>Related Reads</h2>
          <div className="mobile-blog-related-list">
            {relatedPosts.map((relatedPost) => {
              const relatedCategory = activeCategory ?? relatedPost.categories[0];
              const relatedHref = relatedCategory
                ? `/blog/${relatedPost.id}?category=${encodeURIComponent(relatedCategory)}`
                : `/blog/${relatedPost.id}`;

              return (
                <Link key={relatedPost.id} to={relatedHref} className="mobile-blog-related-card">
                  <p>
                    {new Date(relatedPost.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <h3>{relatedPost.title}</h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <MobileSiteFooter />
    </main>
  );
}
