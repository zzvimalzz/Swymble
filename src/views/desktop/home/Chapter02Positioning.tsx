import type { ReactNode } from 'react';
import Reveal from '../../../components/motion/Reveal';
import ScrollCounter from '../../../components/motion/ScrollCounter';
import { SWYMBLE_DATA } from '../../../data/config';

/**
 * Chapter 02 — positioning. One claim and three derived counters, replacing the
 * old "What You'll Find Here" self-description cards. The counter values come
 * from the data layer (live products, in-development experiments, blog notes),
 * so they stay true as content is added.
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
      <a href={link.href} target="_blank" rel="noopener noreferrer" data-cursor="hover">
        {link.label}
      </a>
      {after}
    </>
  );
}

export default function Chapter02Positioning() {
  const { statement, stats } = SWYMBLE_DATA.positioning;

  return (
    <section className="positioning-section" aria-label="What Swymble is">
      <Reveal>
        <div className="positioning-statement">
          {statement.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{renderStatement(paragraph)}</p>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <dl className="positioning-stats">
          {stats.map((stat) => (
            <div className="positioning-stat" key={stat.id}>
              <dt className="positioning-stat-label">{stat.label}</dt>
              <dd className="positioning-stat-value">
                <ScrollCounter value={stat.value} suffix={stat.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
