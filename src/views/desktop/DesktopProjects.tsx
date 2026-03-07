import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { SWYMBLE_DATA } from '../../data/config';
import '../../styles/desktop-info-services.css';
import '../../styles/desktop-projects.css';

export default function DesktopProjects({ setIsHovering }: { setIsHovering: (val: boolean) => void }) {
  const location = useLocation();

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
  }, [location]);

  return (
    <section className="layout-content desktop-projects-page">
      <div className="section-header">
        <h2>PROJECTS</h2>
      </div>

      <div className="projects-list">
        {SWYMBLE_DATA.projects.map((workItem, index) => {
          const projectId = workItem.title.replace(/\s+/g, '-').toLowerCase();
          return (
            <motion.div
              id={projectId}
              key={workItem.title}
              className={`project-row ${index % 2 !== 0 ? 'project-row-reversed' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div
                className="project-image-container"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
              <img
                src={workItem.landingImage || workItem.image}
                alt={workItem.title}
                className="project-image"
                style={
                  workItem.landingImage !== workItem.image
                    ? { objectFit: 'cover', objectPosition: 'top', padding: 0 }
                    : {}
                }
              />
            </div>

            <div className="project-details">
              <h3 className="w-client project-title">
                {workItem.title}
              </h3>
              <div className="carousel-meta project-meta">
                <span className="w-category">{workItem.category}</span>
                {workItem.client && <span className="w-impact">{workItem.client}</span>}
              </div>
              <p className="project-description">
                {workItem.description}
              </p>
              
              <div className="project-actions">
                {(!workItem.status || workItem.status === 'Live') && workItem.link ? (
                  <a 
                    href={workItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submit-btn project-btn" 
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
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
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    READ BLOG
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
      </div>
      
      <motion.div 
        className="more-projects-message"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{
          textAlign: 'center',
          marginTop: '6rem',
          padding: '2rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--muted)',
          fontSize: '0.9rem',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ marginBottom: '0.5rem' }}>⋯</div>
        MORE PROJECTS IN THE PIPELINE
      </motion.div>
    </section>
  );
}