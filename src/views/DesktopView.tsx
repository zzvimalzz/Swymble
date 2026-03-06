import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Rocket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import DesktopFooter from '../components/desktop/DesktopFooter';
import ParallaxMarquee from '../components/desktop/ParallaxMarquee';
import ProximityCard from '../components/desktop/ProximityCard';
import { SWYMBLE_DATA } from '../data/config';
import '../styles/desktop.css';

export default function DesktopView() {
  const baseUrl = import.meta.env.BASE_URL;

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isSocialHover, setIsSocialHover] = useState(false);
  const [hoverColorIndex, setHoverColorIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const hoverStateRef = useRef(false);
  const cursorVisibleRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const { scrollY } = useScroll();

  const springScroll = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const heroY = useTransform(springScroll, [0, 1], [0, 400]);
  const heroOpacity = useTransform(springScroll, [0, 0.2], [1, 0]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setShowScrollTop(latest > 400);
  });

  useEffect(() => {
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;

    const checkHover = () => {
      const hoveredElement = document.elementFromPoint(currentX, currentY);

      document
        .querySelectorAll('.service-card.force-hover, .carousel-card.force-hover')
        .forEach((node) => node.classList.remove('force-hover'));

      if (!hoveredElement) {
        return;
      }

      const serviceCard = hoveredElement.closest('.service-card');
      if (serviceCard) {
        serviceCard.classList.add('force-hover');
      }

      const carouselCard = hoveredElement.closest('.carousel-card');
      if (carouselCard) {
        carouselCard.classList.add('force-hover');
      }

      const isHoverTarget =
        hoveredElement.tagName.toLowerCase() === 'a' ||
        hoveredElement.tagName.toLowerCase() === 'button' ||
        hoveredElement.tagName.toLowerCase() === 'input' ||
        hoveredElement.tagName.toLowerCase() === 'select' ||
        Boolean(hoveredElement.closest('.service-card')) ||
        Boolean(hoveredElement.closest('.w-client')) ||
        Boolean(hoveredElement.closest('.carousel-card')) ||
        Boolean(hoveredElement.closest('.hero-title'));

      if (isHoverTarget) {
        if (!hoverStateRef.current) {
          setHoverColorIndex((prev) => (prev + 1) % 3);
          hoverStateRef.current = true;
        }
        setIsHovering(true);
      } else {
        hoverStateRef.current = false;
        setIsHovering(false);
      }

      setIsSocialHover(Boolean(hoveredElement.closest('.social-link')));
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!cursorVisibleRef.current) {
        cursorVisibleRef.current = true;
        setCursorVisible(true);
      }

      currentX = event.clientX;
      currentY = event.clientY;
      setMousePos({ x: currentX, y: currentY });
      checkHover();
    };

    const handleMouseLeave = () => {
      cursorVisibleRef.current = false;
      setCursorVisible(false);
    };

    const handleMouseEnter = () => {
      cursorVisibleRef.current = true;
      setCursorVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', checkHover, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', checkHover);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEmail(value);

    if (value !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('please enter a valid email address');
      return;
    }

    setEmailError('');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cursorColors = ['var(--accent-volt)', 'var(--accent-neon)', '#00F0FF'];

  return (
    <div className="swymble-app desktop-view" ref={containerRef}>
      <div
        className={`glitch-cursor ${isHovering ? 'hovering' : ''} ${isSocialHover ? 'social-hover' : ''}`}
        style={{
          left: mousePos.x,
          top: mousePos.y,
          backgroundColor:
            isHovering || isSocialHover ? cursorColors[hoverColorIndex] : 'var(--accent-volt)',
          opacity: cursorVisible ? 1 : 0,
        }}
      />

      <div className="bg-grid" />

      <motion.section className="hero-section" style={{ y: heroY, opacity: heroOpacity }}>
        <div className="hero-bg-logo">
          <img src={`${baseUrl}favicon.png`} alt="Swymble Background Logo" />
        </div>

        <h1
          className="hero-title glitch-mega"
          data-text={SWYMBLE_DATA.name}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
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

      <ParallaxMarquee text={SWYMBLE_DATA.marquee} setIsHovering={setIsHovering} />

      <section className="layout-content">
        <div className="section-header">
          <h2>WHAT I DO</h2>
        </div>

        <div className="services-grid">
          {SWYMBLE_DATA.services.map((service, index) => (
            <ProximityCard key={service.title} service={service} index={index} mousePos={mousePos} />
          ))}
        </div>

        <div className="work-carousel-section">
          <div className="section-header">
            <h2>SELECTED WORKS</h2>
          </div>

          <div className="carousel-container">
            <div className="carousel-inner">
              {SWYMBLE_DATA.work.map((workItem, index) => (
                <motion.div
                  key={workItem.title}
                  className="carousel-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '50px' }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="carousel-image-wrapper">
                    <img
                      src={workItem.image}
                      alt={workItem.title}
                      className="carousel-image"
                      draggable="false"
                    />
                  </div>
                  <div className="carousel-info">
                    <h3 className="w-client">{workItem.title}</h3>
                    <div className="carousel-meta">
                      <span className="w-category">{workItem.category}</span>
                      {workItem.client && <span className="w-impact">{workItem.client}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="info-row">
          <div className="info-column" style={{ width: '100%' }}>
            <div className="section-header">
              <h2>TECH & TOOLS</h2>
            </div>

            <div className="skills-container">
              {SWYMBLE_DATA.skills.map((skillCategory) => (
                <div key={skillCategory.category} className="skill-category">
                  <h3 className="w-category mb-2">{skillCategory.category}</h3>

                  <div className="skill-bar-wrapper">
                    {skillCategory.items.map((item, itemIndex) => (
                      <div
                        key={`${item.name}-${itemIndex}`}
                        className="skill-segment"
                        style={{ width: `${item.level}%`, backgroundColor: item.color }}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                      >
                        <div className="skill-tooltip">
                          <span className="tooltip-name">{item.name}</span>
                          <span className="tooltip-pct">{item.level}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="skill-legend">
                    {skillCategory.items.map((item, itemIndex) => (
                      <div key={`${item.name}-legend-${itemIndex}`} className="skill-legend-item">
                        <span className="skill-dot" style={{ backgroundColor: item.color }} />
                        <span className="skill-legend-name">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="footer-cta"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="footer-grid">
            <div className="form-container">
              <div className="section-header" style={{ marginBottom: '2rem' }}>
                <h2>LET'S TALK</h2>
              </div>

              <form className="first-person-form" onSubmit={(event) => event.preventDefault()}>
                <p className="form-sentence">
                  Hi, my name is <input type="text" placeholder="your name" className="inline-input" required />.
                  <br />
                  I&apos;m looking to build a{' '}
                  <input
                    type="text"
                    placeholder="website / app / brand"
                    className="inline-input"
                    required
                  />
                  .
                  <br />
                  You can reach me at{' '}
                  <span className="email-wrapper">
                    <input
                      type="email"
                      placeholder="email address"
                      className={`inline-input ${emailError ? 'error' : ''}`}
                      value={email}
                      onChange={handleEmailChange}
                      required
                    />
                    {emailError && <span className="custom-error">{emailError}</span>}
                  </span>
                  .
                </p>

                <button
                  type="submit"
                  className="submit-btn"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  SEND IT
                </button>
              </form>
            </div>

            <div className="find-me-container">
              <div className="section-header" style={{ marginBottom: '2rem' }}>
                <h2>FIND ME</h2>
              </div>

              <div className="socials-list">
                {SWYMBLE_DATA.socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.id}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link w-client"
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                    >
                      <Icon size={32} className="social-icon" />
                      <span>{social.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <DesktopFooter baseUrl={baseUrl} brandName={SWYMBLE_DATA.name} setIsHovering={setIsHovering} />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className="scroll-top-btn"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onClick={scrollToTop}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            aria-label="Scroll to top"
          >
            <Rocket size={32} style={{ transform: 'rotate(-45deg)' }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
