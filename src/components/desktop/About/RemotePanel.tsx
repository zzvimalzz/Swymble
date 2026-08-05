import { Link } from 'react-router-dom';
import Reveal from '../../motion/Reveal';
import type { SwymbleSocial } from '../../../data/types';

type RemotePanelProps = {
  socials: SwymbleSocial[];
  availabilityLabel: string;
};

/**
 * Icon tiles only. The raw handles and phone number used to sit in the open, which put a personal
 * number on a public page for anyone (and any scraper) to read. The link still goes exactly where
 * it did; you just have to click it.
 */
export default function RemotePanel({ socials, availabilityLabel }: RemotePanelProps) {
  return (
    <Reveal as="section" className="remote" id="remote" y={24} margin="-80px">
      <div className="remote__head">
        <p className="about-section__kicker">07 &middot; git remote -v</p>
        <h2 className="about-section__heading">Where to find me</h2>
      </div>

      <div className="remote__grid">
        <ul className="remote__list">
          {socials.map((social) => {
            const Icon = social.icon;
            const isExternal = social.link.startsWith('http');
            const label = social.name.toLowerCase();

            return (
              <li key={social.id}>
                <a
                  className="remote__tile"
                  href={social.link}
                  data-cursor="social"
                  aria-label={label}
                  {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <Icon className="remote__icon" size={26} aria-hidden="true" />
                  <span className="remote__tooltip" aria-hidden="true">
                    {label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="remote__cta">
          <p className="remote__status">{availabilityLabel}</p>
          <p className="remote__pitch">
            Company profiles, product builds, AI-powered systems. Enterprise discipline, whatever the
            size. Tell me what you are building.
          </p>
          <Link to="/contact" className="remote__button">
            Let's talk
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
