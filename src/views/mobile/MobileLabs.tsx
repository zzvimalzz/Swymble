import { Link } from 'react-router-dom';
import { LockKeyhole, RadioTower } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import MobileSiteFooter from '../../components/mobile/MobileSiteFooter';
import SmartImage from '../../components/SmartImage';
import { SWYMBLE_LABS } from '../../data/labs';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import { buildGmailComposeUrl, isMailtoLink } from '../../utils/mailto';

function renderLabAction(href: string, label: string, className: string) {
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
}

export default function MobileLabs() {
  const visibleLabs = SWYMBLE_LABS.filter((lab) => lab.visibility !== 'private');
  const [activeLabId, setActiveLabId] = useState(visibleLabs[0]?.id ?? '');

  return (
    <main className="mobile-labs-page">
      <header className="mobile-labs-header">
        <h1>Labs</h1>
        <p>Experimental systems, prototypes, and guarded build notes tuned for a small-screen console.</p>
      </header>

      {visibleLabs.length === 0 ? (
        <section className="mobile-labs-empty">
          <LockKeyhole size={24} />
          <h2>No public labs yet</h2>
          <p>Current R&D items are private. Request a quiet walkthrough if you need context.</p>
          <a
            href={buildGmailComposeUrl('mailto:hello@swymble.com?subject=Private%20Labs%20Walkthrough')}
            className="mobile-lab-action primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Request Briefing
          </a>
        </section>
      ) : (
        <section className="mobile-labs-stack" aria-label="Swymble labs">
          {visibleLabs.map((lab, index) => {
            const categoryAccentStyle = getCategoryAccentStyle(lab.category, lab.categoryColor);
            const labActions = lab.actions?.length ? lab.actions : lab.primaryAction ? [lab.primaryAction] : [];
            const isActive = activeLabId === lab.id;

            return (
              <article
                key={lab.id}
                className={`mobile-lab-card ${isActive ? 'is-active' : ''}`}
                style={{ ...categoryAccentStyle, '--artifact-index': index } as CSSProperties}
              >
                <button
                  type="button"
                  className="mobile-lab-card-toggle"
                  aria-expanded={isActive}
                  onClick={() => setActiveLabId((currentId) => (currentId === lab.id ? '' : lab.id))}
                >
                  <span className="mobile-lab-card-topline">
                    <span className="mobile-lab-category category-accent-text">{lab.category}</span>
                    <span className={`mobile-lab-visibility visibility-${lab.visibility}`}>
                      <RadioTower size={13} /> {lab.visibility}
                    </span>
                  </span>

                  <span className="mobile-lab-toggle-title">
                    <span>{lab.title}</span>
                    <span>{isActive ? 'Close' : 'Tap'}</span>
                  </span>
                </button>

                <div className="mobile-lab-image-wrap" aria-hidden={!isActive}>
                  <SmartImage src={lab.image} alt={lab.title} className="mobile-lab-image" loading="lazy" />
                  <span className="mobile-lab-status">{lab.status}</span>
                </div>

                <div className="mobile-lab-body" aria-hidden={!isActive}>
                  <p>{lab.publicSummary}</p>

                  <ul className="mobile-lab-highlights">
                    {lab.safeHighlights.map((highlight) => (
                      <li key={`${lab.id}-${highlight}`}>{highlight}</li>
                    ))}
                  </ul>

                  <div className="mobile-lab-tags">
                    {lab.tags.map((tag) => (
                      <span key={`${lab.id}-${tag}`}>#{tag}</span>
                    ))}
                  </div>

                  <div className="mobile-lab-footer-row">
                    <span>Updated {lab.updatedAt}</span>
                  </div>

                  <div className="mobile-lab-actions">
                    {labActions.map((action, actionIndex) => (
                      <span key={`${lab.id}-${action.label}`}>
                        {renderLabAction(
                          action.href,
                          action.label,
                          `mobile-lab-action ${action.variant === 'secondary' || actionIndex > 0 ? 'secondary' : 'primary'}`,
                        )}
                      </span>
                    ))}

                    {(lab.blogCategoryId || lab.blogLink) && (
                      <Link
                        to={lab.blogCategoryId ? `/blog?category=${encodeURIComponent(lab.blogCategoryId)}` : (lab.blogLink as string)}
                        className={`mobile-lab-action ${labActions.length > 0 ? 'secondary' : 'primary'}`}
                      >
                        Read Blog
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <MobileSiteFooter />
    </main>
  );
}
