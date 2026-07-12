import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { DESKTOP_NAV_ROUTES } from '../../routes';
import '../../styles/desktop-nav.css';

type DesktopNavProps = {
  brandName: string;
  onOpenPalette?: () => void;
};

const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform);

export default function DesktopNav({ brandName, onOpenPalette }: DesktopNavProps) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const updateNavDensity = () => {
      setIsCompact(window.scrollY > 72);
    };

    updateNavDensity();
    window.addEventListener('scroll', updateNavDensity, { passive: true });
    return () => window.removeEventListener('scroll', updateNavDensity);
  }, []);

  // navEmphasis routes (e.g. /contact) render as a CTA pill after the regular links, regardless
  // of their position in SITE_ROUTES.
  const standardRoutes = DESKTOP_NAV_ROUTES.filter((route) => !route.navEmphasis);
  const emphasisRoutes = DESKTOP_NAV_ROUTES.filter((route) => route.navEmphasis);

  return (
    <nav className={`desktop-nav ${isCompact ? 'is-compact' : ''}`.trim()}>
      <div className="nav-brand">
        <Link to="/">{brandName}</Link>
      </div>

      <div className="nav-links">
        <span className="nav-availability">
          <span className="nav-availability-led" aria-hidden="true" />
          AVAILABLE
        </span>

        {onOpenPalette && (
          <button
            type="button"
            className="nav-palette-chip"
            onClick={onOpenPalette}
            aria-label="Open command palette"
            data-cursor="hover"
          >
            {isMac ? '⌘' : 'CTRL'} K
          </button>
        )}

        {standardRoutes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              `nav-link ${route.path === '/labs' ? 'labs-link' : ''} ${isActive ? 'active' : ''}`.trim()
            }
            end={route.path === '/'}
          >
            {route.label}
          </NavLink>
        ))}

        {emphasisRoutes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) => `nav-link nav-cta ${isActive ? 'active' : ''}`.trim()}
          >
            {route.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}