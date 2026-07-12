import { MotionValue } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DesktopContactSection from '../../components/desktop/DesktopContactSection';
import ParallaxMarquee from '../../components/desktop/ParallaxMarquee';
import ProcessRail from '../../components/desktop/ProcessRail';
import ProximityCard from '../../components/desktop/ProximityCard';
import { SWYMBLE_DATA } from '../../data/config';
import { useNearViewport } from '../../hooks/useNearViewport';
import Chapter01HeroConsole from './home/Chapter01HeroConsole';
import Chapter02Positioning from './home/Chapter02Positioning';
import Chapter03ShippedWorkspace from './home/Chapter03ShippedWorkspace';
import '../../styles/desktop-studio.css';

const TechUniverse = lazy(() => import('../../components/desktop/TechUniverse'));

// Descriptive fallback while the 3D scene loads/mounts — indexable prose instead of
// a bare "calibrating" placeholder (crawlers snapshot whatever is in the DOM here).
const UNIVERSE_FALLBACK =
  'The Swymble Universe: client work, labs experiments, writing, and the engineer behind them, mapped as orbits around one planet.';

type DesktopHomeProps = {
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
};

export default function DesktopHome({ heroY, heroOpacity }: DesktopHomeProps) {
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
      <Chapter01HeroConsole heroY={heroY} heroOpacity={heroOpacity} />

      <ParallaxMarquee text={SWYMBLE_DATA.marquee} />

      <section className="layout-content">
        <Chapter02Positioning />

        <Chapter03ShippedWorkspace />

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

        <div className="info-row" ref={techSectionRef}>
          <div className="info-column" style={{ width: '100%' }}>
            <div className="section-header">
              <h2>SWYMBLE UNIVERSE</h2>
            </div>

            {shouldMountTechUniverse ? (
              <Suspense fallback={<div className="tech-universe tech-universe--loading">{UNIVERSE_FALLBACK}</div>}>
                <TechUniverse skills={SWYMBLE_DATA.universe} />
              </Suspense>
            ) : (
              <div className="tech-universe tech-universe--loading">{UNIVERSE_FALLBACK}</div>
            )}
          </div>
        </div>

        <DesktopContactSection />
      </section>
    </>
  );
}
