import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type HeroTelemetryProps = {
  location: string;
  availability: string;
};

const KL_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kuala_Lumpur',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * A readout strip along the bottom of the hero. The hero was a wordmark, a tagline, and then
 * nothing until you scrolled; this gives it something live and grounds the "mission control"
 * register the rest of the page is written in without adding another block of prose.
 */
export default function HeroTelemetry({ location, availability }: HeroTelemetryProps) {
  const [clock, setClock] = useState(() => KL_TIME.format(new Date()));

  useEffect(() => {
    // Ticking on the minute rather than the second: a seconds display would repaint 60x more
    // often for a readout nobody is watching that closely.
    const id = window.setInterval(() => setClock(KL_TIME.format(new Date())), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const readouts = [
    { id: 'loc', label: 'Base', value: location },
    { id: 'time', label: 'Local', value: `${clock} MYT` },
    { id: 'status', label: 'Status', value: availability, live: true },
  ];

  return (
    <motion.dl
      className="hero-telemetry"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {readouts.map((readout) => (
        <div key={readout.id} className="hero-telemetry__item">
          <dt className="hero-telemetry__label">{readout.label}</dt>
          <dd className={`hero-telemetry__value${readout.live ? ' hero-telemetry__value--live' : ''}`}>
            {readout.value}
          </dd>
        </div>
      ))}
    </motion.dl>
  );
}
