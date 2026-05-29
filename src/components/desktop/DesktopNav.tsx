import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { DESKTOP_NAV_ROUTES } from '../../routes';
import '../../styles/desktop-nav.css';

type DesktopNavProps = {
  setIsHovering: (val: boolean) => void;
  brandName: string;
};

export default function DesktopNav({ setIsHovering, brandName }: DesktopNavProps) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const updateNavDensity = () => {
      setIsCompact(window.scrollY > 72);
    };

    updateNavDensity();
    window.addEventListener('scroll', updateNavDensity, { passive: true });
    return () => window.removeEventListener('scroll', updateNavDensity);
  }, []);

  return (
    <nav className={`desktop-nav ${isCompact ? 'is-compact' : ''}`.trim()}>
      <div 
        className="nav-brand"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Link to="/">{brandName}</Link>
      </div>

      <div className="nav-links">
        {DESKTOP_NAV_ROUTES.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              `nav-link ${route.path === '/labs' ? 'labs-link' : ''} ${isActive ? 'active' : ''}`.trim()
            }
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            end={route.path === '/'}
          >
            {route.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}