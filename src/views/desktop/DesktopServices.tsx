import { useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { SWYMBLE_DATA } from '../../data/config';
import '../../styles/desktop-services.css';

type DeckMetrics = {
  collapsedMargin: string;
  expandedMargin: string;
  maxRotation: number;
};

function getDeckMetrics(viewportWidth: number): DeckMetrics {
  if (viewportWidth <= 640) {
    return {
      collapsedMargin: '-24rem',
      expandedMargin: '1.5rem',
      maxRotation: 1.4,
    };
  }

  if (viewportWidth <= 900) {
    return {
      collapsedMargin: '-28rem',
      expandedMargin: '2.5rem',
      maxRotation: 2.1,
    };
  }

  return {
    collapsedMargin: '-33.5rem',
    expandedMargin: '5rem',
    maxRotation: 3,
  };
}

function getFanRotation(index: number, total: number, maxRotation: number): number {
  if (index === 0 || total <= 1) {
    return 0;
  }

  const cardsBehindFront = total - 1;
  const behindIndex = index - 1;
  const center = (cardsBehindFront - 1) / 2;
  const distanceFromCenter = behindIndex - center;
  const normalizedDistance = center === 0 ? 0 : distanceFromCenter / center;
  const staggerNudge = (behindIndex % 2 === 0 ? -0.18 : 0.18) * maxRotation;

  return Number((normalizedDistance * maxRotation + staggerNudge).toFixed(2));
}

export default function DesktopServices({ setIsHovering }: { setIsHovering: (val: boolean) => void }) {
  const location = useLocation();
  const services = SWYMBLE_DATA.services;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [deckMetrics, setDeckMetrics] = useState<DeckMetrics>(() => getDeckMetrics(window.innerWidth));

  // The expansion happens as the TOP of the section moves from 85% of screen height to 15% of screen height.
  // This causes the deck to unspool into a column exactly as you scroll past it!
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "start 15%"]
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const onResize = () => {
      setDeckMetrics(getDeckMetrics(window.innerWidth));
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      <section className="layout-content desktop-services-page" style={{ paddingBottom: '10vh' }}>
        <div className="section-header">
          <h2>SERVICES</h2>
        </div>

        <p className="services-subtitle">
          End-to-end web solutions for brands and businesses that refuse to blend in.
        </p>

        <div ref={sectionRef} className="services-deck-container" style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {services.map((service, index) => {
            const rotInitial = getFanRotation(index, services.length, deckMetrics.maxRotation);
            const serviceNumber = String(index + 1).padStart(2, '0');
            
            // Front card (index 0) anchors the stack and doesn't get pulled up.
            const isFirst = index === 0;
            
            // Margin animates from a bundled deck to a readable column.
            const marginT = useTransform(
              scrollYProgress,
              [0, 1],
              [deckMetrics.collapsedMargin, deckMetrics.expandedMargin]
            );
            
            // As it unpacks, they all straighten out to 0 degrees to form the clean list
            const rotate = useTransform(scrollYProgress, [0, 1], [rotInitial, 0]);

            return (
              <motion.div
                key={service.id}
                className="service-card-wrapper"
                style={{
                  marginTop: isFirst ? "0rem" : marginT,
                  rotate: rotate,
                  zIndex: services.length - index,
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  transformOrigin: "center center",
                  position: 'relative' // required for z-index binding
                }}
              >
                <motion.div
                  className="service-detail-card"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  whileHover={{ scale: 1.02, y: -8 }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "100px" }}
                  style={{ '--service-color': service.colorHex } as CSSProperties}
                >
                  <div className="service-detail-chrome" aria-hidden="true">
                    <span className="service-detail-orb" />
                    <span className="service-detail-grid" />
                  </div>

                  <div className="service-detail-surface">
                    <div className="service-detail-header">
                      <span className="service-detail-number">{serviceNumber}</span>
                      <span className="service-detail-kicker">CAPABILITY</span>
                    </div>

                    <h3 className="service-detail-title">{service.title}</h3>
                    <p className="service-detail-summary">{service.summary}</p>

                    <ul className="service-detail-highlights">
                      {service.highlights.map((item) => (
                        <li key={item} className="service-detail-highlight">
                          {item}
                        </li>
                      ))}
                    </ul>

                    <div className="service-detail-footer">
                      <span>STRATEGY</span>
                      <span>BUILD</span>
                      <span>SUPPORT</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="layout-content" style={{ padding: "8rem 0", minHeight: "40vh", display: "flex", alignItems: "center" }}>
        <motion.div
          className="services-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          style={{ margin: "0 auto", width: "100%" }}
        >
          <h3 className="services-cta-heading">HAVE A PROJECT IN MIND?</h3>
          <p className="services-cta-text">
            Every project starts with a conversation. Tell me about your idea and let's build something great.
          </p>
          <Link
            to="/#work-with-me"
            className="services-cta-btn"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            LET'S TALK
          </Link>
        </motion.div>
      </section>
    </>
  );
}
