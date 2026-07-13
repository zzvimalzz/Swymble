import { useEffect, useState } from 'react';
import { SWYMBLE_BASE_LOCATION, formatMalaysiaTime } from '../../utils/buildInfo';

/**
 * StatusLine — quiet, true grounding: where Swymble is and what time it is
 * there. No build hashes or telemetry in visitor-facing chrome — that read
 * as internal tooling. Availability appears only in the contact context
 * (compact variant), where it actually informs a decision.
 */

type StatusLineProps = {
  /** hero: place + live MYT time · compact: place + availability (contact) */
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
      <span className="status-line-sep" aria-hidden="true">·</span>
      {variant === 'hero' ? (
        <span className="status-line-item">{time} MYT</span>
      ) : (
        <span className="status-line-item status-line-available">
          <span className="status-line-led" aria-hidden="true" />
          AVAILABLE
        </span>
      )}
    </p>
  );
}
