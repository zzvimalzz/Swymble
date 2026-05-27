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

  useEffect(() => {
    activeTechRef.current = activeTech;
  }, [activeTech]);

  useEffect(() => {
    focusedCategoryRef.current = focusedCategoryName;
  }, [focusedCategoryName]);

  useEffect(() => {
    focusedItemRef.current = focusedItemName;
  }, [focusedItemName]);

  useTechUniverseScene(canvasRef, { skills, activeTechRef, focusedCategoryRef, focusedItemRef, setActiveTech, setTooltip, setIsHovering });

  const focusCategory = (category: string) => {
    setFocusedCategoryName(category);
    setFocusedItemName('');
    setActiveTech({ category });
  };

  const focusItem = (itemName: string, color: string) => {
    if (!focusedCategory) return;
    setFocusedItemName(itemName);
    setActiveTech({ category: focusedCategory.category, itemName, color, source: 'selected' });
  };

  const goBack = () => {
    if (focusedItemName) {
      setFocusedItemName('');
      setActiveTech({ category: focusedCategoryName });
      return;
    }
    setFocusedCategoryName('');
    setFocusedItemName('');
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

      <div className={`tech-universe__orbit-controls ${focusedCategory ? 'is-items' : 'is-categories'}`} aria-label={focusedCategory ? `${focusedCategory.category} items` : 'Tech planet categories'}>
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
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <span className="tech-universe__orbit-signal" style={{ backgroundColor: color }} />
              <span className="tech-universe__orbit-label">{label}</span>
            </button>
          );
        })}
      </div>

      {focusedCategory && (
        <div className="tech-universe__focus-panel" aria-live="polite">
          <button
            type="button"
            className="tech-universe__back-button"
            onClick={goBack}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            Back
          </button>
          <div>
            <span className="tech-universe__eyebrow">{focusedItem ? 'Moon Focus' : 'Orbit Focus'}</span>
            <h3>{focusedItem?.name ?? focusedCategory.category}</h3>
            {(focusedItem?.description ?? focusedCategory.context) && <p>{focusedItem?.description ?? focusedCategory.context}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
