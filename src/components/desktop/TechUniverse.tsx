import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { SwymbleSkillCategory, SwymbleSkillProof } from '../../data/types';
import { useTechUniverseScene } from './TechUniverseScene';
import type { ActiveTech, TooltipState } from './TechUniverseScene';

type TechUniverseProps = {
  skills: SwymbleSkillCategory[];
};

function ProofPill({ proof }: { proof: SwymbleSkillProof }) {
  const isExternal = proof.href.startsWith('http');

  if (isExternal) {
    return (
      <a href={proof.href} className="tech-universe__proof-pill" target="_blank" rel="noopener noreferrer">
        {proof.label}
        <ArrowUpRight size={12} />
      </a>
    );
  }

  return (
    <Link to={proof.href} className="tech-universe__proof-pill">
      {proof.label}
    </Link>
  );
}

export default function TechUniverse({ skills }: TechUniverseProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeTechRef = useRef<ActiveTech>({ category: '' });
  const focusedCategoryRef = useRef('');
  const focusedItemRef = useRef('');
  const [activeTech, setActiveTech] = useState<ActiveTech>(() => ({ category: '' }));
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [focusedCategoryName, setFocusedCategoryName] = useState('');
  const [focusedItemName, setFocusedItemName] = useState('');

  const focusedCategory = useMemo(() => {
    return skills.find((skillCategory) => skillCategory.category === focusedCategoryName);
  }, [focusedCategoryName, skills]);

  const focusedItem = useMemo(() => {
    return focusedCategory?.items.find((item) => item.name === focusedItemName);
  }, [focusedCategory, focusedItemName]);

  const focusedProof = useMemo(() => {
    if (focusedItem) {
      return focusedItem.proof?.length ? focusedItem.proof : focusedCategory?.proof;
    }
    return focusedCategory?.proof;
  }, [focusedCategory, focusedItem]);

  useEffect(() => {
    activeTechRef.current = activeTech;
  }, [activeTech]);

  useEffect(() => {
    focusedCategoryRef.current = focusedCategoryName;
  }, [focusedCategoryName]);

  useEffect(() => {
    focusedItemRef.current = focusedItemName;
  }, [focusedItemName]);

  // Stable identities (state setters never change) so the scene's effect doesn't need to
  // re-run when these are passed down as click-handling callbacks.
  const focusCategory = useCallback((category: string) => {
    setFocusedCategoryName(category);
    setFocusedItemName('');
    setActiveTech({ category });
  }, []);

  const focusItemDirect = useCallback((category: string, itemName: string, color: string) => {
    setFocusedCategoryName(category);
    setFocusedItemName(itemName);
    setActiveTech({ category, itemName, color, source: 'selected' });
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedCategoryName('');
    setFocusedItemName('');
    setActiveTech({ category: '' });
  }, []);

  const webglFailed = useTechUniverseScene(canvasRef, {
    skills,
    activeTechRef,
    focusedCategoryRef,
    focusedItemRef,
    setActiveTech,
    setTooltip,
    onSelectItem: focusItemDirect,
    onSelectCategory: focusCategory,
    onClearFocus: clearFocus,
  });

  const focusItem = (itemName: string, color: string) => {
    if (!focusedCategory) return;
    focusItemDirect(focusedCategory.category, itemName, color);
  };

  const goBack = () => {
    if (focusedItemName) {
      focusCategory(focusedCategoryName);
      return;
    }
    clearFocus();
  };

  if (!skills.length) {
    return null;
  }

  // No WebGL context (GPU-less headless browsers, remote desktops, hardened configs): render
  // the same information as a flat map instead of a 3D scene, so nothing is lost — this is also
  // what non-JS-rendering crawlers see in prerender snapshots taken on GPU-less CI runners.
  if (webglFailed) {
    return (
      <div className="tech-universe tech-universe--fallback">
        <p className="tech-universe-fallback-note">
          This browser can't create a WebGL context, so here is the universe as a flat map.
        </p>
        <ul className="tech-universe-fallback-grid">
          {skills.map((category) => (
            <li key={category.category} className="tech-universe-fallback-orbit">
              <h3>{category.category}</h3>
              {category.context && <p className="tech-universe-fallback-context">{category.context}</p>}
              <p className="tech-universe-fallback-items">
                {category.items.map((item) => item.name).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="tech-universe">
      <div className="tech-universe__stage">
        <canvas ref={canvasRef} className="tech-universe__canvas" aria-label="Interactive 3D map of Swymble projects" />

        {tooltip && (
          <div className="tech-universe__tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            <span>{tooltip.category}</span>
            <strong>{tooltip.itemName}</strong>
          </div>
        )}
      </div>

      <div className={`tech-universe__orbit-controls ${focusedCategory ? 'is-items' : 'is-categories'}`} aria-label={focusedCategory ? `${focusedCategory.category} items` : 'Swymble universe orbits'}>
        {(focusedCategory ? focusedCategory.items : skills).map((controlItem) => {
          const isItem = 'color' in controlItem;
          const label = isItem ? controlItem.name : controlItem.category;
          const color = isItem ? controlItem.color : controlItem.items[0]?.color;
          const isActive = isItem ? controlItem.name === focusedItemName : controlItem.category === focusedCategoryName;

          return (
            <button
              key={label}
              type="button"
              className={`tech-universe__orbit-button ${isActive ? 'is-active' : ''}`}
              onClick={() => (isItem ? focusItem(controlItem.name, controlItem.color) : focusCategory(controlItem.category))}
            >
              <span className="tech-universe__orbit-signal" style={{ backgroundColor: color }} />
              <span className="tech-universe__orbit-label">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="tech-universe__focus-panel" aria-live="polite">
        {focusedCategory ? (
          <>
            <button
              type="button"
              className="tech-universe__back-button"
              onClick={goBack}
            >
              Back
            </button>
            <div>
              <span className="tech-universe__eyebrow">{focusedItem ? 'Moon Focus' : 'Orbit Focus'}</span>
              <h3>{focusedItem?.name ?? focusedCategory.category}</h3>
              {(focusedItem ? focusedItem.description : focusedCategory.context) && (
                <p>{focusedItem ? focusedItem.description : focusedCategory.context}</p>
              )}
              {!!focusedProof?.length && (
                <div className="tech-universe__proof-block">
                  <span className="tech-universe__eyebrow">Seen In</span>
                  <div className="tech-universe__proof">
                    {focusedProof.map((proof) => (
                      <ProofPill key={`${proof.label}-${proof.href}`} proof={proof} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="tech-universe__hint">Select an orbit to explore what Swymble has shipped.</p>
        )}
      </div>
    </div>
  );
}
