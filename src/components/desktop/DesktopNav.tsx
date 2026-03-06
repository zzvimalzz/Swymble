import { Link, NavLink } from 'react-router-dom';
import '../../styles/desktop-nav.css';

type DesktopNavProps = {
  setIsHovering: (val: boolean) => void;
  brandName: string;
};

export default function DesktopNav({ setIsHovering, brandName }: DesktopNavProps) {
  return (
    <nav className="desktop-nav">
      <div 
        className="nav-brand"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Link to="/">{brandName}</Link>
      </div>

      <div className="nav-links">
        {['Home', 'Projects', 'About', 'Blog'].map((item) => (
          <NavLink
            key={item}
            to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            end={item === 'Home'}
          >
            {item}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}