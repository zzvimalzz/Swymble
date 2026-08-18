import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SmartImage from '../../components/SmartImage';
import { LabActions, STATUS_MODIFIER, labActionsOf } from '../../components/desktop/Labs/labPresentation';
import { SWYMBLE_DATA } from '../../data/config';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import { labDisplayName } from '../../utils/labSeo';
import '../../styles/desktop-lab-detail.css';

/**
 * A lab's own page.
 *
 * Every lab used to exist only as one card in the /labs grid, which meant nothing on the site had
 * a URL for "MyDompet" or "Territory" — there was no page for a search engine to rank against
 * those names, and nothing for an assistant to cite when asked what they are. This page is that
 * URL: one lab, its own canonical address, enough prose to actually answer the question, and the
 * structured data that says which organisation built it (see utils/labSeo.ts).
 */
export default function DesktopLabDetail() {
  const { id } = useParams();
  const labs = SWYMBLE_DATA.labs ?? [];
  const lab = labs.find((entry) => entry.id === id && entry.visibility !== 'private');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!lab) {
    return (
      <section className="layout-content lab-detail-page">
        <Link to="/labs" className="back-link">
          <ArrowLeft size={16} /> Back to Labs
        </Link>

        <div className="section-header">
          <h1>LAB NOT FOUND</h1>
        </div>

        <p className="lab-detail-lede">
          There is no lab at this address. The current experiments are listed on the{' '}
          <Link to="/labs">Swymble Labs</Link> page.
        </p>
      </section>
    );
  }

  const name = labDisplayName(lab);
  const detail = lab.detail;
  const hasPublicAction = labActionsOf(lab).length > 0 || Boolean(lab.blogCategoryId ?? lab.blogLink);
  const otherLabs = labs.filter((entry) => entry.id !== lab.id && entry.visibility !== 'private');

  return (
    <motion.section
      className="layout-content lab-detail-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* A visible, crawlable trail back up the hierarchy — the counterpart to the
          BreadcrumbList emitted in this route's structured data. */}
      <nav className="lab-detail-breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/labs">Labs</Link>
          </li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>

      <Link to="/labs" className="back-link">
        <ArrowLeft size={16} /> Back to Labs
      </Link>

      <header className="lab-detail-header">
        <div className="lab-detail-identity">
          <span
            className="lab-category category-accent-text"
            style={getCategoryAccentStyle(lab.category, lab.categoryColor)}
          >
            {lab.category}
          </span>

          <h1 className="lab-detail-title">{name}</h1>

          <p className="lab-detail-lede">{detail?.oneLiner ?? lab.publicSummary}</p>

          <div className="lab-detail-badges">
            <span className={`lab-status-badge lab-status-badge--${STATUS_MODIFIER[lab.status]}`}>
              {lab.status.toUpperCase()}
            </span>
            <span className={`lab-visibility-badge visibility-${lab.visibility}`}>
              {lab.visibility.toUpperCase()}
            </span>
            <span className="lab-updated">UPDATED {lab.updatedAt.toUpperCase()}</span>
          </div>

          {/* An unreleased lab has nothing to link to, and the shared "NO PUBLIC ACTION" filler
              is fine on a card in a grid but a dead end on the page someone arrived at from a
              search for this exact product. Offer the one action that is always available. */}
          {hasPublicAction ? (
            <LabActions lab={lab} />
          ) : (
            <div className="lab-actions">
              <a
                className="lab-btn"
                href={`mailto:hello@swymble.com?subject=${encodeURIComponent(`${name} enquiry`)}`}
              >
                ASK ABOUT {name.toUpperCase()}
              </a>
            </div>
          )}
        </div>

        <div className="lab-detail-logo">
          <SmartImage src={lab.image} alt={`${name} logo`} />
        </div>
      </header>

      {detail?.overview?.length ? (
        <section className="lab-detail-section" aria-labelledby="lab-overview-heading">
          <h2 id="lab-overview-heading">What {name} is</h2>
          {detail.overview.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="lab-detail-paragraph">
              {paragraph}
            </p>
          ))}
        </section>
      ) : (
        <section className="lab-detail-section" aria-labelledby="lab-overview-heading">
          <h2 id="lab-overview-heading">What {name} is</h2>
          <p className="lab-detail-paragraph">{lab.publicSummary}</p>
        </section>
      )}

      {detail?.features?.length ? (
        <section className="lab-detail-section lab-detail-section--wide" aria-labelledby="lab-features-heading">
          <h2 id="lab-features-heading">How it works</h2>
          <div className="lab-detail-features">
            {detail.features.map((feature) => (
              <article key={feature.title} className="lab-detail-feature">
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="lab-detail-section" aria-labelledby="lab-highlights-heading">
        <h2 id="lab-highlights-heading">Highlights</h2>
        <ul className="lab-highlights">
          {lab.safeHighlights.map((highlight) => (
            <li key={highlight} className="lab-highlight-item">
              {highlight}
            </li>
          ))}
        </ul>
      </section>

      {detail?.specs?.length ? (
        <section className="lab-detail-section" aria-labelledby="lab-specs-heading">
          <h2 id="lab-specs-heading">At a glance</h2>
          <dl className="lab-detail-specs">
            {detail.specs.map((spec) => (
              <div key={spec.label} className="lab-detail-spec">
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {detail?.faq?.length ? (
        <section className="lab-detail-section" aria-labelledby="lab-faq-heading">
          <h2 id="lab-faq-heading">Frequently asked</h2>
          <div className="lab-detail-faq">
            {detail.faq.map((entry) => (
              <article key={entry.question} className="lab-detail-faq-item">
                <h3>{entry.question}</h3>
                <p>{entry.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="lab-detail-section" aria-labelledby="lab-tags-heading">
        <h2 id="lab-tags-heading">Tags</h2>
        <div className="lab-tags">
          {lab.tags.map((tag) => (
            <span key={tag} className="lab-tag">
              #{tag}
            </span>
          ))}
        </div>
      </section>

      {otherLabs.length ? (
        <section className="lab-detail-section lab-detail-section--wide" aria-labelledby="lab-more-heading">
          <h2 id="lab-more-heading">More from Swymble Labs</h2>
          {/* Logo first, name on a faded band at the foot of the card. The one-liner is a click
              away on the lab's own page; repeating it here just rebuilds the /labs grid. */}
          <ul className="lab-detail-more">
            {otherLabs.slice(0, 3).map((entry) => (
              <li key={entry.id}>
                <Link to={`/labs/${entry.id}`} className="lab-more-card">
                  <span className="lab-more-card__art">
                    <SmartImage src={entry.image} alt="" fit="contain" padding={0} />
                  </span>
                  <span className="lab-more-card__label">{labDisplayName(entry)}</span>
                </Link>
              </li>
            ))}

            {/* Four tiles, and the fourth is the way out. Listing every other lab here turned the
                foot of the page into a second /labs grid. */}
            <li>
              <Link to="/labs" className="lab-more-card lab-more-card--all">
                <span className="lab-more-card__art">
                  <ArrowRight size={40} aria-hidden="true" />
                </span>
                <span className="lab-more-card__label">MORE</span>
              </Link>
            </li>
          </ul>
        </section>
      ) : null}
    </motion.section>
  );
}
