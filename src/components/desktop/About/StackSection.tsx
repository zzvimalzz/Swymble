import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Reveal from '../../motion/Reveal';
import SmartImage from '../../SmartImage';
import type { SwymbleAboutSkillDomain, SwymbleAboutStackTool } from '../../../data/types';

type StackSectionProps = {
  stack: SwymbleAboutStackTool[];
  domains: SwymbleAboutSkillDomain[];
};

// The site's three brand accents. Each chip's hover glow is assigned one at mount (not per hover)
// so the grid isn't monochrome, matching the homepage tech stack exactly.
const BRAND_GLOW_COLORS = ['var(--accent-volt)', 'var(--accent-neon)', 'var(--accent-cyan)'];

/**
 * The stack, as logo chips rather than a chart. Shares the homepage's chip treatment
 * (`.techstack-chip`, grayscale at rest, brand colour on hover) so the two pages read as one site.
 *
 * What it adds over the homepage version: hovering a chip prints what the tool is and where it was
 * actually used. The homepage grid answers "what does he know"; this one answers "where did he
 * use it", which is the question an About page is for.
 */
export default function StackSection({ stack, domains }: StackSectionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = stack.find((tool) => tool.id === activeId) ?? null;

  const glowColors = useMemo(
    () => stack.map((_, index) => BRAND_GLOW_COLORS[index % BRAND_GLOW_COLORS.length]),
    [stack],
  );

  return (
    <Reveal as="section" className="stack" id="stack" y={24} margin="-80px">
      <div className="stack__head">
        <p className="about-section__kicker">02 &middot; The stack</p>
        <h2 className="about-section__heading">What I build with</h2>
        <p className="about-section__lede">
          Hover anything to see what it is and where it actually got used.
        </p>
      </div>

      <div className="stack__grid">
        {stack.map((tool, index) => (
          <button
            type="button"
            key={tool.id}
            className={`techstack-chip stack__chip${activeId === tool.id ? ' stack__chip--active' : ''}${
              activeId && activeId !== tool.id ? ' stack__chip--muted' : ''
            }`}
            style={{ '--chip-glow': glowColors[index] } as CSSProperties}
            onMouseEnter={() => setActiveId(tool.id)}
            onMouseLeave={() => setActiveId(null)}
            onFocus={() => setActiveId(tool.id)}
            onBlur={() => setActiveId(null)}
            aria-label={`${tool.name}. ${tool.role}. Used in ${tool.usedIn.join(', ')}.`}
          >
            <SmartImage src={tool.icon} alt="" className="techstack-chip-icon" padding="0.55rem" />
            <span className="techstack-chip-tooltip" aria-hidden="true">
              {tool.name}
            </span>
          </button>
        ))}
      </div>

      {/* Fixed height, so revealing the readout never shifts the grid below it. */}
      <div className="stack__readout" aria-live="polite">
        {active ? (
          <>
            <span className="stack__readout-name">{active.name}</span>
            <span className="stack__readout-role">{active.role}</span>
            <span className="stack__readout-used">{active.usedIn.join('  ·  ')}</span>
          </>
        ) : (
          <span className="stack__readout-hint">
            {stack.length} tools. Hover one.
          </span>
        )}
      </div>

      <div className="stack__domains">
        {domains.map((domain) => (
          <div key={domain.id} className="stack__domain">
            <h3 className="stack__domain-label">{domain.label}</h3>
            <ul className="stack__domain-list">
              {domain.items.map((item) => (
                <li key={item} className="stack__domain-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
