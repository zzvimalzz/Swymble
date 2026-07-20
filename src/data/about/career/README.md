# Career Repository Data

Drives the interactive git-graph on `/about`. `index.ts` exports one array,
`SWYMBLE_CAREER: SwymbleCareerBranch[]` — every branch lives in that one file, so the whole fork
tree is visible at a glance when you're adding to it.

## Concepts
- **Branch** — a thread through the graph: the `main` trunk (education → employment), branches
  that fork off another branch and stay open (`status: 'ongoing'`), and branches that fork off,
  do their thing, and fold back in (`status: 'merged'`).
- **Node** (commit) — one milestone on a branch. `type` drives its shape: `education` = diamond,
  everything else (`employment` / `milestone` / `project` / `award`) = square. Any node with
  `isFuture: true` renders hollow/dashed and gently breathing, regardless of `type`.
- **Fork & merge points are automatic** — set `parentBranchId` to the branch you're forking from
  and the graph works out *where* to draw the join from your nodes' dates. You never reference a
  specific node id to fork or merge.
- **Column & color are automatic too** — a branch's left-to-right position and its line color are
  both derived from where it sits in the fork tree. Nothing to configure.

## Adding a branch
Copy an existing branch object in `index.ts`, give it a new unique `id`, set `parentBranchId` to
whatever it forks from (or omit it — only `main` should have no parent), and fill in the nodes.
That's it — no other file to touch.

## Template
```ts
{
  id: 'my-branch',            // referenced by any branch forking FROM this one
  label: 'my-branch',         // shown nowhere yet, but keep it human-readable
  category: 'project',        // 'career' | 'education' | 'project' — drives the Filters
  parentBranchId: 'swymble',  // which branch this forks from; omit only for 'main'
  status: 'ongoing',          // 'ongoing' | 'active' stays open; 'merged' curves back into its parent
  nodes: [
    {
      id: 'my-branch-kickoff',    // unique across the WHOLE graph, not just this branch
      type: 'project',
      title: 'Kickoff',
      org: 'My Client',
      date: '01-2027',            // 'MM-YYYY', or just 'YYYY' if you don't know/need the month
      endDate: '03-2027',         // optional — or 'Present' for something ongoing
      results: 'Optional short highlight, e.g. a GPA or an award tier',
      description: 'A single paragraph, or use an array for a bullet list of points.',
      tech: ['Optional', 'Tags'],
      links: [{ label: 'View project', href: '/projects#my-client' }],
      tags: [{ label: 'Kickoff' }], // optional git-tag decorations, rendered as small flags
    },
    {
      id: 'my-branch-launch',
      type: 'project',
      title: 'Launch',
      date: '03-2027',
      isFuture: true,                // hollow, breathing "ghost commit" for something upcoming
    },
  ],
},
```

## Field notes
- `id` (branch and node) must be globally unique — the data-integrity tests enforce this.
- `parentBranchId` must reference a real branch id — also enforced by tests. Nodes are authored
  **oldest first** within a branch; the earliest node is what the fork point is measured from, and
  the latest node is what the merge point (if any) is measured from.
- `date`: `'MM-YYYY'` (e.g. `'03-2027'`) or just `'YYYY'`. This is the sort key, so it has to be
  accurate relative to everything else in the graph.
- `endDate` and `results` are purely cosmetic — they don't affect layout, only the hover/click card.
- `description`: a string for one paragraph, or a string array for a bullet list (useful for a
  role with several distinct responsibilities).
- `links[].href`: an internal route (`/projects#...`, `/blog/...`) or a full external URL.
- `image` (optional, on a node): a public-root path, e.g. `/images/foo.png`.
- Keep copy public-safe — same rule as every other data folder in this repo.

## Removing a branch
Delete its object from the array. Any branch that forked from it should either be re-pointed
(`parentBranchId`) or removed too.
