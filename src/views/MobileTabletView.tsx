import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

import MobileFloatingControls from '../components/mobile/MobileFloatingControls';
import MobileHome from './mobile/MobileHome';
import MobileBlog from './mobile/MobileBlog';
import MobileBlogPost from './mobile/MobileBlogPost';
import MobileLabs from './mobile/MobileLabs';
import { MOBILE_NAV_ROUTES } from '../routes';
import { useMobileSectionNavigation } from '../hooks/useMobileSectionNavigation';
import { useMobileTitleInteraction } from '../hooks/useMobileTitleInteraction';

import '../styles/mobile.css';
import '../styles/category-accent.css';

const HOME_RENDER_PATHS = ['/', '/projects', '/contact', '/about'];
const MOBILE_NAV_PATH_ORDER = ['/', '/projects', '/contact', '/labs', '/blog'];

export default function MobileTabletView() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHomeRoute = HOME_RENDER_PATHS.includes(location.pathname);
  const isBlogRoute = location.pathname.startsWith('/blog');
  const isLabsRoute = location.pathname === '/labs';
  const hasRouteFloatingControls = isBlogRoute || isLabsRoute;
  const [scrolled, setScrolled] = useState(false);
  const [showRouteRocket, setShowRouteRocket] = useState(false);
  const [isThumbNavOpen, setIsThumbNavOpen] = useState(false);

  const thumbNavListRef = useRef<HTMLDivElement | null>(null);
  const thumbNavSheetRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  const { activeSection, jumpToSection } = useMobileSectionNavigation({
    isHomeRoute,
    pathname: location.pathname,
    hash: location.hash,
    navigate,
  });
  const {
    titleRef,
    titleStyle,
    isTitleTapped,
    isTitleHolding,
    handleTitlePointerDown,
    handleTitlePointerMove,
    clearTitleInteraction,
  } = useMobileTitleInteraction();

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
    if (!hasRouteFloatingControls) {
      setShowRouteRocket(false);
      return;
    }

    const handleScroll = () => {
      setShowRouteRocket(window.scrollY > 220);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasRouteFloatingControls]);

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

  const orderedMobileNavRoutes = [...MOBILE_NAV_ROUTES].sort(
    (firstRoute, secondRoute) =>
      MOBILE_NAV_PATH_ORDER.indexOf(firstRoute.path) - MOBILE_NAV_PATH_ORDER.indexOf(secondRoute.path),
  );

  const thumbNavItems: Array<{
    key: string;
    label: string;
    action: () => void;
    isActive?: boolean;
  }> = orderedMobileNavRoutes.flatMap((route) => {
    const routeItem = {
      key: route.path,
      label: route.label,
      action: () => {
        if (route.mobileMode === 'home-section' && route.mobileSectionId) {
          jumpToSection(route.mobileSectionId);
          return;
        }

        navigate(route.path);
      },
      isActive:
        route.mobileMode === 'home-section' && route.mobileSectionId
          ? isHomeRoute && activeSection === route.mobileSectionId
          : route.path === '/blog'
            ? location.pathname.startsWith('/blog')
            : location.pathname === route.path,
    };

    if (route.path === '/') {
      return [
        routeItem,
        {
          key: 'home-focus',
          label: 'Overview',
          action: () => jumpToSection('focus-section'),
          isActive: isHomeRoute && activeSection === 'focus-section',
        },
      ];
    }

    if (route.path === '/projects') {
      return [
        routeItem,
        {
          key: 'home-latest-updates',
          label: 'Latest Updates',
          action: () => jumpToSection('latest-updates'),
          isActive: isHomeRoute && activeSection === 'latest-updates',
        },
      ];
    }

    return [routeItem];
  });

  const handleThumbNavItemClick = (action: () => void) => {
    action();
    setIsThumbNavOpen(false);
  };

  const handleThumbBack = () => {
    if (isLabsRoute) {
      navigate('/');
      return;
    }

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
        <Route path="/labs" element={<MobileLabs />} />
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

      <MobileFloatingControls
        isNavigationOpen={isThumbNavOpen}
        menuTriggerRef={menuTriggerRef}
        navigationSheetRef={thumbNavSheetRef}
        showBack={hasRouteFloatingControls}
        backLabel={isLabsRoute ? 'Back to home' : 'Go back'}
        onBack={handleThumbBack}
        showRocket={hasRouteFloatingControls && showRouteRocket}
        onRocket={scrollToTop}
      />
    </div>
  );
}
