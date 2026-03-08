import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Menu, Rocket } from 'lucide-react';

import MobileHome, { type MobileHomeSectionId } from './mobile/MobileHome';
import MobileBlog from './mobile/MobileBlog';
import MobileBlogPost from './mobile/MobileBlogPost';

import '../styles/mobile-tablet.css';
import '../styles/mobile-enhancements.css';

const HOME_SECTIONS = [
  { id: 'top', label: 'Home' },
  { id: 'services-section', label: 'What I do' },
  { id: 'projects', label: 'Projects' },
  { id: 'latest-updates', label: 'Latest Updates' },
  { id: 'contact-section', label: 'Contact' },
] as const;

const HOME_ROUTE_PATHS = new Set(['/', '/projects', '/services', '/contact', '/about', '/labs']);
const HOME_RENDER_PATHS = ['/', '/projects', '/services', '/contact'];

const getHomeSectionFromPath = (pathname: string): MobileHomeSectionId => {
  if (pathname === '/projects') return 'projects';
  if (pathname === '/services') return 'services-section';
  if (pathname === '/contact') return 'contact-section';
  return 'top';
};

export default function MobileTabletView() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHomeRoute = HOME_ROUTE_PATHS.has(location.pathname);
  const isBlogRoute = location.pathname.startsWith('/blog');
  const [scrolled, setScrolled] = useState(false);
  const [showRouteRocket, setShowRouteRocket] = useState(false);
  const [activeSection, setActiveSection] = useState<MobileHomeSectionId>('top');
  const [isTitleTapped, setIsTitleTapped] = useState(false);
  const [isTitleHolding, setIsTitleHolding] = useState(false);
  const [isThumbNavOpen, setIsThumbNavOpen] = useState(false);

  const holdTimerRef = useRef<number | null>(null);
  const holdDropTimerRef = useRef<number | null>(null);
  const tapResetTimerRef = useRef<number | null>(null);

  const holdReadyRef = useRef(false);
  const holdActivatedRef = useRef(false);
  const pointerDownRef = useRef(false);
  const pointerInsideRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const thumbNavListRef = useRef<HTMLDivElement | null>(null);
  const thumbNavSheetRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const thumbBackRef = useRef<HTMLButtonElement | null>(null);

  const [routeRocketBottom, setRouteRocketBottom] = useState<number | null>(null);

  useEffect(() => {
    if (!isHomeRoute) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomeRoute]);

  useEffect(() => {
    if (!isBlogRoute) {
      setShowRouteRocket(false);
      return;
    }

    const handleScroll = () => {
      setShowRouteRocket(window.scrollY > 220);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isBlogRoute]);

  useEffect(() => {
    if (!isBlogRoute || !showRouteRocket) {
      setRouteRocketBottom(null);
      return;
    }

    let frameId: number | null = null;

    const updateRouteRocketPosition = () => {
      const candidates: Array<HTMLElement | null> = [menuTriggerRef.current, thumbBackRef.current];
      if (isThumbNavOpen) {
        candidates.push(thumbNavSheetRef.current);
      }

      const visibleRects = candidates
        .filter((node): node is HTMLElement => Boolean(node))
        .map((node) => node.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0);

      if (visibleRects.length === 0) {
        setRouteRocketBottom(null);
        return;
      }

      const highestTop = Math.min(...visibleRects.map((rect) => rect.top));
      const nextBottom = Math.max(24, Math.round(window.innerHeight - highestTop + 12));
      setRouteRocketBottom(nextBottom);
    };

    const scheduleUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateRouteRocketPosition();
      });
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isBlogRoute, showRouteRocket, isThumbNavOpen]);

  useEffect(() => {
    const className = 'mobile-snap-enabled';

    if (isHomeRoute) {
      document.documentElement.classList.add(className);
      document.body.classList.add(className);
    } else {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    }

    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [isHomeRoute]);

  useEffect(() => {
    if (!isHomeRoute) {
      return;
    }

    let frameId: number | null = null;

    const updateActiveSection = () => {
      const anchorY = window.scrollY + window.innerHeight * 0.42;
      let nextSection: MobileHomeSectionId = 'top';

      HOME_SECTIONS.forEach((section) => {
        const node = document.getElementById(section.id);
        if (!node) return;

        if (node.offsetTop <= anchorY) {
          nextSection = section.id;
        }
      });

      setActiveSection((prev) => (prev === nextSection ? prev : nextSection));
    };

    const handleScroll = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateActiveSection();
      });
    };

    updateActiveSection();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isHomeRoute, location.pathname]);

  useEffect(() => {
    if (!isHomeRoute) {
      return;
    }

    const hashId = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
    const targetSectionId = (hashId || getHomeSectionFromPath(location.pathname)) as MobileHomeSectionId;

    const frame = window.setTimeout(() => {
      if (targetSectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveSection('top');
        return;
      }

      const targetNode = document.getElementById(targetSectionId);
      if (targetNode) {
        targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(targetSectionId);
      }
    }, 30);

    return () => window.clearTimeout(frame);
  }, [isHomeRoute, location.pathname, location.hash]);

  useEffect(() => {
    setIsThumbNavOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isThumbNavOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const listNode = thumbNavListRef.current;
      if (!listNode) return;

      const activeItem = listNode.querySelector<HTMLButtonElement>('.mobile-thumb-nav-item.active');
      activeItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isThumbNavOpen, activeSection, location.pathname]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
      if (holdDropTimerRef.current !== null) window.clearTimeout(holdDropTimerRef.current);
      if (tapResetTimerRef.current !== null) window.clearTimeout(tapResetTimerRef.current);
    };
  }, []);

  const triggerTapFeedback = () => {
    setIsTitleTapped(true);

    if (tapResetTimerRef.current !== null) {
      window.clearTimeout(tapResetTimerRef.current);
    }

    tapResetTimerRef.current = window.setTimeout(() => {
      setIsTitleTapped(false);
      tapResetTimerRef.current = null;
    }, 260);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const clearHoldDropTimer = () => {
    if (holdDropTimerRef.current !== null) {
      window.clearTimeout(holdDropTimerRef.current);
      holdDropTimerRef.current = null;
    }
  };

  const isPointerInsideTitle = (clientX: number, clientY: number) => {
    const titleNode = titleRef.current;
    if (!titleNode) return false;

    const rect = titleNode.getBoundingClientRect();
    const hitPadding = 14;

    return (
      clientX >= rect.left - hitPadding &&
      clientX <= rect.right + hitPadding &&
      clientY >= rect.top - hitPadding &&
      clientY <= rect.bottom + hitPadding
    );
  };

  const handleTitlePointerDown = (event: ReactPointerEvent<HTMLHeadingElement>) => {
    setIsTitleTapped(false);
    setIsTitleHolding(false);

    pointerDownRef.current = true;
    pointerInsideRef.current = true;
    activePointerIdRef.current = event.pointerId;
    holdReadyRef.current = false;
    holdActivatedRef.current = false;

    event.currentTarget.setPointerCapture(event.pointerId);
    clearHoldTimer();
    clearHoldDropTimer();

    holdTimerRef.current = window.setTimeout(() => {
      holdReadyRef.current = true;

      if (pointerDownRef.current && pointerInsideRef.current) {
        holdActivatedRef.current = true;
        setIsTitleHolding(true);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([16, 20, 16]);
        }
      }

      holdTimerRef.current = null;
    }, 280);
  };

  const handleTitlePointerMove = (event: ReactPointerEvent<HTMLHeadingElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const isInside = isPointerInsideTitle(event.clientX, event.clientY);
    pointerInsideRef.current = isInside;

    if (!isInside && holdReadyRef.current) {
      if (holdDropTimerRef.current === null) {
        holdDropTimerRef.current = window.setTimeout(() => {
          holdDropTimerRef.current = null;
          if (pointerDownRef.current && !pointerInsideRef.current) {
            setIsTitleHolding(false);
          }
        }, 70);
      }
      return;
    }

    clearHoldDropTimer();

    if (pointerDownRef.current && holdReadyRef.current) {
      holdActivatedRef.current = true;
      setIsTitleHolding(true);
    }
  };

  const clearTitleInteraction = (event: ReactPointerEvent<HTMLHeadingElement>) => {
    if (activePointerIdRef.current !== null && activePointerIdRef.current === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      activePointerIdRef.current = null;
    }

    const shouldTriggerTap = pointerDownRef.current && !holdActivatedRef.current;

    pointerDownRef.current = false;
    pointerInsideRef.current = false;
    holdReadyRef.current = false;
    holdActivatedRef.current = false;

    clearHoldTimer();
    clearHoldDropTimer();
    setIsTitleHolding(false);

    if (shouldTriggerTap) {
      triggerTapFeedback();
    }
  };

  const jumpToSection = (sectionId: MobileHomeSectionId) => {
    if (!isHomeRoute) {
      navigate(`/#${sectionId}`);
      return;
    }

    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('top');
      return;
    }

    const targetNode = document.getElementById(sectionId);
    if (targetNode) {
      targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const titleStyle = {
    '--title-hold-scale': isTitleHolding ? 1.14 : 1,
  } as CSSProperties;

  const thumbNavItems: Array<{
    key: string;
    label: string;
    action: () => void;
    isActive?: boolean;
  }> = [
    {
      key: 'home-top',
      label: 'Home',
      action: () => jumpToSection('top'),
      isActive: isHomeRoute && activeSection === 'top',
    },
    {
      key: 'home-services',
      label: 'What I do',
      action: () => jumpToSection('services-section'),
      isActive: isHomeRoute && activeSection === 'services-section',
    },
    {
      key: 'home-projects',
      label: 'Projects',
      action: () => jumpToSection('projects'),
      isActive: isHomeRoute && activeSection === 'projects',
    },
    {
      key: 'home-latest-updates',
      label: 'Latest Updates',
      action: () => jumpToSection('latest-updates'),
      isActive: isHomeRoute && activeSection === 'latest-updates',
    },
    {
      key: 'home-contact',
      label: 'Contact',
      action: () => jumpToSection('contact-section'),
      isActive: isHomeRoute && activeSection === 'contact-section',
    },
    {
      key: 'blog',
      label: 'Blog',
      action: () => navigate('/blog'),
      isActive: location.pathname.startsWith('/blog'),
    },
  ];

  const handleThumbNavItemClick = (action: () => void) => {
    action();
    setIsThumbNavOpen(false);
  };

  const handleThumbBack = () => {
    if (location.pathname.startsWith('/blog/')) {
      const category = new URLSearchParams(location.search).get('category');
      navigate(category ? `/blog?category=${encodeURIComponent(category)}` : '/blog');
      return;
    }

    if (location.pathname === '/blog') {
      navigate('/');
      return;
    }

    navigate(-1);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const homeElement = (
    <MobileHome
      scrolled={scrolled}
      isTitleTapped={isTitleTapped}
      isTitleHolding={isTitleHolding}
      titleStyle={titleStyle}
      titleRef={titleRef}
      onTitlePointerDown={handleTitlePointerDown}
      onTitlePointerMove={handleTitlePointerMove}
      onTitleInteractionEnd={clearTitleInteraction}
      onJumpToSection={jumpToSection}
    />
  );

  return (
    <div className={`mobile-view ${isThumbNavOpen ? 'thumb-nav-open' : ''}`}>
      <Routes>
        {HOME_RENDER_PATHS.map((path) => (
          <Route key={path} path={path} element={homeElement} />
        ))}
        <Route path="/blog" element={<MobileBlog />} />
        <Route path="/blog/:id" element={<MobileBlogPost />} />
        <Route path="*" element={homeElement} />
      </Routes>

      {isThumbNavOpen && (
        <button
          type="button"
          className="mobile-thumb-nav-backdrop"
          onClick={() => setIsThumbNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <div
        ref={thumbNavSheetRef}
        className={`mobile-thumb-nav-sheet ${isThumbNavOpen ? 'open' : ''}`}
        aria-hidden={!isThumbNavOpen}
      >
        <div className="mobile-thumb-nav-header">
          <span>Navigate</span>
        </div>

        <div ref={thumbNavListRef} className="mobile-thumb-nav-list" role="menu" aria-label="Thumb navigation list">
          {thumbNavItems.map((item) => {
            return (
              <button
                key={item.key}
                type="button"
                className={`mobile-thumb-nav-item ${item.isActive ? 'active' : ''}`}
                onClick={() => handleThumbNavItemClick(item.action)}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        ref={menuTriggerRef}
        type="button"
        className={`mobile-thumb-nav-trigger ${isThumbNavOpen ? 'open' : ''}`}
        aria-label="Open section navigation"
        aria-expanded={isThumbNavOpen}
        onClick={() => setIsThumbNavOpen((prev) => !prev)}
      >
        <Menu size={18} />
      </button>

      {isBlogRoute && (
        <button
          ref={thumbBackRef}
          type="button"
          className="mobile-thumb-back-trigger"
          aria-label="Go back"
          onClick={handleThumbBack}
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {isBlogRoute && showRouteRocket && (
        <button
          type="button"
          className="rocket-to-top mobile-route-rocket"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          style={
            routeRocketBottom !== null
              ? ({ '--route-rocket-bottom': `${routeRocketBottom}px` } as CSSProperties)
              : undefined
          }
        >
          <Rocket size={28} style={{ transform: 'rotate(-45deg)' }} />
        </button>
      )}
    </div>
  );
}
