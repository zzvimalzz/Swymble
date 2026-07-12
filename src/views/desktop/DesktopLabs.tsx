import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import SmartImage from '../../components/SmartImage';
import TerminalBlock from '../../components/system/TerminalBlock';
import { windowGlyph } from '../../components/system/SystemWindow';
import { SWYMBLE_DATA } from '../../data/config';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import { isMailtoLink } from '../../utils/mailto';
import '../../styles/desktop-labs.css';

const GlitchRunner = lazy(() => import('../../components/games/glitch-runner/GlitchRunner'));

// The lab's playable exhibit, in a system window. Also the palette's
// `run glitch-runner` target (via /labs?sandbox=1).
function SandboxOverlay({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="sandbox-scrim" onClick={onClose} role="presentation">
      <div
        className="sandbox-window"
        role="dialog"
        aria-modal="true"
        aria-label="Glitch Runner"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sandbox-window-titlebar">
          {windowGlyph()}
          <span className="sandbox-window-title">GLITCH-RUNNER</span>
          <button ref={closeRef} type="button" className="sandbox-close" onClick={onClose}>
            ESC CLOSE
          </button>
        </div>
        <div className="sandbox-window-body">
          <Suspense fallback={<p className="labs-sandbox-note">loading cartridge…</p>}>
            <GlitchRunner />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default function DesktopLabs() {
  const location = useLocation();
  const visibleLabs = SWYMBLE_DATA.labs?.filter((lab) => lab.visibility !== 'private') ?? [];
  const [sandboxOpen, setSandboxOpen] = useState(false);

  // Depend on the primitive pathname, not the `location` object itself. See DesktopProjects.tsx
  // for why depending on the whole object causes a scroll-to-top mid-scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // `/labs?sandbox=1` (used by the command palette) opens the game directly.
  useEffect(() => {
    if (new URLSearchParams(location.search).get('sandbox') === '1') {
      setSandboxOpen(true);
    }
  }, [location.search]);

  const liveCount = visibleLabs.filter((lab) => lab.status === 'Live').length;
  const restrictedCount = visibleLabs.filter((lab) => lab.visibility !== 'public').length;
  const latest = [...visibleLabs]
    .sort((a, b) => Date.parse(`1 ${b.updatedAt}`) - Date.parse(`1 ${a.updatedAt}`))
    .slice(0, 3)
    .map((lab) => `${lab.title.toLowerCase()} upd ${lab.updatedAt.toLowerCase()}`)
    .join(' · ');

  const renderActionLink = (href: string, label: string, className: string) => {
    if (href.startsWith('/')) {
      return (
        <Link to={href} className={className}>
          {label}
        </Link>
      );
    }

    const isMailto = isMailtoLink(href);

    return (
      <a
        href={href}
        {...(isMailto ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        className={className}
      >
        {label}
      </a>
    );
  };

  return (
    <section className="layout-content desktop-labs-page">
      <div className="section-header">
        <h1>SWYMBLE LABS</h1>
      </div>

      <p className="labs-subtitle">
        In-progress experiments and proprietary systems.
      </p>

      <TerminalBlock
        className="labs-console-header"
        lines={[
          { text: 'swymble@lab:~$ ls experiments/ --status', kind: 'prompt' },
          { text: `${visibleLabs.length} entries · ${liveCount} live · ${restrictedCount} restricted`, kind: 'ok' },
          ...(latest ? [{ text: `latest: ${latest}`, kind: 'muted' as const }] : []),
        ]}
      />

      {visibleLabs.length === 0 ? (
        <div className="labs-empty-state">
          <h3>NO PUBLIC LABS YET</h3>
          <p>Current R&D items are private. Reach out if you want a confidential walkthrough.</p>
          <a
            href="mailto:hello@swymble.com?subject=Private%20Labs%20Walkthrough"
            className="lab-btn"
          >
            REQUEST PRIVATE BRIEFING
          </a>
        </div>
      ) : (
      <div className="labs-grid">
        {visibleLabs.map((labItem, index) => {
          const categoryAccentStyle = getCategoryAccentStyle(labItem.category, labItem.categoryColor);
          const labActions = labItem.actions?.length
            ? labItem.actions
            : labItem.primaryAction
              ? [labItem.primaryAction]
              : [];

          return (
            <motion.div
              key={labItem.id}
              className="lab-card"
              data-cursor="hover"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="lab-card-image-wrap">
                <SmartImage
                  src={labItem.image}
                  alt={labItem.title}
                  className="lab-card-image"
                />
                <div className="lab-card-overlay">
                  <span className="lab-status-badge">{labItem.status.toUpperCase()}</span>
                </div>
              </div>

              <div className="lab-card-content">
                <div className="lab-meta">
                  <span className="lab-category category-accent-text" style={categoryAccentStyle}>{labItem.category}</span>
                  <span className={`lab-visibility-badge visibility-${labItem.visibility}`}>
                    {labItem.visibility.toUpperCase()}
                  </span>
                </div>
                <h3 className="lab-title">{labItem.title}</h3>
                <p className="lab-desc">{labItem.publicSummary}</p>

                <ul className="lab-highlights">
                  {labItem.safeHighlights.map((highlight) => (
                    <li key={`${labItem.id}-${highlight}`} className="lab-highlight-item">
                      {highlight}
                    </li>
                  ))}
                </ul>

                <div className="lab-tags">
                  {labItem.tags.map((tag) => (
                    <span key={`${labItem.id}-${tag}`} className="lab-tag">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="lab-updated">UPDATED {labItem.updatedAt.toUpperCase()}</div>

                <div className="lab-actions">
                  {labActions.map((action, actionIndex) => {
                    const isSecondary = action.variant === 'secondary' || actionIndex > 0;

                    return (
                      <span key={`${labItem.id}-${action.label}`}>
                        {renderActionLink(action.href, action.label, `lab-btn${isSecondary ? ' secondary' : ''}`)}
                      </span>
                    );
                  })}

                  {(labItem.blogCategoryId || labItem.blogLink) && (
                    <Link
                      to={labItem.blogCategoryId ? `/blog?category=${encodeURIComponent(labItem.blogCategoryId)}` : (labItem.blogLink as string)}
                      className={`lab-btn ${labActions.length > 0 ? 'secondary' : ''}`}
                    >
                      READ BLOG
                    </Link>
                  )}

                  {labActions.length === 0 && !labItem.blogCategoryId && !labItem.blogLink && (
                    <div className="lab-btn disabled">NO PUBLIC ACTION</div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

      <div className="labs-sandbox">
        <span className="labs-sandbox-prompt">swymble@lab:~$</span>
        <button
          type="button"
          className="labs-sandbox-run"
          onClick={() => setSandboxOpen(true)}
          data-cursor="hover"
        >
          run glitch-runner
        </button>
        <span className="labs-sandbox-note">— playable build, opens in a window</span>
      </div>

      {sandboxOpen && <SandboxOverlay onClose={() => setSandboxOpen(false)} />}
    </section>
  );
}