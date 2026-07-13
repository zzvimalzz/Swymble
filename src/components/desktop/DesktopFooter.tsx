import { Link } from 'react-router-dom';
import WaveField from '../canvas/WaveField';
import { DESKTOP_NAV_ROUTES } from '../../routes';
import { BUILD_COMMIT, SWYMBLE_BASE_LOCATION } from '../../utils/buildInfo';

/**
 * FinaleExperience — the site ends on purpose. The sea returns full-width,
 * the wordmark floats in it as a stroke-only outline, and the last readout
 * is true: year, base, build. ("BUILT WITH PASSION" retired — the project's
 * own conventions ban that kind of copy.)
 */

type DesktopFooterProps = {
  brandName: string;
};

export default function DesktopFooter({ brandName }: DesktopFooterProps) {
  return (
    <footer className="finale">
      <div className="finale-sea">
        <WaveField variant="finale" className="finale-field" />
        <span className="finale-wordmark" aria-hidden="true">
          {brandName}
        </span>
      </div>

      <div className="finale-bar">
        <nav className="finale-sitemap" aria-label="Footer">
          {DESKTOP_NAV_ROUTES.map((route) => (
            <Link key={route.path} to={route.path} className="finale-link" data-cursor="hover">
              {route.label.toUpperCase()}
            </Link>
          ))}
        </nav>

        <div className="finale-status">
          <span className="nav-availability">
            <span className="nav-availability-led" aria-hidden="true" />
            AVAILABLE FOR WORK
          </span>
        </div>

        <span className="finale-stamp">
          © {new Date().getFullYear()} {brandName} · {SWYMBLE_BASE_LOCATION} · BUILD {BUILD_COMMIT.toUpperCase()}
        </span>
      </div>
    </footer>
  );
}
