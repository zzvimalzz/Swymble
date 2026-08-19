import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import DesktopFooter from '../components/desktop/DesktopFooter';
import DesktopNav from '../components/desktop/DesktopNav';
import GlitchCursor from '../components/desktop/GlitchCursor';
import FloatingControls from '../components/site/FloatingControls';
import { LABS_COMPACT_QUERY } from '../components/desktop/Labs/breakpoints';
import NavSheet from '../components/site/NavSheet';
import DesktopHome from './desktop/DesktopHome';
import DesktopProjects from './desktop/DesktopProjects';
import DesktopAbout from './desktop/DesktopAbout';
import DesktopBlog from './desktop/DesktopBlog';
import DesktopBlogPost from './desktop/DesktopBlogPost';
import DesktopContact from './desktop/DesktopContact';
import DesktopLabDetail from './desktop/DesktopLabDetail';
import DesktopLabs from './desktop/DesktopLabs';
import DesktopNotFound from './desktop/DesktopNotFound';
import DesktopResume from './desktop/DesktopResume';

import useMediaQuery from '../hooks/useMediaQuery';
import { SWYMBLE_DATA } from '../data/config';
import { SITE_ROUTES } from '../routes';
import type { SiteRouteElements } from '../routes';
import '../styles/desktop.css';
import '../styles/category-accent.css';

const PAGE_TRANSITION = { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] as const };

/**
 * Wraps each route's content so it remounts (via the `key={pathname}` on the parent
 * AnimatePresence child) exactly when the new page enters. Scrolling to top here — on
 * this fresh mount — rather than on `location.pathname` change means the reset fires
 * after the outgoing page's exit animation has already started, so the old page never
 * visibly jumps to top mid-exit.
 */
function RouteTransitionFrame({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <>{children}</>;
}

/**
 * The whole site, at every width. There used to be a second, entirely separate mobile view with
 * its own routes, components and stylesheets; the pages are responsive now, so one tree serves
 * both and there is only ever one implementation of a page to keep correct.
 */
export default function SiteView() {
  const baseUrl = import.meta.env.BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();

  const [showScrollTop, setShowScrollTop] = useState(false);
  /** Set by the labs page while its gravity mode is on — see DesktopLabs. */
  const [gravityActive, setGravityActive] = useState(false);
  // The same query DesktopLabs hands useGravityMode. Both have to read it, or the button and the
  // thing it triggers disagree — which is how the phone ended up with an anvil that did nothing.
  const isLabsCompact = useMediaQuery(LABS_COMPACT_QUERY);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // True only during the very first render — used to skip the page-transition fade on
  // initial load (the app loader already covers it) without disabling anything else.
  const isFirstRender = useRef(true);
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

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
    const onGravityState = (event: Event) => {
      setGravityActive(Boolean((event as CustomEvent<{ active: boolean }>).detail?.active));
    };
    window.addEventListener('swymble:gravity-state', onGravityState);
    return () => window.removeEventListener('swymble:gravity-state', onGravityState);
  }, []);

  // Gravity ends when the page it belongs to does.
  useEffect(() => {
    if (location.pathname !== '/labs') setGravityActive(false);
  }, [location.pathname]);

  const scrollToTop = () => {
    // A fallen page does not scroll, so the rocket is just another object lying in the pile: it
    // can be picked up and thrown, and pressing it does nothing. The anvil is what puts the page
    // back, and it is right below it.
    if (gravityActive) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeNav = useCallback(() => setIsNavOpen(false), []);

  const isHome = location.pathname === '/';
  const handleBack = () => {
    // A lab page goes back to the labs index rather than into history — arriving on /labs/mydompet
    // straight from a search result is the normal case for these pages, and there is nothing
    // useful behind it.
    if (location.pathname.startsWith('/labs/')) {
      navigate('/labs');
      return;
    }

    // A blog post goes back to the list it came from, preserving the category filter; anything
    // else falls back to browser history, then home.
    if (location.pathname.startsWith('/blog/')) {
      const category = new URLSearchParams(location.search).get('category');
      navigate(category ? `/blog?category=${encodeURIComponent(category)}` : '/blog');
      return;
    }
    navigate(-1);
  };

  const routeElements: SiteRouteElements = {
    '/': <DesktopHome baseUrl={baseUrl} heroY={heroY} heroOpacity={heroOpacity} />,
    '/projects': <DesktopProjects />,
    '/labs': <DesktopLabs />,
    '/contact': <DesktopContact />,
    '/about': <DesktopAbout />,
    '/resume': <DesktopResume />,
    '/blog': <DesktopBlog />,
  };

  return (
    <div className={`swymble-app${isNavOpen ? ' nav-sheet-open' : ''}`} ref={containerRef}>
      <GlitchCursor />

      <div className="bg-grid" aria-hidden="true" />

      <DesktopNav brandName={SWYMBLE_DATA.name} />

      <main id="main-content">
        {/* initial={false} must live on the wrapper div, NOT on AnimatePresence: there it
            sets PresenceContext.initial=false for the whole route subtree on first load,
            which silently suppresses every descendant's `initial` — all whileInView
            entrance animations rendered pre-completed on first visit. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={isFirstRender.current ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={PAGE_TRANSITION}
          >
            <RouteTransitionFrame>
              <Routes location={location}>
                {SITE_ROUTES.map((route) => (
                  <Route key={route.path} path={route.path} element={routeElements[route.path]} />
                ))}
                <Route path="/blog/:id" element={<DesktopBlogPost />} />
                <Route path="/labs/:id" element={<DesktopLabDetail />} />
                <Route path="*" element={<DesktopNotFound />} />
              </Routes>
            </RouteTransitionFrame>
          </motion.div>
        </AnimatePresence>
      </main>

      <DesktopFooter baseUrl={baseUrl} brandName={SWYMBLE_DATA.name} />

      <FloatingControls
        showBack={!isHome}
        onBack={handleBack}
        showRocket={showScrollTop || gravityActive}
        onRocket={scrollToTop}
        // Gravity belongs to the labs page and nowhere else. The shell only knows that the button
        // exists there; what it does is entirely DesktopLabs' business, hence the event rather
        // than a prop drilled through the router.
        // Not on a phone: gravity is desktop-only (see breakpoints.ts), and a button for a mode
        // that cannot start is worse than no button.
        showGravity={
          location.pathname === '/labs' && !isLabsCompact && (showScrollTop || gravityActive)
        }
        onGravity={() => window.dispatchEvent(new CustomEvent('swymble:gravity'))}
        gravityActive={gravityActive}
      />

      <NavSheet isOpen={isNavOpen} onToggle={() => setIsNavOpen((open) => !open)} onClose={closeNav} />
    </div>
  );
}
