const LEGEND: { shape: string; label: string }[] = [
  { shape: 'diamond', label: 'Education' },
  { shape: 'square', label: 'Employment' },
  { shape: 'circle', label: 'Milestone' },
  { shape: 'small-circle', label: 'Project' },
  { shape: 'hollow-circle', label: 'Future' },
];

type GraphControlsProps = {
  onReset: () => void;
};

export default function GraphControls({ onReset }: GraphControlsProps) {
  return (
    <div className="career-controls">
      <ul className="career-controls__legend">
        {LEGEND.map((entry) => (
          <li key={entry.shape} className="career-controls__legend-item">
            <span className={`career-controls__legend-shape career-controls__legend-shape--${entry.shape}`} />
            {entry.label}
          </li>
        ))}
      </ul>
      <button type="button" className="career-controls__reset" onClick={onReset}>
        Reset view ↺
      </button>
    </div>
  );
}
