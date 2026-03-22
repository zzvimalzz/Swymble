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
import type { ChangeEvent, FormEvent } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import DesktopFooter from '../components/desktop/DesktopFooter';
import DesktopNav from '../components/desktop/DesktopNav';
import DesktopHome from './desktop/DesktopHome';
import DesktopProjects from './desktop/DesktopProjects';
import DesktopAbout from './desktop/DesktopAbout';
import DesktopBlog from './desktop/DesktopBlog';
import DesktopBlogPost from './desktop/DesktopBlogPost';
import DesktopLabs from './desktop/DesktopLabs';
import DesktopServices from './desktop/DesktopServices';
import DesktopNotFound from './desktop/DesktopNotFound';

import { SWYMBLE_DATA } from '../data/config';
import '../styles/desktop.css';

export default function DesktopView() {
  const baseUrl = import.meta.env.BASE_URL;
  const location = useLocation();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isSocialHover, setIsSocialHover] = useState(false);
  const [hoverColorIndex, setHoverColorIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [name, setName] = useState('');
  const [project, setProject] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const hoverStateRef = useRef(false);
  const cursorVisibleRef = useRef(false);
  const formStartedAtRef = useRef<number>(Date.now());
  const lastSubmittedAtRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
        Boolean(hoveredElement.closest('a')) ||
        Boolean(hoveredElement.closest('button')) ||
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

  const sanitizeInput = (value: string) =>
    value
      .replace(/[<>]/g, '')
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const validateName = (value: string) => {
    if (!value) return 'name is required';
    if (value.length < 2) return 'name must be at least 2 characters';
    if (value.length > 60) return 'name must be 60 characters or less';
    if (!/^[a-zA-Z][a-zA-Z\s'.,-]*$/.test(value)) return 'name contains invalid characters';
    return '';
  };

  const validateProject = (value: string) => {
    if (!value) return 'project details are required';
    if (value.length < 3) return 'project details are too short';
    if (value.length > 120) return 'project details must be 120 characters or less';
    return '';
  };

  const validateEmail = (value: string) => {
    if (!value) return 'email is required';
    if (value.length > 120) return 'email must be 120 characters or less';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'please enter a valid email address';
    return '';
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(event.target.value);
    setName(value);
    setNameError(value ? validateName(value) : '');
    if (formStatus !== 'idle') setFormStatus('idle');
    if (formMessage) setFormMessage(null);
  };

  const handleProjectChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(event.target.value);
    setProject(value);
    setProjectError(value ? validateProject(value) : '');
    if (formStatus !== 'idle') setFormStatus('idle');
    if (formMessage) setFormMessage(null);
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(event.target.value);
    setEmail(value);
    setEmailError(value ? validateEmail(value) : '');
    if (formStatus !== 'idle') setFormStatus('idle');
    if (formMessage) setFormMessage(null);
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const now = Date.now();
    const formData = new FormData(event.currentTarget);
    const botField = String(formData.get('website') ?? '').trim();

    if (botField) {
      setFormStatus('success');
      setFormMessage({ type: 'success', text: "Message received. I'll be in touch soon." });
      return;
    }

    if (now - formStartedAtRef.current < 3000) {
      setFormStatus('error');
      setFormMessage({ type: 'error', text: 'Please take a moment to complete the form.' });
      return;
    }

    if (now - lastSubmittedAtRef.current < 30000) {
      setFormStatus('error');
      setFormMessage({ type: 'error', text: 'Please wait 30 seconds before sending another message.' });
      return;
    }

    const cleanName = sanitizeInput(name);
    const cleanProject = sanitizeInput(project);
    const cleanEmail = sanitizeInput(email);

    const nextNameError = validateName(cleanName);
    const nextProjectError = validateProject(cleanProject);
    const nextEmailError = validateEmail(cleanEmail);

    setName(cleanName);
    setProject(cleanProject);
    setEmail(cleanEmail);
    setNameError(nextNameError);
    setProjectError(nextProjectError);
    setEmailError(nextEmailError);

    if (nextNameError || nextProjectError || nextEmailError) {
      setFormStatus('error');
      setFormMessage({ type: 'error', text: 'Please fix the highlighted fields and try again.' });
      return;
    }

    setFormStatus('sending');
    setFormMessage(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_KEY,
          name: cleanName,
          email: cleanEmail,
          subject: `New inquiry from ${cleanName} via Swymble`,
          message: `Looking to build: ${cleanProject}`,
          botcheck: '',
        }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string };

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Submission failed');
      }

      setFormStatus('success');
      setFormMessage({ type: 'success', text: "Message received. I'll be in touch soon." });
      setName('');
      setProject('');
      setEmail('');
      setNameError('');
      setProjectError('');
      setEmailError('');
      lastSubmittedAtRef.current = Date.now();
      formStartedAtRef.current = Date.now();
    } catch {
      setFormStatus('error');
      setFormMessage({ type: 'error', text: 'Unable to send right now. Please try again in a moment.' });
    } finally {
      window.clearTimeout(timeoutId);
    }
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
              name={name}
              nameError={nameError}
              handleNameChange={handleNameChange}
              project={project}
              projectError={projectError}
              handleProjectChange={handleProjectChange}
              email={email}
              emailError={emailError}
              handleEmailChange={handleEmailChange}
              formStatus={formStatus}
              formMessage={formMessage}
              handleFormSubmit={handleFormSubmit}
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
          path="/services" 
          element={<DesktopServices setIsHovering={setIsHovering} />} 
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
