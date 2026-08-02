import type { SwymbleCareerBranch, SwymbleCareerNode } from '../../../data/types';

export type CareerFilter = 'all' | 'career' | 'project' | 'education';

/** Shared by the graph and the commit log so a filter dims the same set of things in both. */
export const nodeMatchesFilter = (
  node: SwymbleCareerNode,
  branch: SwymbleCareerBranch,
  filter: CareerFilter,
): boolean => {
  if (filter === 'all') return true;
  if (filter === 'education') return node.type === 'education';
  if (filter === 'project') return branch.category === 'project';
  return branch.category === 'career' && node.type !== 'education';
};

const FILTERS: { id: CareerFilter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'career', label: 'Career' },
  { id: 'project', label: 'Projects' },
  { id: 'education', label: 'Education' },
];

type FiltersProps = {
  active: CareerFilter;
  onChange: (filter: CareerFilter) => void;
};

export default function Filters({ active, onChange }: FiltersProps) {
  return (
    <div className="career-filters" role="tablist" aria-label="Filter the career graph">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          role="tab"
          aria-selected={active === filter.id}
          className={`career-filters__pill${active === filter.id ? ' career-filters__pill--active' : ''}`}
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
