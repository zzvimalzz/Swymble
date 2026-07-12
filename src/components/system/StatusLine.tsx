import { useEffect, useState } from 'react';
import { BUILD_COMMIT, SWYMBLE_BASE_LOCATION, formatMalaysiaTime } from '../../utils/buildInfo';

/**
 * StatusLine — honest system chrome. Every value rendered here is true:
 * real base location, a live MYT clock, the actual build hash (or 'dev'),
 * and the availability state that also drives the footer.
 */

type StatusLineProps = {
  /** hero: full readout · compact: place + availability only */
  variant?: 'hero' | 'compact';
  className?: string;
};

export default function StatusLine({ variant = 'hero', className }: StatusLineProps) {
  const [time, setTime] = useState(() => formatMalaysiaTime());

  useEffect(() => {
    const tick = window.setInterval(() => setTime(formatMalaysiaTime()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  return (
    <p className={`status-line ${className ?? ''}`.trim()}>
      <span className="status-line-item">{SWYMBLE_BASE_LOCATION}</span>
      {variant === 'hero' && (
        <>
          <span className="status-line-sep" aria-hidden="true">·</span>
          <span className="status-line-item">{time} MYT</span>
          <span className="status-line-sep" aria-hidden="true">·</span>
          <span className="status-line-item">BUILD {BUILD_COMMIT.toUpperCase()}</span>
        </>
      )}
      <span className="status-line-sep" aria-hidden="true">·</span>
      <span className="status-line-item status-line-available">
        <span className="status-line-led" aria-hidden="true" />
        AVAILABLE
      </span>
    </p>
  );
}
