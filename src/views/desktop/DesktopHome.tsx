import { motion, MotionValue } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Reveal from '../../components/motion/Reveal';
import SmartImage from '../../components/SmartImage';
import DesktopContactSection from '../../components/desktop/DesktopContactSection';
import ParallaxMarquee from '../../components/desktop/ParallaxMarquee';
import ProximityCard from '../../components/desktop/ProximityCard';
import { SWYMBLE_DATA } from '../../data/config';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import { useNearViewport } from '../../hooks/useNearViewport';
import '../../styles/desktop-studio.css';

const TechUniverse = lazy(() => import('../../components/desktop/TechUniverse'));

type DesktopHomeProps = {
  baseUrl: string;
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
};

export default function DesktopHome({ baseUrl, heroY, heroOpacity }: DesktopHomeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { ref: techSectionRef, hasBeenNear: shouldMountTechUniverse } = useNearViewport<HTMLDivElement>('600px');

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const id = decodeURIComponent(location.hash.substring(1));

    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [location.hash]);

  return (
    <>
      <motion.section className="hero-section" style={{ y: heroY, opacity: heroOpacity }}>
        <div className="hero-bg-logo" aria-hidden="true">
          <img
            src={`${baseUrl}images/white-logo.png`}
            alt=""
            loading="eager"
            fetchPriority="high"
            width={980}
            height={342}
          />
        </div>

        <h1
          className="hero-title glitch-mega"
          data-text={SWYMBLE_DATA.name}
          data-cursor="hover"
        >
          {SWYMBLE_DATA.name}
        </h1>

        <motion.p
          className="hero-tagline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {SWYMBLE_DATA.tagline}
        </motion.p>
      </motion.section>

      <ParallaxMarquee text={SWYMBLE_DATA.marquee} />

      <section className="layout-content">
        <div className="section-header">
          <h2>What You'll Find Here</h2>
        </div>

        <div className="focus-grid">
          {SWYMBLE_DATA.whatIDo.map((service, index) => (
            <ProximityCard key={service.title} service={service} index={index} />
          ))}
        </div>

        <div className="work-carousel-section">
          <div className="section-header">
            <h2>PROJECTS</h2>
          </div>

          <div className={`carousel-container ${SWYMBLE_DATA.projects.length <= 3 ? 'grid-mode' : ''}`}>
            <div className={`carousel-inner ${SWYMBLE_DATA.projects.length <= 3 ? 'grid-mode' : ''}`}>
              {SWYMBLE_DATA.projects.map((workItem, index) => {
                const projectId = workItem.title.replace(/\s+/g, '-').toLowerCase();
                const categoryAccentStyle = getCategoryAccentStyle(workItem.category, workItem.categoryColor);
                return (
                  <motion.div
                    key={workItem.title}
                    className="carousel-card"
                    data-cursor="hover"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '50px' }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    onClick={() => navigate(`/projects#${projectId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="carousel-image-wrapper">
                      <SmartImage
                        src={workItem.image}
                        alt={workItem.title}
                        className="carousel-image"
                        draggable="false"
                      />
                    </div>
                    <div className="carousel-info">
                      <h3 className="w-client">{workItem.title}</h3>
                      <div className="carousel-meta">
                        <span className="w-category category-accent-text" style={categoryAccentStyle}>{workItem.category}</span>
                        {workItem.client && <span className="w-impact">{workItem.client}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="studio-section">
          <div className="section-header">
            <h2>WORK WITH ME</h2>
          </div>

          <div className="focus-grid">
            {SWYMBLE_DATA.services.map((service, index) => (
              <ProximityCard key={service.id} service={service} index={index} />
            ))}
          </div>

          <div className="process-rail">
            {SWYMBLE_DATA.process.map((step, index) => (
              <Reveal
                key={step.id}
                className="process-step"
                y={24}
                margin="-80px"
                delay={index * 0.12}
              >
                <span className="process-step-number">{step.step}</span>
                <h3 className="process-step-title">{step.title}</h3>
                <p className="process-step-desc">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="info-row" ref={techSectionRef}>
          <div className="info-column" style={{ width: '100%' }}>
            <div className="section-header">
              <h2>SWYMBLE UNIVERSE</h2>
            </div>

            {shouldMountTechUniverse ? (
              <Suspense fallback={<div className="tech-universe tech-universe--loading">Calibrating the universe...</div>}>
                <TechUniverse skills={SWYMBLE_DATA.universe} />
              </Suspense>
            ) : (
              <div className="tech-universe tech-universe--loading">Calibrating the universe...</div>
            )}
          </div>
        </div>

        <DesktopContactSection />
      </section>
    </>
  );
}