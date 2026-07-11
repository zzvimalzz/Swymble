import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Reveal from '../../components/motion/Reveal';
import SmartImage from '../../components/SmartImage';
import { SWYMBLE_DATA } from '../../data/config';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import '../../styles/desktop-info-services.css';
import '../../styles/desktop-projects.css';

export default function DesktopProjects() {
  const location = useLocation();

  // Depend on the primitive pathname/hash strings, not the `location` object itself.
  // `<Routes location={location}>` in DesktopView reconstructs a new location object on
  // every render of the router tree (e.g. when the scroll-to-top button's visibility state
  // flips), even when the URL hasn't changed. Depending on the whole object made this effect
  // re-fire on every unrelated re-render and call window.scrollTo(0, 0) mid-scroll.
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <section className="layout-content desktop-projects-page">
      <div className="section-header">
        <h1>PROJECTS</h1>
      </div>

      <div className="projects-list">
        {SWYMBLE_DATA.projects.map((workItem, index) => {
          const projectId = workItem.title.replace(/\s+/g, '-').toLowerCase();
          const categoryAccentStyle = getCategoryAccentStyle(workItem.category, workItem.categoryColor);
          return (
            <Reveal
              id={projectId}
              key={workItem.title}
              className={`project-row ${index % 2 !== 0 ? 'project-row-reversed' : ''}`}
              y={50}
              margin="-50px"
              delay={index * 0.1}
            >
              <div className="project-image-container" data-cursor="hover">
              <SmartImage
                src={workItem.landingImage || workItem.image}
                alt={workItem.title}
                className="project-image"
              />
            </div>

            <div className="project-details">
              <h3 className="w-client project-title">
                {workItem.title}
              </h3>
              <div className="carousel-meta project-meta">
                <span className="w-category category-accent-text" style={categoryAccentStyle}>{workItem.category}</span>
                {workItem.client && <span className="w-impact">{workItem.client}</span>}
              </div>
              <p className="project-description">
                {workItem.description}
              </p>

              {workItem.outcomes && workItem.outcomes.length > 0 && (
                <ul className="project-outcomes">
                  {workItem.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
              )}

              {workItem.stack && workItem.stack.length > 0 && (
                <div className="project-stack">
                  {workItem.stack.map((tech) => (
                    <span key={tech} className="project-stack-chip">
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {workItem.testimonial && (
                <blockquote className="project-testimonial">
                  <p>&ldquo;{workItem.testimonial.quote}&rdquo;</p>
                  <cite>{workItem.testimonial.author}</cite>
                </blockquote>
              )}

              <div className="project-actions">
                {(!workItem.status || workItem.status === 'Live') && workItem.link ? (
                  <a
                    href={workItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submit-btn project-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    VIEW LIVE
                  </a>
                ) : (
                  <div 
                    className="submit-btn project-btn disabled"
                    style={{ 
                      opacity: 0.5,
                      cursor: 'not-allowed',
                      pointerEvents: 'none' 
                    }}
                  >
                    {workItem.status?.toUpperCase() || 'IN DEVELOPMENT'}
                  </div>
                )}

                {workItem.blogLink && (
                  <Link
                    to={workItem.blogLink}
                    className="submit-btn project-btn secondary"
                    style={{ textDecoration: 'none' }}
                  >
                    READ BLOG
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        );
      })}
      </div>

      <Reveal className="projects-cta" y={30} margin="-50px" delay={0.3}>
        <p className="projects-cta-kicker">More projects in the pipeline</p>
        <p className="projects-cta-headline">Your project could be next.</p>
        <Link to="/contact" className="submit-btn project-btn">
          START A PROJECT
        </Link>
      </Reveal>
    </section>
  );
}