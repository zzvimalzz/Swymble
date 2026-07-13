import type { ReactNode } from 'react';
import ScrollCounter from '../motion/ScrollCounter';
import { SWYMBLE_DATA } from '../../data/config';

/**
 * Mobile positioning — parity with the desktop Chapter 02: the claim and the
 * three derived counters, designed for one-column reading (statement first,
 * stats as a horizontal band), replacing the old focus cards.
 */

function renderStatement(paragraph: string): ReactNode {
  const link = SWYMBLE_DATA.positioning.statementLink;
  if (!link || !paragraph.includes(link.label)) {
    return paragraph;
  }

  const [before, after] = paragraph.split(link.label);
  return (
    <>
      {before}
      <a href={link.href} target="_blank" rel="noopener noreferrer">
        {link.label}
      </a>
      {after}
    </>
  );
}

export default function MobilePositioning() {
  const { statement, stats } = SWYMBLE_DATA.positioning;

  return (
    <div className="mobile-positioning" aria-label="What Swymble is">
      <div className="mobile-positioning-statement">
        {statement.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{renderStatement(paragraph)}</p>
        ))}
      </div>

      <dl className="mobile-positioning-stats">
        {stats.map((stat) => (
          <div className="mobile-positioning-stat" key={stat.id}>
            <dt className="mobile-positioning-stat-label">{stat.label}</dt>
            <dd className="mobile-positioning-stat-value">
              <ScrollCounter value={stat.value} suffix={stat.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
