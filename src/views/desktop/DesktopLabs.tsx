import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import SmartImage from '../../components/SmartImage';
import { SWYMBLE_DATA } from '../../data/config';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import { buildGmailComposeUrl, isMailtoLink } from '../../utils/mailto';
import '../../styles/desktop-labs.css';

export default function DesktopLabs({ setIsHovering }: { setIsHovering: (val: boolean) => void }) {
  const location = useLocation();
  const visibleLabs = SWYMBLE_DATA.labs?.filter((lab) => lab.visibility !== 'private') ?? [];

  const visibilityLabelMap: Record<string, string> = {
    public: 'PUBLIC',
    teaser: 'TEASER',
    private: 'PRIVATE',
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const renderActionLink = (href: string, label: string, className: string) => {
    if (href.startsWith('/')) {
      return (
        <Link to={href} className={className}>
          {label}
        </Link>
      );
    }

    return (
      <a
        href={isMailtoLink(href) ? buildGmailComposeUrl(href) : href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  };

  return (
    <section className="layout-content desktop-labs-page">
      <div className="section-header">
        <h2>SWYMBLE LABS</h2>
      </div>
      
      <p className="labs-subtitle">
        In-progress experiments and proprietary systems.
      </p>

      {visibleLabs.length === 0 ? (
        <div className="labs-empty-state">
          <h3>NO PUBLIC LABS YET</h3>
          <p>Current R&D items are private. Reach out if you want a confidential walkthrough.</p>
          <a
            href={buildGmailComposeUrl('mailto:hello@swymble.com?subject=Private%20Labs%20Walkthrough')}
            className="lab-btn"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            REQUEST PRIVATE BRIEFING
          </a>
        </div>
      ) : (
      <div className="labs-grid">
        {visibleLabs.map((labItem, index) => {
          const categoryAccentStyle = getCategoryAccentStyle(labItem.category, labItem.categoryColor);
          const labActions = labItem.actions?.length
            ? labItem.actions
            : labItem.primaryAction
              ? [labItem.primaryAction]
              : [];

          return (
            <motion.div
              key={labItem.id}
              className="lab-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="lab-card-image-wrap">
                <SmartImage
                  src={labItem.image}
                  alt={labItem.title}
                  className="lab-card-image"
                />
                <div className="lab-card-overlay">
                  <span className="lab-status-badge">{labItem.status.toUpperCase()}</span>
                </div>
              </div>

              <div className="lab-card-content">
                <div className="lab-meta">
                  <span className="lab-category category-accent-text" style={categoryAccentStyle}>{labItem.category}</span>
                  <span className={`lab-visibility-badge visibility-${labItem.visibility}`}>
                    {visibilityLabelMap[labItem.visibility]}
                  </span>
                </div>
                <h3 className="lab-title">{labItem.title}</h3>
                <p className="lab-desc">{labItem.publicSummary}</p>

                <ul className="lab-highlights">
                  {labItem.safeHighlights.map((highlight) => (
                    <li key={`${labItem.id}-${highlight}`} className="lab-highlight-item">
                      {highlight}
                    </li>
                  ))}
                </ul>

                <div className="lab-tags">
                  {labItem.tags.map((tag) => (
                    <span key={`${labItem.id}-${tag}`} className="lab-tag">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="lab-updated">UPDATED {labItem.updatedAt.toUpperCase()}</div>

                <div className="lab-actions">
                  {labActions.map((action, actionIndex) => {
                    const isSecondary = action.variant === 'secondary' || actionIndex > 0;

                    return (
                      <span key={`${labItem.id}-${action.label}`}>
                        {renderActionLink(action.href, action.label, `lab-btn${isSecondary ? ' secondary' : ''}`)}
                      </span>
                    );
                  })}

                  {(labItem.blogCategoryId || labItem.blogLink) && (
                    <Link
                      to={labItem.blogCategoryId ? `/blog?category=${encodeURIComponent(labItem.blogCategoryId)}` : (labItem.blogLink as string)}
                      className={`lab-btn ${labActions.length > 0 ? 'secondary' : ''}`}
                    >
                      READ BLOG
                    </Link>
                  )}

                  {labActions.length === 0 && !labItem.blogCategoryId && !labItem.blogLink && (
                    <div className="lab-btn disabled">NO PUBLIC ACTION</div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}
    </section>
  );
}