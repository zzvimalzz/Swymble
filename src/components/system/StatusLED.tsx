/**
 * StatusLED — state at a glance, never colour-only (the label is always
 * rendered). Doctrine: neon red pulse = genuinely live; cyan steady = in
 * development (the system is working on it); muted hollow = restricted.
 */

type StatusLEDProps = {
  status: 'Live' | 'In Development' | 'Private Beta' | 'Pending';
  className?: string;
};

const STATUS_CLASS: Record<StatusLEDProps['status'], string> = {
  Live: 'is-live',
  'In Development': 'is-dev',
  'Private Beta': 'is-private',
  Pending: 'is-private',
};

export default function StatusLED({ status, className }: StatusLEDProps) {
  return (
    <span className={`status-led ${STATUS_CLASS[status]} ${className ?? ''}`.trim()}>
      <span className="status-led-dot" aria-hidden="true" />
      <span className="status-led-label">{status.toUpperCase()}</span>
    </span>
  );
}
