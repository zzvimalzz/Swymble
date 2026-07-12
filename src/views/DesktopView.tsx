import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Rocket } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import DesktopFooter from '../components/desktop/DesktopFooter';
import DesktopNav from '../components/desktop/DesktopNav';
import GlitchCursor from '../components/desktop/GlitchCursor';
import DesktopHome from './desktop/DesktopHome';
import DesktopProjects from './desktop/DesktopProjects';
import DesktopAbout from './desktop/DesktopAbout';
import DesktopBlog from './desktop/DesktopBlog';
import DesktopBlogPost from './desktop/DesktopBlogPost';
import DesktopContact from './desktop/DesktopContact';
import DesktopLabs from './desktop/DesktopLabs';
import DesktopNotFound from './desktop/DesktopNotFound';

import { SWYMBLE_DATA } from '../data/config';
import { SITE_ROUTES } from '../routes';
import type { DesktopRouteElements } from '../routes';
import '../styles/desktop.css';
import '../styles/category-accent.css';

const PAGE_TRANSITION = { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] as const };

/**
 * Wraps each route's content so it remounts (via the `key={pathname}` on the parent
 * AnimatePresence child) exactly when the new page enters. Scrolling to top here — on
 * this fresh mount — rather than on `location.pathname` change means the reset fires
 * after the outgoing page's exit animation has already started/finished, so the old
 * page never visibly jumps to top mid-exit.
 */
function RouteTransitionFrame({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <>{children}</>;
}

export default function DesktopView() {
  const baseUrl = import.meta.env.BASE_URL;
  const location = useLocation();

  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Every SITE_ROUTES path must have a desktop element here. Because this object is typed as
  // DesktopRouteElements (Record<SiteRoutePath, ReactElement>), adding a new path to routes.ts
  // without adding a matching entry below is a TypeScript compile error — that's the guarantee
  // that stops the desktop view from drifting out of sync with the central route table again.
  const desktopRouteElements: DesktopRouteElements = {
    '/': <DesktopHome baseUrl={baseUrl} heroY={heroY} heroOpacity={heroOpacity} />,
    '/projects': <DesktopProjects />,
    '/labs': <DesktopLabs />,
    '/contact': <DesktopContact />,
    '/about': <DesktopAbout />,
    '/blog': <DesktopBlog />,
  };

  return (
    <div className="swymble-app desktop-view" ref={containerRef}>
      <GlitchCursor />

      <div className="bg-grid" aria-hidden="true" />

      <DesktopNav brandName={SWYMBLE_DATA.name} />

      <main id="main-content">
        {/* initial={false} must live on the wrapper div, NOT on AnimatePresence: there it
            sets PresenceContext.initial=false for the whole route subtree on first load,
            which silently suppresses every descendant's `initial` — all whileInView
            entrance animations (focus cards, project carousel, process rail) rendered
            pre-completed on first visit. Skipping just the wrapper's own fade keeps the
            original intent (no double-fade behind the app loader) without that side effect. */}
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
                  <Route key={route.path} path={route.path} element={desktopRouteElements[route.path]} />
                ))}
                <Route
                  path="/blog/:id"
                  element={<DesktopBlogPost />}
                />
                <Route
                  path="*"
                  element={<DesktopNotFound />}
                />
              </Routes>
            </RouteTransitionFrame>
          </motion.div>
        </AnimatePresence>
      </main>

      <DesktopFooter baseUrl={baseUrl} brandName={SWYMBLE_DATA.name} />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className="scroll-top-btn"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <Rocket size={32} style={{ transform: 'rotate(-45deg)' }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
