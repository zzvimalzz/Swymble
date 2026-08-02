import { Link } from 'react-router-dom';
import Reveal from '../../motion/Reveal';
import type { SwymbleAboutLink, SwymbleAboutReadmeSection } from '../../../data/types';

const ProofChip = ({ link }: { link: SwymbleAboutLink }) => {
  const isExternal = link.href.startsWith('http');

  if (isExternal) {
    return (
      <a className="readme__chip" href={link.href} target="_blank" rel="noopener noreferrer">
        {link.label} ↗
      </a>
    );
  }

  return (
    <Link className="readme__chip" to={link.href}>
      {link.label} →
    </Link>
  );
};

type ReadmePanelProps = {
  sections: SwymbleAboutReadmeSection[];
  pullQuote: string;
};

export default function ReadmePanel({ sections, pullQuote }: ReadmePanelProps) {
  return (
    <Reveal as="section" className="readme" id="readme" y={24} margin="-80px">
      <div className="readme__head">
        <p className="about-section__kicker">01 &middot; README.md</p>
        <h2 className="about-section__heading">The short version</h2>
      </div>

      <div className="readme__body">
        {sections.map((section, index) => (
          <article key={section.id} className="readme__section">
            <h3 className="readme__heading">
              <span className="readme__hash">##</span> {section.heading}
            </h3>
            <p className="readme__text">{section.body}</p>
            {section.proof && section.proof.length > 0 && (
              <div className="readme__chips">
                {section.proof.map((link) => (
                  <ProofChip key={link.href} link={link} />
                ))}
              </div>
            )}
            {index < sections.length - 1 && <span className="readme__rule" aria-hidden="true" />}
          </article>
        ))}
      </div>

      <blockquote className="readme__quote">
        <span className="readme__quote-mark" aria-hidden="true">
          &gt;
        </span>
        {pullQuote}
      </blockquote>
    </Reveal>
  );
}
