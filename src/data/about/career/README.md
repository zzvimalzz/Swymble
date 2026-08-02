# Career Repository Data

Drives the interactive git-graph on `/about` (block `03 — git log`) and the contribution mosaic in
the page header. `index.ts` exports one array, `SWYMBLE_CAREER: SwymbleCareerBranch[]`: every
branch lives in that one file, so the whole fork tree is visible at a glance when you're adding to it.

The graph is a **swimlane chart**: x is a branch lane, y is real elapsed time, and it reads
**top (newest) to bottom (oldest)**, the same order `git log` prints in. The present sits at the
top and scrolling down walks back through history. Beside it, the same data renders as a
`git log --oneline --graph` panel grouped by year; the two are hover- and click-synced, and both
run newest first so a row's position matches its node's height.

## Concepts
- **Branch**: a thread through the graph. The `main` trunk carries the big-picture milestones;
  branches that fork off another branch and stay open (`status: 'ongoing'`) represent something
  continuing; branches that fork off, do their thing, and fold back in (`status: 'merged'`)
  represent something finished, like a specific program or engagement.
- **Node** (commit): one milestone on a branch. `type` drives its shape: `education` = diamond,
  everything else (`employment`, `milestone`, `project`, `award`) = square. Any node with
  `isFuture: true` renders hollow/dashed and gently breathing, regardless of `type`.
- **Fork and merge points are automatic**: set `parentBranchId` to the branch you're forking from
  and the graph works out where to draw the join from your nodes' dates. You never reference a
  specific node id to fork or merge. Branches can fork from any other branch, not just `main`, so
  you can nest as deep as the real story goes (e.g. an internship branch that forks off a degree
  branch, which itself forks off and merges back into main).
- **Lane and color are automatic too.** A branch takes the leftmost *lane* that is vertically free
  for its whole span, so lanes are reused: `foundation` (2020) and `employment` (2025–) share one
  track, the same way a real git graph renderer packs them. Two branches sharing a lane stay
  unambiguous because each keeps its own color (assigned by position in the fork tree, not by lane)
  and is labelled with a pill at its fork point — which is why `label` matters, see below.
- **Vertical distance is time.** Gaps between dates are drawn proportionally but clamped, so an
  empty two-year stretch stays visibly taller than a one-month gap without running to 800px of
  nothing. A year ruler down the left edge marks every year in range, including empty ones.

## Adding a branch
Copy an existing branch object in `index.ts`, give it a new unique `id`, set `parentBranchId` to
whatever it forks from (or omit it, only `main` should have no parent), and fill in the nodes.
That's it, no other file to touch.

## Template
```ts
{
  id: 'my-branch',            // referenced by any branch forking FROM this one
  label: 'my-branch',         // rendered as the pill at the fork point AND as the log's commit
                              // scope, e.g. "feat(my-branch): Kickoff" — keep it short
  category: 'project',        // 'career' | 'education' | 'project', drives the Filters
  parentBranchId: 'swymble',  // which branch this forks from; omit only for 'main'
  status: 'ongoing',          // 'ongoing' | 'active' stays open; 'merged' curves back into its parent
  nodes: [
    {
      id: 'my-branch-kickoff',    // unique across the WHOLE graph, not just this branch
      type: 'project',
      title: 'Kickoff',
      org: 'My Client',
      date: '01-2027',            // 'MM-YYYY', or just 'YYYY' if you don't know/need the month
      endDate: '03-2027',         // optional, or 'Present' for something ongoing
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
- `id` (branch and node) must be globally unique, the data-integrity tests enforce this.
- `parentBranchId` must reference a real branch id, also enforced by tests. Nodes are authored
  **oldest first** within a branch; the earliest node is what the fork point is measured from, and
  the latest node is what the merge point (if any) is measured from.
- `date`: `'MM-YYYY'` (e.g. `'03-2027'`) or just `'YYYY'`. This is both the sort key and the
  position on the time axis, so it has to be accurate relative to everything else in the graph. A
  bare `'YYYY'` is treated as **January** of that year everywhere (graph, log grouping, mosaic).
- Two nodes on **different** branches may share a date — they line up on the same row, which is the
  point of a swimlane. Two on the **same** branch may as well; they stack at a tighter offset.
- `endDate` and `results` are purely cosmetic, they don't affect layout, only the hover/click card.
- `description`: a string for one paragraph, or a string array for a bullet list (useful for a
  role with several distinct responsibilities).
- `links[].href`: an internal route (`/projects#...`, `/blog/...`) or a full external URL.
- `image` (optional, on a node): a public-root path, e.g. `/images/foo.png`.
- Keep copy public-safe, same rule as every other data folder in this repo.

## Branch labels
Each branch's `label` is drawn as a pill **in the right gutter**, joined to its fork point by a
dotted leader line, and nudged vertically so no two pills overlap. They used to sit beside the fork
node, where a long label reached into the next lane and covered whatever line or node was there.
Nothing needs configuring, but keep labels short: the gutter is sized from `GUTTER_RIGHT` in
`constants.ts`, and a very long label will need that widened.

## Removing a branch
Delete its object from the array. Any branch that forked from it should either be re-pointed
(`parentBranchId`) or removed too.
