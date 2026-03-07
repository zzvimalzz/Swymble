import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { SWYMBLE_DATA } from '../../data/config';
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

  return (
    <section className="layout-content desktop-labs-page">
      <div className="section-header">
        <h2>SWYMBLE LABS</h2>
      </div>
      
      <p className="labs-subtitle">
        In-progress experiments and proprietary systems shown with public-safe details only.
      </p>

      {visibleLabs.length === 0 ? (
        <div className="labs-empty-state">
          <h3>NO PUBLIC LABS YET</h3>
          <p>Current R&D items are private. Reach out if you want a confidential walkthrough.</p>
          <a
            href="mailto:hello@swymble.com?subject=Private%20Labs%20Walkthrough"
            className="lab-btn"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            REQUEST PRIVATE BRIEFING
          </a>
        </div>
      ) : (
      <div className="labs-grid">
        {visibleLabs.map((labItem, index) => {
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
                <img
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
                  <span className="lab-category">{labItem.category}</span>
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
                  {labItem.primaryAction &&
                    (labItem.primaryAction.kind === 'internal' ? (
                      <Link to={labItem.primaryAction.href} className="lab-btn">
                        {labItem.primaryAction.label}
                      </Link>
                    ) : (
                      <a
                        href={labItem.primaryAction.href}
                        target={labItem.primaryAction.kind === 'external' ? '_blank' : undefined}
                        rel={labItem.primaryAction.kind === 'external' ? 'noopener noreferrer' : undefined}
                        className="lab-btn"
                      >
                        {labItem.primaryAction.label}
                      </a>
                    ))}

                  {labItem.blogLink && (
                    <Link to={labItem.blogLink} className={`lab-btn ${labItem.primaryAction ? 'secondary' : ''}`}>
                      READ BLOG
                    </Link>
                  )}

                  {!labItem.primaryAction && !labItem.blogLink && (
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