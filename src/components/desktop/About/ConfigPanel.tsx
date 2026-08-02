import Reveal from '../../motion/Reveal';
import type { SwymbleAboutConfigLine, SwymbleAboutCurrent } from '../../../data/types';

type ConfigPanelProps = {
  config: SwymbleAboutConfigLine[];
  currently: SwymbleAboutCurrent[];
};

export default function ConfigPanel({ config, currently }: ConfigPanelProps) {
  return (
    <Reveal as="section" className="config" id="config" y={24} margin="-80px">
      <div className="config__head">
        <p className="about-section__kicker">04 &middot; git config --list</p>
        <h2 className="about-section__heading">The settings</h2>
      </div>

      <div className="config__grid">
        <div className="config__list">
          {config.map((line) => (
            <div key={line.key} className="config__row">
              <span className="config__key">{line.key}</span>
              <span className="config__equals" aria-hidden="true">
                =
              </span>
              {line.href ? (
                <a
                  className="config__value config__value--link"
                  href={line.href}
                  {...(line.href.startsWith('mailto:')
                    ? {}
                    : { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {line.value}
                </a>
              ) : (
                <span className="config__value">{line.value}</span>
              )}
            </div>
          ))}
        </div>

        <div className="config__now">
          <h3 className="config__now-title">Currently</h3>
          {currently.map((entry) => (
            <div key={entry.id} className="config__now-row">
              <span className="config__now-label">{entry.label}</span>
              <span className="config__now-value">{entry.value}</span>
              {entry.detail && <span className="config__now-detail">{entry.detail}</span>}
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
