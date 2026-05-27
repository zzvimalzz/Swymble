import { useEffect, useMemo, useRef, useState } from 'react';
import type { SwymbleSkillCategory } from '../../data/types';
import { useTechUniverseScene } from './TechUniverseScene';
import type { ActiveTech, TooltipState } from './TechUniverseScene';

type TechUniverseProps = {
  skills: SwymbleSkillCategory[];
  setIsHovering: (val: boolean) => void;
};

export default function TechUniverse({ skills, setIsHovering }: TechUniverseProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeTechRef = useRef<ActiveTech>({ category: '' });
  const focusedCategoryRef = useRef('');
  const [activeTech, setActiveTech] = useState<ActiveTech>(() => ({ category: '' }));
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [focusedCategoryName, setFocusedCategoryName] = useState('');

  const focusedCategory = useMemo(() => {
    return skills.find((skillCategory) => skillCategory.category === focusedCategoryName);
  }, [focusedCategoryName, skills]);

  useEffect(() => {
    activeTechRef.current = activeTech;
  }, [activeTech]);

  useEffect(() => {
    focusedCategoryRef.current = focusedCategoryName;
  }, [focusedCategoryName]);

  useTechUniverseScene(canvasRef, { skills, activeTechRef, focusedCategoryRef, setActiveTech, setTooltip, setIsHovering });

  const focusCategory = (category: string) => {
    setFocusedCategoryName(category);
    setActiveTech({ category });
  };

  const clearCategoryFocus = () => {
    setFocusedCategoryName('');
    setActiveTech({ category: '' });
  };

  if (!skills.length) {
    return null;
  }

  return (
    <div className="tech-universe">
      <div className="tech-universe__stage">
        <canvas ref={canvasRef} className="tech-universe__canvas" aria-label="Interactive 3D tech universe" />

        {tooltip && (
          <div className="tech-universe__tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            <span>{tooltip.category}</span>
            <strong>{tooltip.itemName}</strong>
          </div>
        )}
      </div>

      <div className="tech-universe__orbit-controls" aria-label="Tech planet categories">
        {skills.map((skillCategory) => (
          <button
            key={skillCategory.category}
            type="button"
            className={`tech-universe__orbit-button ${skillCategory.category === focusedCategoryName ? 'is-active' : ''}`}
            onClick={() => focusCategory(skillCategory.category)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <span style={{ backgroundColor: skillCategory.items[0]?.color }} />
            {skillCategory.category}
          </button>
        ))}
      </div>

      {focusedCategory && (
        <div className="tech-universe__focus-panel" aria-live="polite">
          <button
            type="button"
            className="tech-universe__back-button"
            onClick={clearCategoryFocus}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            Back
          </button>
          <div>
            <span className="tech-universe__eyebrow">Orbit Focus</span>
            <h3>{focusedCategory.category}</h3>
            {focusedCategory.context && <p>{focusedCategory.context}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
