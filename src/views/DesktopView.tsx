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
import { Routes, Route, useLocation } from 'react-router-dom';

import DesktopFooter from '../components/desktop/DesktopFooter';
import DesktopNav from '../components/desktop/DesktopNav';
import DesktopHome from './desktop/DesktopHome';
import DesktopProjects from './desktop/DesktopProjects';
import DesktopAbout from './desktop/DesktopAbout';
import DesktopBlog from './desktop/DesktopBlog';
import DesktopBlogPost from './desktop/DesktopBlogPost';
import DesktopLabs from './desktop/DesktopLabs';
import DesktopNotFound from './desktop/DesktopNotFound';

import { SWYMBLE_DATA } from '../data/config';
import { useDesktopContactForm } from '../hooks/useDesktopContactForm';
import { useDesktopCursor } from '../hooks/useDesktopCursor';
import '../styles/desktop.css';
import '../styles/category-accent.css';

export default function DesktopView() {
  const baseUrl = import.meta.env.BASE_URL;
  const location = useLocation();

  const [showScrollTop, setShowScrollTop] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const {
    mousePos,
    cursorVisible,
    isHovering,
    isSocialHover,
    hoverColorIndex,
    setIsHovering,
  } = useDesktopCursor();
  const contactForm = useDesktopContactForm();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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

      <DesktopNav setIsHovering={setIsHovering} brandName={SWYMBLE_DATA.name} />

      <Routes>
        <Route 
          path="/" 
          element={
            <DesktopHome 
              baseUrl={baseUrl}
              heroY={heroY}
              heroOpacity={heroOpacity}
              mousePos={mousePos}
              name={contactForm.name}
              nameError={contactForm.nameError}
              handleNameChange={contactForm.handleNameChange}
              project={contactForm.project}
              projectError={contactForm.projectError}
              handleProjectChange={contactForm.handleProjectChange}
              email={contactForm.email}
              emailError={contactForm.emailError}
              handleEmailChange={contactForm.handleEmailChange}
              formStatus={contactForm.formStatus}
              formMessage={contactForm.formMessage}
              handleFormSubmit={contactForm.handleFormSubmit}
              setIsHovering={setIsHovering}
            />
          } 
        />
        <Route 
          path="/projects" 
          element={<DesktopProjects setIsHovering={setIsHovering} />} 
        />
        <Route 
          path="/labs" 
          element={<DesktopLabs setIsHovering={setIsHovering} />} 
        />
        <Route 
          path="/about" 
          element={<DesktopAbout />} 
        />
        <Route 
          path="/blog" 
          element={<DesktopBlog />} 
        />
        <Route 
          path="/blog/:id" 
          element={<DesktopBlogPost />} 
        />
        <Route 
          path="*" 
          element={<DesktopNotFound setIsHovering={setIsHovering} />} 
        />
      </Routes>

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
