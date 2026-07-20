import { useScroll } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import type { SwymbleCareerBranch, SwymbleCareerNode } from '../../../data/types';
import AnimatedParticle from './AnimatedParticle';
import BranchPath from './BranchPath';
import CommitCard from './CommitCard';
import CommitNode from './CommitNode';
import { branchColor, ROW_SPACING_Y } from './constants';
import type { CareerFilter } from './Filters';
import { computeCareerLayout } from './layout';

type RepositoryGraphProps = {
  branches: SwymbleCareerBranch[];
  filter: CareerFilter;
};

const nodeMatchesFilter = (node: SwymbleCareerNode, branch: SwymbleCareerBranch, filter: CareerFilter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'education') return node.type === 'education';
  if (filter === 'project') return branch.category === 'project';
  return branch.category === 'career' && node.type !== 'education';
};

export default function RepositoryGraph({ branches, filter }: RepositoryGraphProps) {
  const layout = useMemo(() => computeCareerLayout(branches), [branches]);
  const stageRef = useRef<HTMLDivElement>(null);
  // One shared scroll tracker for the whole graph, not one per branch: each BranchPath derives
  // its own draw progress from this via a cheap useTransform (no extra listeners/observers), so
  // the line "follows" the scroll smoothly without the cost (or the hang risk, previously hit
  // with several concurrent per-branch useScroll instances) of tracking scroll N times over.
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start 0.9', 'end 0.35'],
  });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Dismissing on the exact instant the pointer leaves a node makes the card flicker away while
  // the pointer is still crossing the gap toward it (or toward the card itself, e.g. to click a
  // link); a short delay, cancelled by re-entering either the node or the card, fixes that.
  const hideTimeoutRef = useRef<number | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleHover = (id: string | null) => {
    clearHideTimeout();
    if (id) {
      setHoveredNodeId(id);
    } else {
      hideTimeoutRef.current = window.setTimeout(() => setHoveredNodeId(null), 220);
    }
  };

  const activeNodeId = hoveredNodeId ?? selectedNodeId;
  const activeLayoutNode = activeNodeId ? layout.nodesById.get(activeNodeId) : undefined;
  const activeBranchId = activeLayoutNode?.branchId ?? null;
  const topRowY = Math.min(...[...layout.nodesById.values()].map((n) => n.y));
  const colorByBranchId = new Map(layout.branches.map((lb) => [lb.branch.id, branchColor(lb.lane)]));

  const handleSelect = (id: string) => {
    setSelectedNodeId((current) => (current === id ? null : id));
  };

  return (
    <div className="career-repository__graph" onClick={() => setSelectedNodeId(null)}>
      {/* The card shares this positioning context with the SVG (both sized identically) so its
          left/top, set from raw SVG-space node coordinates, land in the right place. A
          flex-centered SVG alone would leave the card's absolute coordinates offset by whatever
          margin centering added, since the card isn't inside the SVG's own coordinate system. */}
      <div ref={stageRef} className="career-repository__stage" style={{ width: layout.width, height: layout.height }}>
        <svg
          className="career-repository__canvas"
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
        >
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
                color={colorByBranchId.get(layoutBranch.branch.id) ?? branchColor(0)}
                scrollYProgress={scrollYProgress}
                startFraction={layoutBranch.startY / layout.height}
                endFraction={layoutBranch.endY / layout.height}
              />
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
                isDimmed={!nodeMatchesFilter(layoutNode.node, layoutBranch.branch, filter)}
                delay={(nodeIndex % 4) * 0.06}
                color={colorByBranchId.get(layoutBranch.branch.id) ?? branchColor(0)}
                onHover={handleHover}
                onSelect={handleSelect}
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
                color={colorByBranchId.get(layoutBranch.branch.id) ?? branchColor(0)}
              />
            ))}
        </svg>

        {activeLayoutNode && (
          <CommitCard
            node={activeLayoutNode.node}
            x={activeLayoutNode.x}
            y={activeLayoutNode.y}
            color={colorByBranchId.get(activeLayoutNode.branchId) ?? branchColor(0)}
            flip={activeLayoutNode.y <= topRowY + ROW_SPACING_Y}
            onMouseEnter={hoveredNodeId ? clearHideTimeout : undefined}
            onMouseLeave={hoveredNodeId ? () => handleHover(null) : undefined}
          />
        )}
      </div>
    </div>
  );
}
