import { useMemo, useRef, useState } from 'react';
import type { SwymbleCareerBranch, SwymbleCareerNode } from '../../../data/types';
import AnimatedParticle from './AnimatedParticle';
import BranchPath from './BranchPath';
import CommitCard from './CommitCard';
import CommitNode from './CommitNode';
import type { CareerFilter } from './Filters';
import GraphControls from './GraphControls';
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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ dragging: boolean; pointerId: number | null; startX: number; startScrollLeft: number }>({
    dragging: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
  });

  const activeNodeId = hoveredNodeId ?? selectedNodeId;
  const activeLayoutNode = activeNodeId ? layout.nodesById.get(activeNodeId) : undefined;
  const activeBranchId = activeLayoutNode?.branchId ?? null;

  const handleSelect = (id: string) => {
    setSelectedNodeId((current) => (current === id ? null : id));
  };

  // Pointer capture is deferred until real movement is seen — capturing immediately on
  // pointerdown would hijack every subsequent click (including on child nodes/buttons) to this
  // container regardless of where the pointer actually is, breaking hover-card pinning and
  // filter/reset clicks.
  const DRAG_THRESHOLD_PX = 4;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    dragState.current = {
      dragging: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: scrollRef.current.scrollLeft,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current || dragState.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragState.current.startX;

    if (!dragState.current.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      dragState.current.dragging = true;
      scrollRef.current.setPointerCapture(event.pointerId);
    }

    scrollRef.current.scrollLeft = dragState.current.startScrollLeft - dx;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current.dragging) {
      scrollRef.current?.releasePointerCapture(event.pointerId);
    }
    dragState.current.dragging = false;
    dragState.current.pointerId = null;
  };

  const handleReset = () => {
    scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  return (
    <div className="career-repository__graph">
      <div
        ref={scrollRef}
        className="career-repository__scroll"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => setSelectedNodeId(null)}
      >
        <div className="career-repository__inner" style={{ width: layout.width, height: layout.height }}>
          <svg
            className="career-repository__canvas"
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
          >
            {layout.branches.map((layoutBranch, branchIndex) => {
              const filterDimmed = layoutBranch.branch.id !== 'main' && layoutBranch.branch.category !== filter && filter !== 'all';
              const hoverDimmed = activeBranchId !== null && layoutBranch.branch.id !== activeBranchId && layoutBranch.branch.id !== 'main';
              return (
                <BranchPath
                  key={layoutBranch.branch.id}
                  branch={layoutBranch.branch}
                  d={layoutBranch.path}
                  pathId={`career-branch-path-${layoutBranch.branch.id.replace('/', '-')}`}
                  isDimmed={filterDimmed || hoverDimmed}
                  delay={branchIndex * 0.18}
                />
              );
            })}

            {layout.branches.flatMap((layoutBranch, branchIndex) =>
              layoutBranch.nodes.map((layoutNode, nodeIndex) => (
                <CommitNode
                  key={layoutNode.node.id}
                  node={layoutNode.node}
                  x={layoutNode.x}
                  y={layoutNode.y}
                  isActive={activeNodeId === layoutNode.node.id}
                  isDimmed={!nodeMatchesFilter(layoutNode.node, layoutBranch.branch, filter)}
                  delay={branchIndex * 0.18 + nodeIndex * 0.06}
                  onHover={setHoveredNodeId}
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
                />
              ))}
          </svg>

          {activeLayoutNode && (
            <CommitCard
              node={activeLayoutNode.node}
              x={activeLayoutNode.x}
              y={activeLayoutNode.y}
              flip={activeLayoutNode.y <= layout.branches[0]?.y}
            />
          )}
        </div>
      </div>

      <GraphControls onReset={handleReset} />
    </div>
  );
}
