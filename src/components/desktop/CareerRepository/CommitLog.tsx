import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { SwymbleCareerBranch } from '../../../data/types';
import { commitParts, commitSha, commitYear, formatCommitDate, formatDateRange } from './commitMessage';
import { branchColor } from './constants';
import { nodeMatchesFilter, type CareerFilter } from './Filters';
import type { CareerLayout, LayoutNode } from './layout';

type CommitLogProps = {
  layout: CareerLayout;
  branchesById: Map<string, SwymbleCareerBranch>;
  filter: CareerFilter;
  activeNodeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

type YearGroup = {
  year: string;
  nodes: LayoutNode[];
};

/**
 * `git log --oneline --graph` for the graph beside it. This is the half that carries the words:
 * the swimlanes show the shape of the career and this shows what actually happened, so nothing is
 * locked behind hovering an 8px square one at a time. Hover and selection are shared state with
 * the graph, so pointing at either side highlights the other.
 *
 * Row order matches the graph exactly (both newest first), so a row's position in this list
 * corresponds to its node's height in the graph.
 */
export default function CommitLog({
  layout,
  branchesById,
  filter,
  activeNodeId,
  onHover,
  onSelect,
}: CommitLogProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Grouped by year so the list has the same landmarks as the graph's year ruler; scanning for
  // "what was happening in 2024" shouldn't mean reading every date column.
  const groups = useMemo<YearGroup[]>(() => {
    const out: YearGroup[] = [];
    for (const layoutNode of layout.orderedNodes) {
      const year = commitYear(layoutNode.node);
      const current = out[out.length - 1];
      if (current && current.year === year) {
        current.nodes.push(layoutNode);
      } else {
        out.push({ year, nodes: [layoutNode] });
      }
    }
    return out;
  }, [layout]);

  const visibleCount = layout.orderedNodes.filter((layoutNode) => {
    const branch = branchesById.get(layoutNode.branchId);
    return branch ? nodeMatchesFilter(layoutNode.node, branch, filter) : false;
  }).length;

  // When selection comes from the graph, the matching log row is usually out of view.
  //
  // Scrolls the list's own scrollTop rather than calling scrollIntoView: that walks up and scrolls
  // ancestors too, so once the log stacked below the graph it moved the *page* as well, fighting
  // the graph's own scroll-the-node-into-view and landing on neither.
  useEffect(() => {
    const list = listRef.current;
    if (!activeNodeId || !list) return;

    const row = list.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(activeNodeId)}"]`);
    if (!row) return;

    const target = row.offsetTop - list.clientHeight / 2 + row.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [activeNodeId]);

  return (
    // The outer column is the grid item and stretches to the full height of the graph beside it;
    // the inner panel is what sticks. Making the grid item itself `position: sticky` does nothing,
    // because a sticky box can only move within its own containing block.
    <div className="career-log-column">
      <div className="career-log">
        <div className="career-log__chrome">
          <span className="career-log__prompt">~/swymble</span>
          <span className="career-log__command">git log --oneline --graph --all</span>
        </div>

        <div className="career-log__list" ref={listRef}>
          {groups.map((group) => (
            <section key={group.year} className="career-log__group">
              <h4 className="career-log__year">
                <span className="career-log__year-label">{group.year}</span>
                <span className="career-log__year-rule" aria-hidden="true" />
                <span className="career-log__year-count">
                  {group.nodes.length} commit{group.nodes.length === 1 ? '' : 's'}
                </span>
              </h4>

              <ol className="career-log__rows">
                {group.nodes.map((layoutNode) => {
                  const branch = branchesById.get(layoutNode.branchId);
                  if (!branch) return null;

                  const { verb, scope, subject } = commitParts(layoutNode.node, branch);
                  const isActive = activeNodeId === layoutNode.node.id;
                  const isDimmed = !nodeMatchesFilter(layoutNode.node, branch, filter);
                  const style = { '--branch-color': branchColor(layoutNode.colorIndex) } as CSSProperties;

                  return (
                    <li
                      key={layoutNode.node.id}
                      data-node-id={layoutNode.node.id}
                      className={`career-log__row${isActive ? ' career-log__row--active' : ''}${
                        isDimmed ? ' career-log__row--dimmed' : ''
                      }${layoutNode.node.isFuture ? ' career-log__row--future' : ''}`}
                      style={style}
                    >
                      <button
                        type="button"
                        className="career-log__button"
                        onMouseEnter={() => onHover(layoutNode.node.id)}
                        onMouseLeave={() => onHover(null)}
                        onFocus={() => onHover(layoutNode.node.id)}
                        onBlur={() => onHover(null)}
                        // Same split as the graph nodes: touch selects on pointerdown, because
                        // the click the browser synthesises after a tap was never arriving here.
                        onPointerDown={(event) => {
                          if (event.pointerType === 'mouse') return;
                          onSelect(layoutNode.node.id);
                        }}
                        onClick={(event) => {
                          if (
                            event.nativeEvent instanceof PointerEvent &&
                            event.nativeEvent.pointerType !== 'mouse'
                          ) {
                            return;
                          }
                          event.stopPropagation();
                          onSelect(layoutNode.node.id);
                        }}
                      >
                        {/* Mirrors `git log --graph`: a rail in the branch colour with the commit
                            marker on it, so the log carries a hint of the structure too. */}
                        <span className="career-log__rail" aria-hidden="true">
                          <span className="career-log__marker" />
                        </span>

                        <span className="career-log__sha">{commitSha(layoutNode.node.id)}</span>

                        <span className="career-log__body">
                          <span className="career-log__subject">
                            <span className={`career-log__verb career-log__verb--${verb}`}>{verb}</span>
                            <span className="career-log__scope">({scope})</span>
                            <span className="career-log__title">{subject}</span>
                          </span>
                          {layoutNode.node.org && (
                            <span className="career-log__org">{layoutNode.node.org}</span>
                          )}
                        </span>

                        {/* A role's date RANGE, not just its start. Without the end date, two
                            consecutive employment commits read as two unrelated events instead of
                            one job ending and the next beginning. */}
                        <span className="career-log__date">
                          {layoutNode.node.endDate
                            ? formatDateRange(layoutNode.node)
                            : formatCommitDate(layoutNode.node.date)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>

        <div className="career-log__footer">
          <span>
            {visibleCount} of {layout.orderedNodes.length} commits
          </span>
          <span className="career-log__footer-hint">Click to pin</span>
        </div>
      </div>
    </div>
  );
}
