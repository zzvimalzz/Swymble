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

export const SWYMBLE_LABS: SwymbleLab[] = Object.entries(labModules)
  .filter(([path]) => !path.endsWith('/index.ts'))
  .map(([, module]) => module.default)
  .filter(Boolean)
  .sort((a, b) => a.order - b.order);
