import type { SwymbleLab } from '../types';

// LABS SECTION
// Each lab lives in its own file, named after its id (e.g. `cortex.ts`, `mybirth.ts`), exporting
// a single `SwymbleLab` as its default export. To add a lab, copy an existing file, rename it to
// the new id, and fill in the data — this file discovers and aggregates them automatically.
// See README.md for the full field reference and copy-paste template.

type LabModule = {
  default: SwymbleLab;
};

const labModules = import.meta.glob<LabModule>('./*.ts', {
  eager: true,
});

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * 'Aug 2026' as a sortable month number. `updatedAt` is human copy, so anything that does not
 * parse returns -1 and sinks to the bottom rather than jumping to the top of the page.
 *
 * Mirrored in scripts/lib/lab-data.mjs — the generated files (sitemap, llms.txt, feed) list labs
 * in the same order the page does, and a test in data-integrity.test.ts pins the two together.
 */
export const labRecency = (updatedAt: string): number => {
  const match = /^([A-Za-z]{3})[a-z]*\s+(\d{4})$/.exec(updatedAt.trim());
  if (!match) return -1;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  return month < 0 ? -1 : Number(match[2]) * 12 + month;
};

/** Newest first. `order` is the tie-break, so two labs updated the same month keep a stable,
 *  editable sequence rather than depending on filename order. */
export const compareLabs = (a: SwymbleLab, b: SwymbleLab): number =>
  labRecency(b.updatedAt) - labRecency(a.updatedAt) || a.order - b.order || a.id.localeCompare(b.id);

export const SWYMBLE_LABS: SwymbleLab[] = Object.entries(labModules)
  .filter(([path]) => !path.endsWith('/index.ts'))
  .map(([, module]) => module.default)
  .filter(Boolean)
  .sort(compareLabs);
