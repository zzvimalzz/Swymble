import type { SwymbleCareerBranch, SwymbleCareerRepository } from '../../types';

// CAREER REPOSITORY (About page git-graph)
// Each branch lives in its own file, named after its id (e.g. `main.ts`, `swymble.ts`), exporting
// a single `SwymbleCareerBranch` as its default export. To add a branch — including forking off
// an existing one — copy a file, rename it, set `parentBranchId` to the branch it forks from, and
// fill in the nodes; this file discovers and lays everything out automatically (the graph engine
// figures out fork/merge points and column order from `parentBranchId` and dates, no ids to wire
// up by hand). See README.md for the full field reference and copy-paste template.

type BranchModule = {
  default: SwymbleCareerBranch;
};

const branchModules = import.meta.glob<BranchModule>('./*.ts', {
  eager: true,
});

export const SWYMBLE_CAREER: SwymbleCareerRepository = Object.entries(branchModules)
  .filter(([path]) => !path.endsWith('/index.ts'))
  .map(([, module]) => module.default)
  .filter(Boolean);
