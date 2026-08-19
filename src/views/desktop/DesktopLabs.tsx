import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import BubbleField from '../../components/desktop/Labs/BubbleField';
import { useGravityMode } from '../../components/desktop/Labs/useGravityMode';
import LabAccordion from '../../components/desktop/Labs/LabAccordion';
import { LabActions, STATUS_MODIFIER } from '../../components/desktop/Labs/labPresentation';
import useMediaQuery from '../../hooks/useMediaQuery';
import { SWYMBLE_DATA } from '../../data/config';
import type { SwymbleLab } from '../../data/types';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import { serializeJsonLd } from '../../utils/jsonLd';
import { labsIndexJsonLd } from '../../utils/labSeo';
import '../../styles/desktop-labs.css';

/** Where the card grid has already collapsed to one column, and the stacked cards get long. */
const COMPACT_QUERY = '(max-width: 780px)';

export default function DesktopLabs() {
  const location = useLocation();
  const visibleLabs = SWYMBLE_DATA.labs?.filter((lab) => lab.visibility !== 'private') ?? [];

  const isCompact = useMediaQuery(COMPACT_QUERY);

  // Deliberately component state and not a URL parameter: an open card is a thing you did a
  // moment ago, not a place. Reloading /labs should hand the bubbles back their freedom rather
  // than restoring a row nobody asked for.
  const [openId, setOpenId] = useState<string | null>(null);
  const openIndex = visibleLabs.findIndex((lab) => lab.id === openId);
  const openLab = openIndex >= 0 ? visibleLabs[openIndex] : null;

  const selectLab = useCallback((id: string | null) => setOpenId(id), []);

  // Only this page has gravity, and only while it is mounted: navigating away puts the page back
  // together, which is the reset a reader gets by leaving and returning.
  const { active: gravityActive, captureDeck } = useGravityMode(!isCompact);

  // The deck does not exist when gravity is switched on — it appears only once a bubble has been
  // pressed — so it is handed to the simulation here instead. One frame's delay: the cards have to
  // be laid out before they can be measured.
  useEffect(() => {
    if (!gravityActive) return undefined;
    const frame = requestAnimationFrame(() => captureDeck(Boolean(openId)));
    return () => cancelAnimationFrame(frame);
  }, [captureDeck, gravityActive, openId]);

  // The corner buttons fall with everything else, and they unmount as soon as the reader scrolls
  // back above the rocket's threshold — taking the button that turns gravity *off* with them. The
  // shell keeps them mounted while this is true.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('swymble:gravity-state', { detail: { active: gravityActive } }));
  }, [gravityActive]);
  // Null, not the first lab: the point of collapsing is that the whole list is visible at once,
  // and opening one by default puts the reader back to scrolling before they have chosen anything.
  const [openLabId, setOpenLabId] = useState<string | null>(null);

  // Depend on the primitive pathname, not the `location` object itself. See DesktopProjects.tsx
  // for why depending on the whole object causes a scroll-to-top mid-scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  /** The insides of a deck card, shared by the two renderings of it — see the branch below.
   *  `data-gravity-item` marks the pieces that fall *within* the card once it is in the pile. */
  const renderCard = (deckLab: SwymbleLab, offset: number) => (
    <>
                {/* The chips fall, not the row: the row is a full-width flex strip, and as a single
                    body it dropped through the card as one long bar. */}
                <div className="lab-meta">
                  <span
                    className="lab-category category-accent-text"
                    style={getCategoryAccentStyle(deckLab.category, deckLab.categoryColor)}
                    data-gravity-item
                  >
                    {deckLab.category}
                  </span>
                  <span
                    className={`lab-status-badge lab-status-badge--${STATUS_MODIFIER[deckLab.status]}`}
                    data-gravity-item
                  >
                    {deckLab.status.toUpperCase()}
                  </span>
                </div>

                {/* The link falls, not the h2: a heading is a block box the full width of the card,
                    and as a body it dropped as an invisible bar with the title stuck to one end. */}
                <h2 className="lab-title">
                  <Link to={`/labs/${deckLab.id}`} tabIndex={offset === 0 ? 0 : -1} data-gravity-item>
                    {deckLab.title}
                  </Link>
                </h2>

                <p className="lab-desc" data-gravity-item data-gravity-words>
                  {deckLab.detail?.oneLiner ?? deckLab.publicSummary}
                </p>

                <ul className="lab-highlights">
                  {deckLab.safeHighlights.slice(0, 3).map((highlight) => (
                    <li key={`${deckLab.id}-${highlight}`} className="lab-highlight-item" data-gravity-item data-gravity-words>
                      {highlight}
                    </li>
                  ))}
                </ul>

                <LabActions lab={deckLab} showDetailLink />
    </>
  );

  return (
    <section className="layout-content desktop-labs-page">
      {/* Says "this page is a list of N named products, and here they are" rather than leaving a
          crawler to infer it from a grid of divs. Inline rather than in useRouteSeo because it is
          derived from the same `visibleLabs` the page renders, so the two cannot disagree. */}
      {visibleLabs.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(labsIndexJsonLd(visibleLabs)) }}
        />
      )}

      <div className="section-header" data-bubble-obstacle>
        <h1>SWYMBLE LABS</h1>
      </div>

      <p className="labs-subtitle" data-bubble-obstacle>
        In-progress experiments and proprietary systems.
      </p>

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
      ) : isCompact ? (
        <LabAccordion
          labs={visibleLabs}
          openId={openLabId}
          onToggle={(id) => setOpenLabId((current) => (current === id ? null : id))}
        />
      ) : (
        <>
          {/* The strip the row collapses into. Zero height while the field is loose, so the
              bubbles have the whole page; measured by BubbleField, never positioned by it. */}
          <div className={`lab-bubble-band${openLab ? ' is-open' : ''}`} data-bubble-band />

          <BubbleField
            labs={visibleLabs}
            selectedId={openLab ? openLab.id : null}
            onSelect={selectLab}
            // While the page is falling, the bubbles are bodies in the rigid-body world instead —
            // two solvers writing the same transforms would fight over every frame.
            paused={gravityActive}
          />

          {/* A deck, not a single card: every lab is mounted the whole time, the open one at the
              front and its neighbours set back in the dark. Choosing another bubble rotates the
              deck rather than swapping one card for another, so nothing appears from nowhere. */}
          <AnimatePresence>
            {openLab && (
              <motion.div
                className="lab-deck"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                {visibleLabs.map((deckLab, index) => {
                  const offset = index - openIndex;
                  const depth = Math.abs(offset);

                  // Two renderings of the same card. With gravity on there is no deck at all — just
                  // the one card that was pressed, falling into the pile; pressing another bubble
                  // swaps it for that lab's card. A stack of blurred cards behind it was scenery
                  // the physics had to carry and the reader could not use.
                  if (gravityActive) {
                    if (offset !== 0) return null;

                    return (
                      <article
                        key={deckLab.id}
                        className="lab-deck__card is-front"
                        style={{ zIndex: 3, transformOrigin: '50% 50%' }}
                      >
                        {renderCard(deckLab, offset)}
                      </article>
                    );
                  }

                  return (
                    <motion.article
                      key={deckLab.id}
                      className={`lab-deck__card${offset === 0 ? ' is-front' : ''}`}
                      // z-index cannot be tweened, so it is set outright — a card must change
                      // stacking the instant it starts moving, not halfway through.
                      style={{ zIndex: 20 - depth, pointerEvents: depth > 1 ? 'none' : 'auto' }}
                      animate={{
                        x: `${offset * 56}%`,
                        scale: Math.max(0.62, 1 - depth * 0.13),
                        opacity: depth === 0 ? 1 : depth === 1 ? 0.34 : depth === 2 ? 0.12 : 0,
                        filter: `blur(${Math.min(depth * 2.5, 6)}px)`,
                      }}
                      // A spring for the movement so the deck rotates with some weight to it, and
                      // a slower tween for the fade and the blur so cards dissolve into the dark
                      // rather than blinking out of it.
                      transition={{
                        x: { type: 'spring', stiffness: 46, damping: 17, mass: 1.1 },
                        scale: { type: 'spring', stiffness: 46, damping: 17, mass: 1.1 },
                        opacity: { duration: 0.85, ease: [0.33, 1, 0.68, 1] },
                        filter: { duration: 0.85, ease: [0.33, 1, 0.68, 1] },
                      }}
                      aria-hidden={offset !== 0}
                      onClick={() => {
                        if (offset !== 0) selectLab(deckLab.id);
                      }}
                    >
                      {renderCard(deckLab, offset)}
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

        </>
      )}
    </section>
  );
}
