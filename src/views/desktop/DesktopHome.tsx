import { motion, MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DesktopContactSection from '../../components/desktop/DesktopContactSection';
import HeroField from '../../components/desktop/HeroField';
import HeroTelemetry from '../../components/desktop/HeroTelemetry';
import HeroWordmark from '../../components/desktop/HeroWordmark';
import ParallaxMarquee from '../../components/desktop/ParallaxMarquee';
import PositioningStats from '../../components/desktop/PositioningStats';
import ProcessRail from '../../components/desktop/ProcessRail';
import ProximityCard from '../../components/desktop/ProximityCard';
import TechStackSection from '../../components/desktop/TechStackSection';
import { SWYMBLE_DATA } from '../../data/config';
import '../../styles/desktop-studio.css';

type DesktopHomeProps = {
  baseUrl: string;
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
};

export default function DesktopHome({ baseUrl, heroY, heroOpacity }: DesktopHomeProps) {
  const location = useLocation();

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

        {/* Watermark and wordmark share a wrapper so the watermark is centred on the *title*
            rather than on the hero section. They are not the same point: the section centres its
            whole stack, so the tagline and telemetry below push the title above the section's
            middle by an amount that changes with viewport height and how many lines the tagline
            wraps to. Anchored here, the watermark sits behind the wordmark at every size. */}
        <div className="hero-wordmark-stack">
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
        </div>

        <motion.p
          className="hero-tagline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {SWYMBLE_DATA.tagline}
        </motion.p>

        <HeroTelemetry
          location={SWYMBLE_DATA.about.location}
          availability={SWYMBLE_DATA.about.availability.label}
        />
      </motion.section>

      <ParallaxMarquee text={SWYMBLE_DATA.marquee} />

      <section className="layout-content">
        <PositioningStats
          positioning={SWYMBLE_DATA.positioning}
          projects={SWYMBLE_DATA.projects}
          labs={SWYMBLE_DATA.labs}
        />

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

        <DesktopContactSection />
      </section>
    </>
  );
}
