const LEGEND: { shape: string; label: string }[] = [
  { shape: 'diamond', label: 'Education' },
  { shape: 'square', label: 'Career & Projects' },
  { shape: 'square-hollow', label: 'Future' },
];

export default function GraphControls() {
  return (
    <ul className="career-controls__legend">
      {LEGEND.map((entry) => (
        <li key={entry.shape} className="career-controls__legend-item">
          <span className={`career-controls__legend-shape career-controls__legend-shape--${entry.shape}`} />
          {entry.label}
        </li>
      ))}
    </ul>
  );
}
