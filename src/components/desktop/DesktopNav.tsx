import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import WaveGlyph from '../system/WaveGlyph';
import { DESKTOP_NAV_ROUTES } from '../../routes';
import '../../styles/desktop-nav.css';

type DesktopNavProps = {
  brandName: string;
};

export default function DesktopNav({ brandName }: DesktopNavProps) {
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
        <Link to="/">
          <WaveGlyph className="nav-brand-glyph" />
          {brandName}
        </Link>
      </div>

      <div className="nav-links">
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