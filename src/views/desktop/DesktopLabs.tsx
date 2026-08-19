import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import BubbleField from '../../components/desktop/Labs/BubbleField';
import SmartImage from '../../components/SmartImage';
import { useGravityMode } from '../../components/desktop/Labs/useGravityMode';
import { specimenFor } from '../../components/desktop/Labs/fusionLore';
import { LABS_COMPACT_QUERY } from '../../components/desktop/Labs/breakpoints';
import { LabActions, STATUS_MODIFIER } from '../../components/desktop/Labs/labPresentation';
import useMediaQuery from '../../hooks/useMediaQuery';
import { SWYMBLE_DATA } from '../../data/config';
import type { SwymbleLab } from '../../data/types';
import { getCategoryAccentStyle } from '../../utils/categoryAccent';
import { serializeJsonLd } from '../../utils/jsonLd';
import { labsIndexJsonLd } from '../../utils/labSeo';
import '../../styles/desktop-labs.css';

/** How far a swipe on the compact card has to travel before it counts as one, in px. Short
 *  enough for a thumb, long enough that scrolling the page past a card does not trip it. */
const SWIPE_DISTANCE = 60;

/** Whether to ease the page across to a new specimen or simply be there. */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export default function DesktopLabs() {
  const location = useLocation();
  // Memoised, and it matters: this array is BubbleField's `labs` prop, and a fresh one every
  // render made every callback inside the field new, which re-ran its layout effect, tore down and
  // rebuilt both observers, and re-seeded the field — on every single render.
  const visibleLabs = useMemo(() => SWYMBLE_DATA.labs?.filter((lab) => lab.visibility !== 'private') ?? [], []);

  const isCompact = useMediaQuery(LABS_COMPACT_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  // Deliberately component state and not a URL parameter: an open card is a thing you did a
  // moment ago, not a place. Reloading /labs should hand the bubbles back their freedom rather
  // than restoring a row nobody asked for.
  const [openId, setOpenId] = useState<string | null>(null);
  const openIndex = visibleLabs.findIndex((lab) => lab.id === openId);
  const openLab = openIndex >= 0 ? visibleLabs[openIndex] : null;

  const selectLab = useCallback((id: string | null) => setOpenId(id), []);

  // The fused bubble, while one exists, and the field's own way of breaking it. Held here rather
  // than in BubbleField because the card is page furniture — the field draws circles, the page
  // describes them — and because closing the card is what pulls the two labs apart.
  const [fused, setFused] = useState<{ id: string; dismiss?: () => void } | null>(null);
  const onFusion = useCallback(
    (id: string | null, dismiss?: () => void) => setFused(id ? { id, dismiss } : null),
    [],
  );
  const closeSpecimen = useCallback(() => {
    fused?.dismiss?.();
    setFused(null);
  }, [fused]);
  const specimen = fused ? specimenFor(fused.id, visibleLabs) : null;

  /**
   * Brings a new specimen's card fully into view, and only as far as it has to.
   *
   * The card appears wherever the reader happens to be on the page, and a tall one made near the
   * bottom of the viewport is cut in half. This scrolls by exactly the shortfall — if the whole
   * card is already visible it does nothing at all, which is the point: nobody wants the page
   * jumping every time they make one.
   *
   * Measured from layout (`offsetTop`/`offsetHeight`) rather than `getBoundingClientRect`, because
   * the card is mid-animation when this runs — it enters from 24px down at 0.96 scale, and the
   * drawn box would send it about 30px too far.
   */
  useEffect(() => {
    if (!fused) return undefined;

    const frame = requestAnimationFrame(() => {
      const card = document.querySelector<HTMLElement>('.lab-specimen');
      if (!card) return;

      let top = 0;
      for (let node: HTMLElement | null = card; node; node = node.offsetParent as HTMLElement | null) {
        top += node.offsetTop;
      }

      // The nav is fixed and sits over the top of the page, so "visible" starts below it. The
      // gap at the bottom leaves room for the drips, which hang past the card.
      const nav = document.querySelector('.desktop-nav')?.getBoundingClientRect().height ?? 0;
      const limitTop = nav + 20;
      const limitBottom = window.innerHeight - 60;

      const viewTop = top - window.scrollY;
      const viewBottom = viewTop + card.offsetHeight;

      let delta = 0;
      if (viewBottom > limitBottom) delta = viewBottom - limitBottom;
      // Never so far that the top of the card goes under the nav — a card taller than the
      // viewport is aligned to its top instead, because that is the half worth reading first.
      if (viewTop - delta < limitTop) delta = viewTop - limitTop;
      if (Math.abs(delta) < 8) return;

      window.scrollBy({ top: delta, behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    return () => cancelAnimationFrame(frame);
  }, [fused, reducedMotion]);

  // Only this page has gravity, and only while it is mounted: navigating away puts the page back
  // together, which is the reset a reader gets by leaving and returning.
  const { active: gravityActive, captureDeck } = useGravityMode(!isCompact);

  // The deck does not exist when gravity is switched on — it appears only once a bubble has been
  // pressed — so it is handed to the simulation here instead. One frame's delay: the cards have to
  // be laid out before they can be measured.
  // Also re-run when a specimen appears or goes: closing its card mid-fall unmounts the fused
  // bubble and gives back two that had no box when the world was collected, and captureDeck is
  // what prunes the first and adopts the others.
  useEffect(() => {
    if (!gravityActive) return undefined;
    const frame = requestAnimationFrame(() => captureDeck(Boolean(openId)));
    return () => cancelAnimationFrame(frame);
  }, [captureDeck, fused?.id, gravityActive, openId]);

  // The corner buttons fall with everything else, and they unmount as soon as the reader scrolls
  // back above the rocket's threshold — taking the button that turns gravity *off* with them. The
  // shell keeps them mounted while this is true.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('swymble:gravity-state', { detail: { active: gravityActive } }));
  }, [gravityActive]);
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
      ) : (
        <>
          {/* The strip the row collapses into. Zero height while the field is loose, so the
              bubbles have the whole page; measured by BubbleField, never positioned by it.

              The track inside it is an empty spacer. Where the row is wider than the screen — a
              phone, mostly — the strip is a horizontal scroller and this is the only thing giving
              it anything to scroll. Its width is written by BubbleField.retarget(), because the
              row's width is the row's business. */}
          <div className={`lab-bubble-band${openLab ? ' is-open' : ''}`} data-bubble-band>
            <div className="lab-bubble-band__track" data-bubble-band-track aria-hidden="true" />
          </div>

          <BubbleField
            labs={visibleLabs}
            selectedId={openLab ? openLab.id : null}
            onSelect={selectLab}
            // While the page is falling, the bubbles are bodies in the rigid-body world instead —
            // two solvers writing the same transforms would fight over every frame.
            paused={gravityActive}
            onFusion={onFusion}
          />

          {/* What comes out when two bubbles are forced together. Everything on it is derived
              from the two labs inside it — see components/desktop/Labs/fusionLore.ts. It is not a
              product and does not link anywhere; in a few seconds it comes apart on its own. */}
          <AnimatePresence>
            {specimen && (
              <motion.article
                key={specimen.id}
                className="lab-specimen"
                // Solid to the field. Without it the bubbles drift behind the card and the page
                // reads as two layers that do not know about each other; with it they bounce off
                // the thing they just made. BubbleField re-measures the box a few times a second,
                // so it follows the card in as it animates.
                data-bubble-obstacle
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 1.08, filter: 'blur(6px)' }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* The only way out. The specimen holds for as long as the card is open — there is
                    no timer, because a joke you are still reading should not be taken away. */}
                <button
                  type="button"
                  className="lab-specimen__close"
                  onClick={closeSpecimen}
                  aria-label="Close the specimen and separate the two labs"
                >
                  ×
                </button>

                {/* Its own row across the top, rather than sharing one with the name: a long
                    category and a long tag both have somewhere to go, and neither ends up under
                    the close button. Not the shared `.lab-meta`, whose spacing belongs to the
                    lab cards. */}
                <div className="lab-specimen__meta">
                  <span className="lab-category" data-gravity-item>
                    {specimen.category}
                  </span>
                  {/* Whatever the specimen calls itself — 'LEAKING', 'DO NOT INHALE'. Set per
                      pair in data/labs/merged_easteregg/, UNSTABLE when left out. */}
                  <span className="lab-status-badge lab-status-badge--unstable" data-gravity-item>
                    {specimen.status}
                  </span>
                </div>

                <div className="lab-specimen__head">
                  {/* The same mark the bubble is carrying, at size. It is the specimen's face and
                      the fastest way to see which two labs went in. */}
                  {specimen.image && (
                    <span className="lab-specimen__mark" data-gravity-item>
                      <SmartImage src={specimen.image} alt="" fit="contain" padding={0} />
                    </span>
                  )}

                  {/* The span falls, not the h2: a heading is a block box the full width of the
                      card, and as a body it drops as an invisible bar with the name stuck to one
                      end — the same reason the lab cards hand gravity their title link. */}
                  <h2 className="lab-specimen__name">
                    <span data-gravity-item>{specimen.name}</span>
                  </h2>
                </div>

                <p className="lab-desc" data-gravity-item data-gravity-words>
                  {specimen.tagline}
                </p>

                <ul className="lab-highlights">
                  {specimen.highlights.map((highlight) => (
                    <li key={highlight} className="lab-highlight-item" data-gravity-item data-gravity-words>
                      {highlight}
                    </li>
                  ))}
                </ul>

                {/* The waste. Drawn rather than bordered: a bank of ooze welling along the bottom
                    edge with drips that stretch, thin and let go, so the card reads as a container
                    that is not holding. Marked aria-hidden — it is a texture, not information. */}
                <svg className="lab-specimen__ooze" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <defs>
                    {/* Blur then re-threshold the alpha: touching shapes fuse instead of stacking,
                        which is what turns a row of ellipses into a single running sheet. */}
                    <filter id="specimen-goo">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                      <feColorMatrix
                        in="blur"
                        type="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
                      />
                    </filter>
                  </defs>

                  <g filter="url(#specimen-goo)">
                    <rect x="-20" y="0" width="440" height="26" />
                    {/* Each drip hangs from the sheet, swells, and falls on its own clock. */}
                    <g className="lab-specimen__drip" style={{ animationDelay: '0s' }}>
                      <ellipse cx="52" cy="30" rx="13" ry="20" />
                    </g>
                    <g className="lab-specimen__drip" style={{ animationDelay: '-2.6s' }}>
                      <ellipse cx="138" cy="28" rx="10" ry="15" />
                    </g>
                    <g className="lab-specimen__drip" style={{ animationDelay: '-1.1s' }}>
                      <ellipse cx="214" cy="32" rx="15" ry="23" />
                    </g>
                    <g className="lab-specimen__drip" style={{ animationDelay: '-3.4s' }}>
                      <ellipse cx="296" cy="28" rx="9" ry="14" />
                    </g>
                    <g className="lab-specimen__drip" style={{ animationDelay: '-1.9s' }}>
                      <ellipse cx="358" cy="31" rx="12" ry="18" />
                    </g>
                  </g>
                </svg>
              </motion.article>
            )}
          </AnimatePresence>

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
                  // Three renderings of the same card.
                  //
                  // With gravity on there is no deck at all — just the one card that was pressed,
                  // falling into the pile; pressing another bubble swaps it for that lab's card. A
                  // stack of blurred cards behind it was scenery the physics had to carry and the
                  // reader could not use.
                  //
                  // On a phone there is no deck either, for the opposite reason: the neighbours sit
                  // at ±56% of a card that is already 84% of the screen, which puts every one of
                  // them entirely off it. Nothing is rotating where nobody can see it, so only the
                  // front card is mounted and swiping it is what moves between labs.
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

                  if (isCompact) {
                    if (offset !== 0) return null;

                    return (
                      <motion.article
                        key={deckLab.id}
                        className="lab-deck__card is-front"
                        style={{ zIndex: 3 }}
                        // Keyed on the lab, so choosing another one remounts this and the new card
                        // plays its entrance. There is no exit — the card being replaced is gone
                        // the moment its key changes, and a crossfade between two cards in the same
                        // absolute box read as a smear rather than a change.
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        // The row is up in the strip and its bubbles are 52px across; swiping the
                        // card is the second way through the labs, and the one a thumb reaches.
                        // Elastic rather than free: the card is absolutely positioned and dragging
                        // it off its own box is not a thing it can come back from.
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.18}
                        dragMomentum={false}
                        onDragEnd={(_event, info) => {
                          if (Math.abs(info.offset.x) < SWIPE_DISTANCE) return;
                          const next = openIndex + (info.offset.x < 0 ? 1 : -1);
                          // Stops at both ends rather than wrapping: the row above it does not
                          // wrap either, and a card that jumps from the last lab to the first
                          // reads as having lost the reader's place.
                          if (next < 0 || next >= visibleLabs.length) return;
                          selectLab(visibleLabs[next].id);
                        }}
                      >
                        {renderCard(deckLab, offset)}
                      </motion.article>
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
