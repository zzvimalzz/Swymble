import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import LabAccordion from '../../components/desktop/Labs/LabAccordion';
import { LabActions, STATUS_MODIFIER } from '../../components/desktop/Labs/labPresentation';
import SmartImage from '../../components/SmartImage';
import useMediaQuery from '../../hooks/useMediaQuery';
import { SWYMBLE_DATA } from '../../data/config';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import { serializeJsonLd } from '../../utils/jsonLd';
import { labsIndexJsonLd } from '../../utils/labSeo';
import '../../styles/desktop-labs.css';

/** Where the card grid has already collapsed to one column, and the stacked cards get long. */
const COMPACT_QUERY = '(max-width: 780px)';

export default function DesktopLabs() {
  const location = useLocation();
  const visibleLabs = SWYMBLE_DATA.labs?.filter((lab) => lab.visibility !== 'private') ?? [];

  const isCompact = useMediaQuery(COMPACT_QUERY);
  // Null, not the first lab: the point of collapsing is that the whole list is visible at once,
  // and opening one by default puts the reader back to scrolling before they have chosen anything.
  const [openLabId, setOpenLabId] = useState<string | null>(null);

  // Depend on the primitive pathname, not the `location` object itself. See DesktopProjects.tsx
  // for why depending on the whole object causes a scroll-to-top mid-scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <section className="layout-content desktop-labs-page">
      {/* Says "this page is a list of N named products, and here they are" rather than leaving a
          crawler to infer it from a grid of divs. Inline rather than in useRouteSeo because it is
          derived from the same `visibleLabs` the page renders, so the two cannot disagree. */}
      {visibleLabs.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(labsIndexJsonLd(visibleLabs)) }}
        />
      )}

      <div className="section-header">
        <h1>SWYMBLE LABS</h1>
      </div>

      <p className="labs-subtitle">
        In-progress experiments and proprietary systems.
      </p>

      {visibleLabs.length === 0 ? (
        <div className="labs-empty-state">
          <h3>NO PUBLIC LABS YET</h3>
          <p>Current R&D items are private. Reach out if you want a confidential walkthrough.</p>
          <a
            href="mailto:hello@swymble.com?subject=Private%20Labs%20Walkthrough"
            className="lab-btn"
          >
            REQUEST PRIVATE BRIEFING
          </a>
        </div>
      ) : isCompact ? (
        <LabAccordion
          labs={visibleLabs}
          openId={openLabId}
          onToggle={(id) => setOpenLabId((current) => (current === id ? null : id))}
        />
      ) : (
        <div className="labs-grid">
          {visibleLabs.map((labItem, index) => (
            <motion.div
              key={labItem.id}
              className="lab-card"
              data-cursor="hover"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="lab-card-image-wrap">
                <SmartImage src={labItem.image} alt={labItem.title} className="lab-card-image" />
                <div className="lab-card-overlay">
                  <span
                    className={`lab-status-badge lab-status-badge--${STATUS_MODIFIER[labItem.status]}`}
                  >
                    {labItem.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="lab-card-content">
                <div className="lab-meta">
                  <span
                    className="lab-category category-accent-text"
                    style={getCategoryAccentStyle(labItem.category, labItem.categoryColor)}
                  >
                    {labItem.category}
                  </span>
                  <span className={`lab-visibility-badge visibility-${labItem.visibility}`}>
                    {labItem.visibility.toUpperCase()}
                  </span>
                </div>
                <h3 className="lab-title">
                  <Link to={`/labs/${labItem.id}`}>{labItem.title}</Link>
                </h3>
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

                <LabActions lab={labItem} showDetailLink />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
