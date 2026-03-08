import { Link } from 'react-router-dom';
import { ChevronDown, Newspaper } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties, type MutableRefObject, type PointerEvent as ReactPointerEvent } from 'react';

import MobileContact from '../../components/mobile/MobileContact';
import MobileProjects from '../../components/mobile/MobileProjects';
import MobileServices from '../../components/mobile/MobileServices';
import { SWYMBLE_DATA } from '../../data/config';

export type MobileHomeSectionId = 'top' | 'services-section' | 'projects' | 'latest-updates' | 'contact-section';

type MobileHomeProps = {
  scrolled: boolean;
  isTitleTapped: boolean;
  isTitleHolding: boolean;
  titleStyle: CSSProperties;
  titleRef: MutableRefObject<HTMLHeadingElement | null>;
  onTitlePointerDown: (event: ReactPointerEvent<HTMLHeadingElement>) => void;
  onTitlePointerMove: (event: ReactPointerEvent<HTMLHeadingElement>) => void;
  onTitleInteractionEnd: (event: ReactPointerEvent<HTMLHeadingElement>) => void;
  onJumpToSection: (sectionId: MobileHomeSectionId) => void;
};

export default function MobileHome({
  scrolled,
  isTitleTapped,
  isTitleHolding,
  titleStyle,
  titleRef,
  onTitlePointerDown,
  onTitlePointerMove,
  onTitleInteractionEnd,
  onJumpToSection,
}: MobileHomeProps) {
  const latestPost = SWYMBLE_DATA.blog.posts[0];
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalUpdateCards = 1 + SWYMBLE_DATA.latestUpdates.length;

  const updateCardsCapacity = useMemo(() => {
    if (viewportWidth < 720) {
      return 1;
    }

    if (viewportWidth < 1080) {
      return 2;
    }

    return 3;
  }, [viewportWidth]);

  const useScrollableUpdates = totalUpdateCards > updateCardsCapacity;

  const updatesCarouselClassName = useMemo(
    () => [
      'mobile-updates-carousel',
      useScrollableUpdates ? 'is-scrollable' : 'is-static',
      totalUpdateCards === 1 ? 'has-single-card' : '',
    ]
      .filter(Boolean)
      .join(' '),
    [totalUpdateCards, useScrollableUpdates],
  );

  const renderLatestUpdateCta = (card: (typeof SWYMBLE_DATA.latestUpdates)[number]) => {
    if (!card.ctaLabel || !card.ctaHref) {
      return null;
    }

    if (card.ctaHref.startsWith('/')) {
      return (
        <Link to={card.ctaHref} className="mobile-blog-preview-link">
          {card.ctaLabel}
        </Link>
      );
    }

    return (
      <a href={card.ctaHref} className="mobile-blog-preview-link" target="_blank" rel="noopener noreferrer">
        {card.ctaLabel}
      </a>
    );
  };

  return (
    <div className="mobile-home-page">
      <header className="mobile-hero mobile-home-section" id="top">
        <img src="/white-logo.png" alt="Swymble Logo" className="mobile-logo" />
        <h1
          ref={titleRef}
          className={`mobile-title${isTitleTapped ? ' is-tapped' : ''}${isTitleHolding ? ' is-holding' : ''}`}
          style={titleStyle}
          onPointerDown={onTitlePointerDown}
          onPointerMove={onTitlePointerMove}
          onPointerUp={onTitleInteractionEnd}
          onPointerCancel={onTitleInteractionEnd}
          aria-label={SWYMBLE_DATA.name}
        >
          <span className="mobile-title-text">{SWYMBLE_DATA.name}</span>
          <span className="mobile-title-glitch mobile-title-glitch-a" aria-hidden="true">
            {SWYMBLE_DATA.name}
          </span>
          <span className="mobile-title-glitch mobile-title-glitch-c" aria-hidden="true">
            {SWYMBLE_DATA.name}
          </span>
          <span className="mobile-title-glitch mobile-title-glitch-b" aria-hidden="true">
            {SWYMBLE_DATA.name}
          </span>
          <span className="mobile-title-spark-field" aria-hidden="true">
            <span className="mobile-title-spark spark-1" />
            <span className="mobile-title-spark spark-2" />
            <span className="mobile-title-spark spark-3" />
            <span className="mobile-title-spark spark-4" />
            <span className="mobile-title-spark spark-5" />
            <span className="mobile-title-spark spark-6" />
            <span className="mobile-title-spark spark-7" />
            <span className="mobile-title-spark spark-8" />
          </span>
        </h1>

        <a
          href="#services-section"
          className={`scroll-indicator ${scrolled ? 'hidden' : ''}`}
          onClick={(event) => {
            event.preventDefault();
            onJumpToSection('services-section');
          }}
        >
          <span className="scroll-text">Scroll down</span>
          <ChevronDown className="scroll-arrow" size={32} />
        </a>
      </header>

      <section className="mobile-section mobile-home-section" id="services-section" style={{ width: '100%' }}>
        <MobileServices whatIDo={SWYMBLE_DATA.whatIDo} />
      </section>

      <section className="mobile-section mobile-home-section" id="projects" style={{ width: '100%' }}>
        <MobileProjects projects={SWYMBLE_DATA.projects} />
      </section>

      <section id="latest-updates" className="mobile-latest-updates mobile-home-section" aria-label="Latest updates">
        <div className="section-header">
          <h2>LATEST UPDATES</h2>
        </div>

        <div className={updatesCarouselClassName} role="region" aria-label="Latest updates carousel">
          <article className="mobile-update-card mobile-update-card-blog">
            <p className="mobile-blog-preview-kicker">New on blog</p>
            <h4>{latestPost?.title ?? 'SWYMBLE Blog'}</h4>
            <p>{latestPost?.summary ?? SWYMBLE_DATA.blog.description}</p>
            <Link to="/blog" className="mobile-blog-preview-link">
              Open Blog
              <Newspaper size={16} />
            </Link>
          </article>

          {SWYMBLE_DATA.latestUpdates.map((card) => (
            <article key={card.id} className="mobile-update-card">
              <p className="mobile-blog-preview-kicker">{card.kicker}</p>
              <h4>{card.title}</h4>
              <p>{card.description}</p>
              {renderLatestUpdateCta(card)}
            </article>
          ))}
        </div>
      </section>

      <section
        className="mobile-section mobile-home-section"
        id="contact-section"
        style={{ width: '100%', marginBottom: '7rem' }}
      >
        <MobileContact />
      </section>
    </div>
  );
}
