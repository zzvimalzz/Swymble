import { useMemo, useRef, useState } from 'react';
import type { SwymbleCareerRepository } from '../../../data/types';
import Reveal from '../../motion/Reveal';
import CommitLog from './CommitLog';
import Filters, { type CareerFilter } from './Filters';
import GraphControls from './GraphControls';
import { computeCareerLayout } from './layout';
import RepositoryGraph from './RepositoryGraph';

type CareerRepositoryProps = {
  branches: SwymbleCareerRepository;
};

export default function CareerRepository({ branches }: CareerRepositoryProps) {
  const [filter, setFilter] = useState<CareerFilter>('all');
  const layout = useMemo(() => computeCareerLayout(branches), [branches]);
  const branchesById = useMemo(() => new Map(branches.map((branch) => [branch.id, branch])), [branches]);

  // Hover and selection live here rather than in the graph because the log panel is the other
  // half of the same control: pointing at a row must light up its node and vice versa.
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

  // A touch tap on a node fires pointerup on the node, then a synthesised click that the browser
  // dispatches to the graph wrapper instead of the node. That wrapper clears the selection, so
  // without this window every tap opened a card and instantly closed it again.
  const suppressClearUntil = useRef(0);

  const handleSelect = (id: string) => {
    // Long enough to outlast the browser's delayed synthetic click after a tap, including the
    // scroll-into-view it may perform first.
    suppressClearUntil.current = Date.now() + 700;
    setSelectedNodeId((current) => (current === id ? null : id));
  };

  const handleClearSelection = () => {
    if (Date.now() < suppressClearUntil.current) return;
    setSelectedNodeId(null);
  };

  // Explicit dismissal (close button, backdrop, Escape) always wins; unlike a stray background
  // click it is never something to second-guess.
  const handleDismiss = () => {
    clearHideTimeout();
    suppressClearUntil.current = 0;
    setHoveredNodeId(null);
    setSelectedNodeId(null);
  };

  const activeNodeId = hoveredNodeId ?? selectedNodeId;

  return (
    <Reveal as="section" className="career-repository" id="repository" y={24} margin="-80px">
      <div className="career-repository__header">
        <p className="career-repository__kicker">04 &middot; git log</p>
        <h2 className="career-repository__heading">The Repository</h2>
        <p className="career-repository__lede">
          Every job, degree, award and shipped project as a commit, newest first. Branches fork
          where life did and merge back when it wrapped. Hover anything on either side. The graph
          and the log are the same thing twice.
        </p>
        <div className="career-repository__header-row">
          <Filters active={filter} onChange={setFilter} />
          <GraphControls />
        </div>
      </div>

      <div className="career-repository__body">
        <RepositoryGraph
          layout={layout}
          filter={filter}
          activeNodeId={activeNodeId}
          selectedNodeId={selectedNodeId}
          isHoverActive={hoveredNodeId !== null}
          onHover={handleHover}
          onSelect={handleSelect}
          onClearSelection={handleClearSelection}
          onDismiss={handleDismiss}
          onCardEnter={clearHideTimeout}
        />
        <CommitLog
          layout={layout}
          branchesById={branchesById}
          filter={filter}
          activeNodeId={activeNodeId}
          onHover={handleHover}
          onSelect={handleSelect}
        />
      </div>
    </Reveal>
  );
}
