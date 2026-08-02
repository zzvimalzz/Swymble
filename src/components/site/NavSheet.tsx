import { useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ROUTES } from '../../routes';

type NavSheetProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

/**
 * The thumb-reachable route menu, shown instead of the top nav bar on narrow screens. Carried
 * over from the old mobile-only view, which is the one piece of it worth keeping now that a
 * single responsive view serves every width.
 */
export default function NavSheet({ isOpen, onToggle, onClose }: NavSheetProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const listRef = useRef<HTMLElement>(null);

  useEffect(() => {
    onClose();
    // Closing on navigation, so following a link doesn't leave the sheet open over the new page.
  }, [location.pathname, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <button type="button" className="nav-sheet__backdrop" onClick={onClose} aria-label="Close navigation" />
      )}

      <div className={`nav-sheet${isOpen ? ' nav-sheet--open' : ''}`} aria-hidden={!isOpen}>
        <div className="nav-sheet__header">Navigate</div>
        <nav ref={listRef} className="nav-sheet__list" aria-label="Site navigation">
          {NAV_ROUTES.map((route) => {
            const isActive =
              route.path === '/' ? location.pathname === '/' : location.pathname.startsWith(route.path);
            return (
              <button
                key={route.path}
                type="button"
                className={`nav-sheet__item${isActive ? ' nav-sheet__item--active' : ''}`}
                onClick={() => {
                  navigate(route.path);
                  onClose();
                }}
              >
                {route.label}
              </button>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        className={`nav-sheet__trigger${isOpen ? ' nav-sheet__trigger--open' : ''}`}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
    </>
  );
}
