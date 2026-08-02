import { useScroll } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import AnimatedParticle from './AnimatedParticle';
import BranchPath from './BranchPath';
import CommitCard from './CommitCard';
import CommitNode from './CommitNode';
import {
  branchColor,
  CARD_GAP_X,
  CARD_HALF_HEIGHT,
  CARD_WIDTH,
  LABEL_CHAR_WIDTH,
  LABEL_PADDING_X,
  RULER_WIDTH,
} from './constants';
import { nodeMatchesFilter, type CareerFilter } from './Filters';
import type { CareerLayout } from './layout';

type RepositoryGraphProps = {
  layout: CareerLayout;
  filter: CareerFilter;
  activeNodeId: string | null;
  /** The *pinned* node, as opposed to a transient hover. Drives scroll-into-view. */
  selectedNodeId: string | null;
  /** True when the active node came from hovering, so the card should follow the pointer's
   *  dismissal rules rather than staying pinned the way a clicked selection does. */
  isHoverActive: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  /** Explicit dismissal: close button, backdrop or Escape. Bypasses the tap-suppression guard. */
  onDismiss: () => void;
  onCardEnter: () => void;
};

export default function RepositoryGraph({
  layout,
  filter,
  activeNodeId,
  selectedNodeId,
  isHoverActive,
  onHover,
  onSelect,
  onClearSelection,
  onDismiss,
  onCardEnter,
}: RepositoryGraphProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // The canvas has a fixed intrinsic width (lanes + ruler + label gutter). Rather than let it
  // overflow and be scrolled — which on a phone meant half the branches were simply off screen —
  // it is scaled down to whatever width is available. The SVG scales with it; the hover card does
  // not, so its text stays readable at any zoom.
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const fit = () => {
      const available = frame.clientWidth;
      if (!available) return;
      setScale(Math.min(1, available / layout.width));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [layout.width]);

  const isScaled = scale < 0.995;
  // One shared scroll tracker for the whole graph, not one per branch: each BranchPath derives
  // its own draw progress from this via a cheap useTransform (no extra listeners/observers), so
  // the line "follows" the scroll smoothly without the cost (or the hang risk, previously hit
  // with several concurrent per-branch useScroll instances) of tracking scroll N times over.
  // The end offset has to be reachable. `end 0.35` (drawing completes only once the bottom of the
  // graph has travelled up to a third of the way into the viewport) needs more scroll than exists
  // below the graph, so the branches — and every future node hanging off the end of them — stayed
  // permanently half-drawn. Completing when the graph's bottom edge is still near the bottom of
  // the viewport keeps the scrub effect and actually finishes it.
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start 0.9', 'end 0.8'],
  });

  const activeLayoutNode = activeNodeId ? layout.nodesById.get(activeNodeId) : undefined;
  const activeBranchId = activeLayoutNode?.branchId ?? null;
  const graphRight = layout.width;

  // Where the hover card sits. It hangs to one SIDE of its node with a gap, never over it, so it
  // can't sit under the pointer that opened it (which caused an enter/leave loop and a flickering,
  // re-animating card). Side flips when a right-hand card wouldn't fit, and the vertical centre is
  // clamped so a card near either end of the canvas doesn't hang off it.
  //
  // Once the canvas is scaled down there is no room beside a node, so the card opens as a modal
  // instead (see `asModal` on CommitCard) and these coordinates go unused.
  const card = activeLayoutNode
    ? (() => {
        const fitsRight = activeLayoutNode.x + CARD_GAP_X + CARD_WIDTH <= layout.width;
        const minY = Math.min(CARD_HALF_HEIGHT, layout.height / 2);
        const maxY = Math.max(layout.height - CARD_HALF_HEIGHT, layout.height / 2);

        return {
          side: (fitsRight ? 'right' : 'left') as 'left' | 'right',
          x: activeLayoutNode.x + (fitsRight ? CARD_GAP_X : -CARD_GAP_X),
          y: Math.min(Math.max(activeLayoutNode.y, minY), maxY),
        };
      })()
    : null;

  // Picking a commit in the log panel usually means picking one that is nowhere near the current
  // scroll position — without this, the card opens correctly and entirely off screen. Only
  // selection (a click) does this; hover must not yank the page around under the pointer.
  useEffect(() => {
    // Not while the modal is up: the card is centred on the viewport, so moving the page behind
    // it only makes the graph jump to somewhere the reader didn't ask to be.
    if (!selectedNodeId || isScaled) return;

    const layoutNode = layout.nodesById.get(selectedNodeId);
    const stage = stageRef.current;
    if (!layoutNode || !stage) return;

    const nodeTop = stage.getBoundingClientRect().top + window.scrollY + layoutNode.y;
    const target = nodeTop - window.innerHeight / 2;
    if (Math.abs(window.scrollY - target) < 120) return;

    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [selectedNodeId, layout]);

  return (
    <div className="career-repository__graph" ref={frameRef} onClick={onClearSelection}>
      {/* The card shares this positioning context with the SVG (both sized identically) so its
          left/top, set from raw SVG-space node coordinates, land in the right place. A
          flex-centered SVG alone would leave the card's absolute coordinates offset by whatever
          margin centering added, since the card isn't inside the SVG's own coordinate system.
          The stage takes the SCALED size; the SVG's viewBox does the shrinking, so node
          coordinates inside it stay in unscaled layout space. */}
      <div
        ref={stageRef}
        className="career-repository__stage"
        style={{ width: layout.width * scale, height: layout.height * scale }}
      >
        <svg
          className="career-repository__canvas"
          width={layout.width * scale}
          height={layout.height * scale}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Career history as a git branch graph, newest at the top"
        >
          {/* Year axis first, so everything else paints over it. */}
          <g className="career-ruler" aria-hidden="true">
            <line
              className="career-ruler__spine"
              x1={RULER_WIDTH - 18}
              y1={0}
              x2={RULER_WIDTH - 18}
              y2={layout.height}
            />
            {layout.yearTicks.map((tick) => (
              <g key={tick.year} className="career-ruler__tick">
                <line className="career-ruler__gridline" x1={RULER_WIDTH - 18} y1={tick.y} x2={graphRight} y2={tick.y} />
                <text className="career-ruler__label" x={RULER_WIDTH - 28} y={tick.y + 4} textAnchor="end">
                  {tick.year}
                </text>
              </g>
            ))}
          </g>

          {layout.branches.map((layoutBranch) => {
            const filterDimmed =
              layoutBranch.branch.id !== 'main' && layoutBranch.branch.category !== filter && filter !== 'all';
            const hoverDimmed =
              activeBranchId !== null && layoutBranch.branch.id !== activeBranchId && layoutBranch.branch.id !== 'main';
            return (
              <BranchPath
                key={layoutBranch.branch.id}
                branch={layoutBranch.branch}
                d={layoutBranch.path}
                pathId={`career-branch-path-${layoutBranch.branch.id.replace('/', '-')}`}
                isDimmed={filterDimmed || hoverDimmed}
                color={branchColor(layoutBranch.colorIndex)}
                scrollYProgress={scrollYProgress}
                startFraction={layoutBranch.startY / layout.height}
                endFraction={layoutBranch.endY / layout.height}
              />
            );
          })}

          {/* Branch names, parked in the right gutter and joined to their fork point by a leader
              line. They used to sit right beside the fork node, where a long label reached across
              into the next lane and covered whatever line or node was there. Keeping them in the
              gutter means a pill can never obscure the graph, and the leader keeps the link
              readable, which is what makes reused lanes unambiguous. */}
          {layout.branches.map((layoutBranch) => {
            const label = layoutBranch.branch.label;
            const dimmed =
              activeBranchId !== null && layoutBranch.branch.id !== activeBranchId && layoutBranch.branch.id !== 'main';
            return (
              <g
                key={`label-${layoutBranch.branch.id}`}
                className={`career-branch-label${dimmed ? ' career-branch-label--dimmed' : ''}`}
                style={{ '--branch-color': branchColor(layoutBranch.colorIndex) } as React.CSSProperties}
              >
                <path
                  className="career-branch-label__leader"
                  d={`M ${layoutBranch.labelAnchorX + 12} ${layoutBranch.labelAnchorY} H ${
                    layout.labelX - 8
                  } V ${layoutBranch.labelY}`}
                  fill="none"
                />
                <g transform={`translate(${layout.labelX}, ${layoutBranch.labelY})`}>
                  <rect
                    className="career-branch-label__pill"
                    x={0}
                    y={-9}
                    rx={9}
                    ry={9}
                    width={label.length * LABEL_CHAR_WIDTH + LABEL_PADDING_X}
                    height={18}
                  />
                  <text className="career-branch-label__text" x={LABEL_PADDING_X / 2} y={4}>
                    {label}
                  </text>
                </g>
              </g>
            );
          })}

          {layout.branches.flatMap((layoutBranch) =>
            layoutBranch.nodes.map((layoutNode, nodeIndex) => (
              <CommitNode
                key={layoutNode.node.id}
                node={layoutNode.node}
                x={layoutNode.x}
                y={layoutNode.y}
                isActive={activeNodeId === layoutNode.node.id}
                // Two reasons to dim: the filter excludes it, or something else is currently
                // focused. Pulling every other node back is what makes the focused one read as
                // focused rather than merely recoloured.
                isDimmed={
                  !nodeMatchesFilter(layoutNode.node, layoutBranch.branch, filter) ||
                  (activeNodeId !== null && activeNodeId !== layoutNode.node.id)
                }
                delay={(nodeIndex % 4) * 0.06}
                color={branchColor(layoutBranch.colorIndex)}
                onHover={onHover}
                onSelect={onSelect}
              />
            )),
          )}

          {layout.branches
            .filter((layoutBranch) => layoutBranch.branch.status !== 'merged')
            .map((layoutBranch, index) => (
              <AnimatedParticle
                key={layoutBranch.branch.id}
                pathId={`career-branch-path-${layoutBranch.branch.id.replace('/', '-')}`}
                delaySeconds={index * 1.4}
                color={branchColor(layoutBranch.colorIndex)}
              />
            ))}
        </svg>

        {activeLayoutNode && card && (
          <CommitCard
            node={activeLayoutNode.node}
            // Scaled into stage space, so the card still lands beside its node after the canvas
            // has been shrunk to fit.
            x={card.x * scale}
            y={card.y * scale}
            color={branchColor(activeLayoutNode.colorIndex)}
            side={card.side}
            asModal={isScaled}
            onClose={onDismiss}
            onMouseEnter={isHoverActive ? onCardEnter : undefined}
            onMouseLeave={isHoverActive ? () => onHover(null) : undefined}
          />
        )}
      </div>
    </div>
  );
}
