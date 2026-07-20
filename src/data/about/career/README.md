# Career Repository Data

Drives the interactive git-graph on `/about`. `index.ts` imports every branch file here
explicitly (order matters — it controls lane order in the graph) and flattens them into
`SWYMBLE_CAREER`.

## Concepts
- **Branch** — a thread through the graph: the `main` trunk (education → employment), the
  long-running `feature/swymble` studio branch (forks off `main` and never merges back), short
  client branches that merge back in once a project ships, and long-running product branches that
  stay open with future "ghost" commits.
- **Node** (commit) — one milestone on a branch. `type` drives its shape on the graph: `education`
  = diamond, `employment` = square, `milestone` = circle, `project` = small circle, and any node
  with `isFuture: true` = hollow, breathing circle regardless of `type`.
- **Tags** — small flags on a node for in-place events that don't warrant their own commit (a
  promotion, a major release). Attach via `node.tags`, not a new node.

## Adding a branch
Create a new file, export a `SwymbleCareerBranch` (or an array of related branches — see
`swymble.ts` for a studio branch plus its client/product sub-branches) as the default export, and
import it into `index.ts` in the position you want it to appear.

## Template
```ts
// src/data/about/career/my-branch.ts
import type { SwymbleCareerBranch } from '../../types';

const branch: SwymbleCareerBranch = {
  id: 'client/my-client',           // 'main' | 'feature/x' | 'client/x' | 'product/x'
  label: 'client/my-client',
  category: 'project',              // 'career' | 'education' | 'project' — drives Filters
  parentBranchId: 'feature/swymble',// omit only for 'main'
  splitAfterNodeId: 'swymble-first-client', // node id on the parent this forks from
  mergesBackAfterNodeId: 'my-client-launch', // set once the branch merges back; omit if ongoing
  status: 'merged',                 // 'active' | 'merged' | 'ongoing'
  nodes: [
    {
      id: 'my-client-discovery',    // unique across the WHOLE graph, not just this branch
      type: 'project',
      title: 'Discovery',
      org: 'My Client',
      date: '2027-01',              // 'YYYY' or 'YYYY-MM', also the sort key
      description: 'Public-safe summary of this milestone.',
      tech: ['Optional', 'Tags'],
      links: [{ label: 'View project', href: '/projects#my-client' }],
      tags: [{ label: 'Kickoff', date: '2027-01' }], // optional git-tag decorations
    },
    {
      id: 'my-client-launch',
      type: 'project',
      title: 'Launch',
      org: 'My Client',
      date: '2027-03',
      isFuture: true,                // hollow, breathing "ghost commit" for something upcoming
    },
  ],
};

export default branch;
```

## Field notes
- `id` (branch and node) must be globally unique — the data-integrity tests enforce this.
- `parentBranchId` / `splitAfterNodeId` / `mergesBackAfterNodeId` must reference real branch/node
  ids — also enforced by tests.
- `links[].href`: an internal route (`/projects#...`, `/blog/...`) or a full external URL.
- `image` (optional, on a node): a public-root path, e.g. `/images/foo.png`.
- Keep copy public-safe — same rule as every other data folder in this repo.
