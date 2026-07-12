import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPalette, type PaletteEntry, type PaletteGroup } from '../../utils/paletteIndex';
import '../../styles/desktop-palette.css';

/**
 * CommandPalette — ⌘K over everything the site knows. Combobox + listbox
 * semantics: focus stays in the input, arrow keys move aria-activedescendant,
 * Enter executes, Escape closes. The index is one in-memory array, so results
 * are effectively instant.
 */

type CommandPaletteProps = {
  onClose: () => void;
};

const GROUP_LABELS: Record<PaletteGroup, string> = {
  NAVIGATE: 'NAVIGATE',
  LAUNCH: 'LAUNCH',
  READ: 'READ',
  SYSTEM: 'SYSTEM',
};

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const results = useMemo(() => searchPalette(query), [query]);
  const active = results[Math.min(activeIndex, results.length - 1)];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const run = (entry: PaletteEntry) => {
    switch (entry.action.type) {
      case 'navigate':
        onClose();
        navigate(entry.action.to);
        return;
      case 'launch':
        window.open(entry.action.url, '_blank', 'noopener,noreferrer');
        onClose();
        return;
      case 'copy': {
        const { text, toast: message } = entry.action;
        void navigator.clipboard?.writeText(text).then(
          () => setToast(message),
          () => setToast('COPY FAILED — CLIPBOARD BLOCKED'),
        );
        window.setTimeout(onClose, 900);
        return;
      }
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && active) {
      event.preventDefault();
      run(active);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  // Render results grouped, preserving the search ranking inside each group.
  const groups = useMemo(() => {
    const byGroup = new Map<PaletteGroup, PaletteEntry[]>();
    for (const entry of results) {
      const bucket = byGroup.get(entry.group) ?? [];
      bucket.push(entry);
      byGroup.set(entry.group, bucket);
    }
    return [...byGroup.entries()];
  }, [results]);

  return (
    <div className="palette-scrim" onClick={onClose} role="presentation">
      <div
        className="palette-window"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="palette-input-row">
          <span className="palette-caret" aria-hidden="true">▮</span>
          <input
            ref={inputRef}
            className="palette-input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-listbox"
            aria-activedescendant={active ? `palette-opt-${active.id}` : undefined}
            aria-autocomplete="list"
            placeholder="type a command or search…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="palette-esc" onClick={onClose} aria-label="Close palette">
            ESC
          </button>
        </div>

        <ul id="palette-listbox" className="palette-results" role="listbox" aria-label="Results">
          {groups.map(([group, entries]) => (
            <li key={group} role="presentation">
              <span className="palette-group-label" aria-hidden="true">{GROUP_LABELS[group]}</span>
              <ul role="presentation" className="palette-group-list">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    id={`palette-opt-${entry.id}`}
                    role="option"
                    aria-selected={active?.id === entry.id}
                    className={`palette-option ${active?.id === entry.id ? 'is-active' : ''}`.trim()}
                    onPointerEnter={() => setActiveIndex(results.indexOf(entry))}
                    onClick={() => run(entry)}
                  >
                    <span className="palette-option-title">{entry.title}</span>
                    {entry.meta && <span className="palette-option-meta">{entry.meta}</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {results.length === 0 && (
            <li className="palette-empty" role="option" aria-selected="false">
              no matches — try a page, product, or post name
            </li>
          )}
        </ul>

        <div className="palette-status" role="status" aria-live="polite">
          {toast ?? `${results.length} results · ↑↓ move · ↵ run · esc close`}
        </div>
      </div>
    </div>
  );
}
