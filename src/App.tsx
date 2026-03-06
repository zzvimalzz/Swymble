import { motion, useScroll, useTransform, useSpring, useAnimationFrame, useMotionValue, wrap, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Rocket } from 'lucide-react';
import { SWYMBLE_DATA } from './data/config';
import './Swymble.css';

function ParallaxMarquee({ text, setIsHovering }: { text: string; setIsHovering: (val: boolean) => void }) {
  const baseX = useMotionValue(0);
  const mouseVelocity = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const screenCenterX = window.innerWidth / 2;
      const mouseX = e.clientX;
      const pct = (mouseX - screenCenterX) / screenCenterX; // -1 to 1
      mouseVelocity.set(pct);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useAnimationFrame((_, delta) => {
    let moveBy = (mouseVelocity.get() * 0.02) * (delta / 16);
    baseX.set(baseX.get() + moveBy);
  });

  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`);

  return (
    <div 
      className="marquee-container"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <motion.div className="marquee-content" style={{ x }}>
        {[...Array(8)].map((_, i) => (
          <span key={i}>{text}</span>
        ))}
      </motion.div>
    </div>
  );
}

function ProximityCard({ svc, index, mousePos }: { svc: any, index: number, mousePos: { x: number, y: number } }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [metric, setMetric] = useState({ x: 0, y: 0, dist: 1000 });

  useEffect(() => {
    const updateMetric = () => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(mousePos.x - x, 2) + Math.pow(mousePos.y - y, 2));
        
        setMetric({ 
          x: mousePos.x - rect.left, 
          y: mousePos.y - rect.top, 
          dist 
        });
      }
    };

    updateMetric();
    window.addEventListener('scroll', updateMetric, { passive: true });
    return () => window.removeEventListener('scroll', updateMetric);
  }, [mousePos]);

  // Max distance to feel the mouse presence
  const maxDist = 600; 
  const prox = Math.max(0, 1 - metric.dist / maxDist);
  const powerProx = Math.pow(prox, 2);

  // Rotate slightly away/towards the mouse based on proximity
  const rotateX = powerProx * ((metric.y - (cardRef.current?.offsetHeight || 0) / 2) / 10);
  const rotateY = powerProx * -((metric.x - (cardRef.current?.offsetWidth || 0) / 2) / 10);

  return (
    <motion.div 
      ref={cardRef}
      className={`service-card proxy-card`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
      style={{
        transformPerspective: 1000,
        rotateX: rotateX,
        rotateY: rotateY,
        scale: 1 + powerProx * 0.05,
        '--mouse-x': `${metric.x}px`,
        '--mouse-y': `${metric.y}px`,
        '--prox': prox,
        '--power': powerProx,
        '--card-color': svc.colorHex,
        '--card-color-rgb': svc.colorRgb
      } as React.CSSProperties}
    >
      <div className="card-glare" />
      <div className="card-inner-border" />
      <div className="card-content-inner">
        <h3>{svc.title}</h3>
        <p className="service-desc">{svc.desc}</p>
      </div>
    </motion.div>
  );
}

function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isSocialHover, setIsSocialHover] = useState(false);
  const [hoverColorIndex, setHoverColorIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const hoverStateRef = useRef(false);
  const cursorVisibleRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const worksCarouselRef = useRef<HTMLDivElement>(null);
  const [, setCarouselWidth] = useState(0);
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError("please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const { scrollYProgress } = useScroll({ target: containerRef });
  
  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroY = useTransform(springScroll, [0, 1], [0, 400]);
  const heroOpacity = useTransform(springScroll, [0, 0.2], [1, 0]);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 400) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  });

  useEffect(() => {
    if (worksCarouselRef.current) {
      setCarouselWidth(worksCarouselRef.current.scrollWidth - worksCarouselRef.current.offsetWidth);
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;

    const checkHover = () => {
      const el = document.elementFromPoint(currentX, currentY);

      document.querySelectorAll('.service-card.force-hover, .carousel-card.force-hover').forEach(node => {
        node.classList.remove('force-hover');
      });

      if (el) {
        const sCard = el.closest('.service-card');
        if (sCard) {
          sCard.classList.add('force-hover');
        }

        const cCard = el.closest('.carousel-card');
        if (cCard) {
          cCard.classList.add('force-hover');
        }

        if (el.tagName.toLowerCase() === 'a' || 
            el.tagName.toLowerCase() === 'button' || 
            el.tagName.toLowerCase() === 'input' || 
            el.tagName.toLowerCase() === 'select' || 
            el.closest('.service-card') ||
            el.closest('.w-client') ||
            el.closest('.carousel-card') ||
            el.closest('.hero-title')) {
          if (!hoverStateRef.current) {
            setHoverColorIndex(prev => (prev + 1) % 3);
            hoverStateRef.current = true;
          }
          setIsHovering(true);
        } else {
          hoverStateRef.current = false;
          setIsHovering(false);
        }

        if (el.closest('.social-link')) {
          setIsSocialHover(true);
        } else {
          setIsSocialHover(false);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!cursorVisibleRef.current) {
        cursorVisibleRef.current = true;
        setCursorVisible(true);
      }
      currentX = e.clientX;
      currentY = e.clientY;
      setMousePos({ x: currentX, y: currentY });
      checkHover();
    };

    const handleScroll = () => {
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  const cursorColors = ['var(--accent-volt)', 'var(--accent-neon)', '#00F0FF'];

  return (
    <div className="swymble-app" ref={containerRef}>
      <div 
        className={`glitch-cursor ${isHovering ? 'hovering' : ''} ${isSocialHover ? 'social-hover' : ''}`}
        style={{ 
          left: mousePos.x, 
          top: mousePos.y,
          backgroundColor: (isHovering || isSocialHover) ? cursorColors[hoverColorIndex] : 'var(--accent-volt)',
          opacity: cursorVisible ? 1 : 0
        }}
      />
      
      <div className="bg-grid" />

      <motion.section 
        className="hero-section"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="hero-bg-logo">
          <img src="/favicon.png" alt="Swymble Background Logo" />
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
          {SWYMBLE_DATA.services.map((svc, i) => (
            <ProximityCard key={svc.title} svc={svc} index={i} mousePos={mousePos} />
          ))}
        </div>

        <div className="work-carousel-section">
          <div className="section-header">
            <h2>SELECTED WORKS</h2>
          </div>

          <div ref={worksCarouselRef} className="carousel-container">
            <div className="carousel-inner">
              {SWYMBLE_DATA.work.map((wk, i) => (
                <motion.div 
                  key={wk.title}
                  className="carousel-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div className="carousel-image-wrapper">
                    <img src={wk.image} alt={wk.title} className="carousel-image" draggable="false" />
                  </div>
                  <div className="carousel-info">
                    <h3 className="w-client">{wk.title}</h3>
                    <div className="carousel-meta">
                      <span className="w-category">{wk.category}</span>
                      {wk.client && <span className="w-impact">{wk.client}</span>}
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
              {SWYMBLE_DATA.skills.map((skillCat) => (
                <div key={skillCat.category} className="skill-category">
                  <h3 className="w-category mb-2">{skillCat.category}</h3>
                  <div className="skill-bar-wrapper">
                    {skillCat.items.map((item, i) => (
                      <div 
                        key={i} 
                        className="skill-segment"
                        style={{ 
                          width: `${item.level}%`, 
                          backgroundColor: item.color 
                        }}
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
                    {skillCat.items.map((item, i) => (
                      <div key={i} className="skill-legend-item">
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
              <form className="first-person-form" onSubmit={(e) => e.preventDefault()}>
                <p className="form-sentence">
                  Hi, my name is <input type="text" placeholder="your name" className="inline-input" required />. 
                  <br/>
                  I'm looking to build a <input type="text" placeholder="website / app / brand" className="inline-input" required />. 
                  <br/>
                  You can reach me at <span className="email-wrapper"><input type="email" placeholder="email address" className={`inline-input ${emailError ? 'error' : ''}`} value={email} onChange={handleEmailChange} required />{emailError && <span className="custom-error">{emailError}</span>}</span>.
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

      <footer className="site-footer">
        <div className="footer-logo-center" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <img src="/logo-with-name.png" alt={`${SWYMBLE_DATA.name} Logo`} className="footer-logo-full-centered" />
        </div>
        
        <div className="footer-bottom-bar">
          <div className="footer-brand" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <span className="footer-copyright">&copy; {new Date().getFullYear()} {SWYMBLE_DATA.name}</span>
          </div>

          <div className="footer-status">
            <span className="status-dot"></span>
            <span className="status-text">AVAILABLE FOR WORK</span>
          </div>

          <div className="footer-legal">
            <span onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>BUILT WITH PASSION</span>
          </div>
        </div>
      </footer>

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

export default App;
