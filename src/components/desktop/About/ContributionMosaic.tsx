import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SwymbleCareerRepository } from '../../../data/types';
import { branchColor } from '../CareerRepository/constants';
import { branchColorIndexes, dateKeyToYearMonth, parseDateKey } from '../CareerRepository/layout';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Cell = {
  year: number;
  month: number;
  count: number;
  color: string | null;
  titles: string[];
};

/**
 * A contribution graph for a career rather than a year of pushes: rows are years, columns are
 * months, and a cell lights up in the colour of the branch that was moving that month.
 *
 * Deliberately not GitHub's 53x7 daily grid — that shape only holds twelve months, and career
 * events are sparse enough that faking daily activity would be inventing data. Year-by-month is
 * the same instantly-readable mosaic over a range that actually suits the source.
 */
export default function ContributionMosaic({ career }: { career: SwymbleCareerRepository }) {
  const [hovered, setHovered] = useState<Cell | null>(null);

  const { years, cellsByKey, total } = useMemo(() => {
    const colorIndexes = branchColorIndexes(career);
    const map = new Map<string, Cell>();
    let count = 0;

    for (const branch of career) {
      for (const node of branch.nodes) {
        // A bare 'YYYY' date has no month; parseDateKey reads it as January, so it still shows up
        // somewhere honest rather than being dropped from the mosaic entirely.
        const { year, month } = dateKeyToYearMonth(parseDateKey(node.date));
        const cellKey = `${year}-${month}`;
        const existing = map.get(cellKey);
        const color = branchColor(colorIndexes.get(branch.id) ?? 0);

        map.set(cellKey, {
          year,
          month,
          count: (existing?.count ?? 0) + 1,
          color,
          titles: [...(existing?.titles ?? []), node.title],
        });
        count += 1;
      }
    }

    // Every year in the range gets a row, including ones with nothing in them. Listing only the
    // years that have commits would put 2021 directly above 2023 and quietly destroy the time
    // axis — an empty year is information.
    const occupied = [...map.values()].map((cell) => cell.year);
    const first = Math.min(...occupied);
    const last = Math.max(...occupied);
    const allYears = Array.from({ length: last - first + 1 }, (_, index) => first + index);

    return { years: allYears, cellsByKey: map, total: count };
  }, [career]);

  return (
    <div className="mosaic">
      <div className="mosaic__head">
        <span className="mosaic__title">{total} commits</span>
        <span className="mosaic__sub">
          {years[0]} to {years[years.length - 1]}
        </span>
      </div>

      <div className="mosaic__grid" role="presentation">
        <span className="mosaic__corner" />
        {MONTH_LABELS.map((label, index) => (
          <span key={`m-${index}`} className="mosaic__month">
            {label}
          </span>
        ))}

        {years.map((year) => (
          <FragmentRow
            key={year}
            year={year}
            cellsByKey={cellsByKey}
            onEnter={setHovered}
            onLeave={() => setHovered(null)}
          />
        ))}
      </div>

      <div className="mosaic__readout">
        {hovered ? (
          <>
            <span className="mosaic__readout-date">
              {MONTH_NAMES[hovered.month - 1]} {hovered.year}
            </span>
            <span className="mosaic__readout-body">{hovered.titles.join(' · ')}</span>
          </>
        ) : (
          <span className="mosaic__readout-hint">Hover a cell to see what happened</span>
        )}
      </div>
    </div>
  );
}

function FragmentRow({
  year,
  cellsByKey,
  onEnter,
  onLeave,
}: {
  year: number;
  cellsByKey: Map<string, Cell>;
  onEnter: (cell: Cell) => void;
  onLeave: () => void;
}) {
  return (
    <>
      <span className="mosaic__year">{year}</span>
      {MONTH_LABELS.map((_, index) => {
        const cell = cellsByKey.get(`${year}-${index + 1}`);
        const style = cell
          ? ({
              '--cell-color': cell.color ?? undefined,
              '--cell-alpha': Math.min(1, 0.4 + cell.count * 0.3),
            } as CSSProperties)
          : undefined;

        return (
          <span
            key={`${year}-${index}`}
            className={`mosaic__cell${cell ? ' mosaic__cell--on' : ''}`}
            style={style}
            onMouseEnter={cell ? () => onEnter(cell) : undefined}
            onMouseLeave={cell ? onLeave : undefined}
            title={cell ? `${MONTH_NAMES[index]} ${year}: ${cell.titles.join(', ')}` : undefined}
          />
        );
      })}
    </>
  );
}
