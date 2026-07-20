export type CareerFilter = 'all' | 'career' | 'project' | 'education';

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
