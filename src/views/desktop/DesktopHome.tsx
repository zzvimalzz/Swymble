import { motion, MotionValue } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DesktopContactSection from '../../components/desktop/DesktopContactSection';
import HeroField from '../../components/desktop/HeroField';
import HeroWordmark from '../../components/desktop/HeroWordmark';
import ParallaxMarquee from '../../components/desktop/ParallaxMarquee';
import PositioningStats from '../../components/desktop/PositioningStats';
import ProcessRail from '../../components/desktop/ProcessRail';
import ProximityCard from '../../components/desktop/ProximityCard';
import TechStackSection from '../../components/desktop/TechStackSection';
import { SWYMBLE_DATA } from '../../data/config';
import { useNearViewport } from '../../hooks/useNearViewport';
import '../../styles/desktop-studio.css';

const TechUniverse = lazy(() => import('../../components/desktop/TechUniverse'));

type DesktopHomeProps = {
  baseUrl: string;
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
};

export default function DesktopHome({ baseUrl, heroY, heroOpacity }: DesktopHomeProps) {
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
        <HeroField />

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
          data-cursor="hover"
          aria-label={SWYMBLE_DATA.name}
        >
          <HeroWordmark text={SWYMBLE_DATA.name} />
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
        <PositioningStats positioning={SWYMBLE_DATA.positioning} />

        <div className="studio-section">
          <div className="section-header">
            <h2>WORK WITH ME</h2>
          </div>

          <div className="focus-grid">
            {SWYMBLE_DATA.services.map((service, index) => (
              <ProximityCard key={service.id} service={service} index={index} />
            ))}
          </div>

          <ProcessRail process={SWYMBLE_DATA.process} />
        </div>

        <TechStackSection techStack={SWYMBLE_DATA.techStack} />

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