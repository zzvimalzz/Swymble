import type { SwymbleCareerBranch, SwymbleCareerRepository } from '../../types';

// CAREER REPOSITORY (About page git-graph)
// Each file here exports one branch (or an array of related branches, e.g. a studio branch plus
// its client/product sub-branches) as its default export. This file discovers and aggregates
// them automatically — to add a branch, add a file; to add a sub-branch, export it alongside its
// parent. Unlike labs/ (sorted by an `order` field), branch order here follows FILE order below,
// since it isn't auto-sortable by glob — see README.md for the full field reference.

import mainBranch from './main';
import swymbleBranches from './swymble';

type CareerModule = SwymbleCareerBranch | SwymbleCareerBranch[];

const toArray = (module: CareerModule): SwymbleCareerBranch[] =>
  Array.isArray(module) ? module : [module];

export const SWYMBLE_CAREER: SwymbleCareerRepository = [
  ...toArray(mainBranch),
  ...toArray(swymbleBranches),
];
