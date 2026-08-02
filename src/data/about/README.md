# About Data

| File | Section |
|---|---|
| `about.ts` | everything on the About page except the graph |
| `career/` | the interactive git-graph career repository — see [career/README.md](career/README.md) |

The About page is framed as a git repository. Each field in `about.ts` feeds one numbered block:

| Block | Field |
|---|---|
| header (`whoami`) | `repo`, `role`, `location`, `availability`, `intro` |
| 01 `README.md` | `readme`, `pullQuote` |
| 02 The stack | `stack`, `skillDomains` |
| 03 `git log` | *(from `career/`, not this file)* |
| 04 `git config --list` | `config`, `currently` |
| 05 `/bin/swymble` | *(the shell reads every field above — no separate data)* |
| 06 `git remote -v` | *(from `home/socials.ts`)* |

The stat row under the header is **derived** — commits, branches, years, shipped and lab counts all
come from `career/`, `projects/` and `labs/`. Add a project, the number moves. Never type one in.

## Field reference

```ts
export const SWYMBLE_ABOUT: SwymbleAbout = {
  title: 'ABOUT ME',
  repo: 'swymble/engineer',          // the big Anton wordmark
  role: 'Software Engineer · ...',   // one line under it
  location: 'Kuala Lumpur, Malaysia',
  availability: { state: 'open', label: 'Open for client work' },  // open | limited | closed
  intro: ['Two or three short lines.', 'Not the full story.'],

  readme: [
    {
      id: 'studio',
      heading: 'Studio',             // renders as "## Studio"
      body: 'One tight paragraph.',
      proof: [{ label: 'All projects', href: '/projects' }],  // optional evidence chips
    },
  ],
  pullQuote: 'The one line worth pulling out.',

  // Logo chips. `icon` lives in public/images/stack_icons/. `role` and `usedIn` are what appear
  // in the readout on hover, and they are the point of the grid.
  stack: [
    {
      id: 'php',
      name: 'PHP',
      icon: '/images/stack_icons/php.png',
      role: 'Primary language at work',
      usedIn: ['JurisTech', 'Client builds'],
    },
  ],
  // Only for things with no logo to show (practices, protocols, platform work).
  skillDomains: [{ id: 'backend', label: 'Backend and delivery', items: ['REST APIs', 'CI/CD'] }],

  config: [
    { key: 'user.location', value: 'Kuala Lumpur, MY' },
    { key: 'fun.x', value: 'watchpaintdry.net', href: 'https://www.watchpaintdry.net/' },  // href optional
  ],
  currently: [{ id: 'building', label: 'Building', value: 'Cortex', detail: 'Optional line.' }],
};
```

### Notes

- **The stack grid is hand-curated, not derived.** The `tech` arrays on career nodes are honest but
  uneven (they include one-off jokes like `'Zen'`). Keep `usedIn` truthful; it is the part that
  makes the grid a claim rather than a wall of logos.
- **Chips reuse the homepage `.techstack-chip` styles.** Adding a tool means dropping its logo into
  `public/images/stack_icons/` (real brand colour, transparent background) and adding an entry; the
  chip desaturates at rest and reveals colour on hover automatically.
- **Anything without a logo goes in `skillDomains`**, not the chip grid.
- **The shell (`05`) needs no data of its own.** `terminalCommands.ts` reads `about`, `career`,
  `labs` and `projects` directly, so anything added above is queryable immediately. `ls labs`
  filters out `visibility: 'private'` labs — there is a test pinning that.
- Adding a `readme` section or a `config` line needs no component change; both render from the array.
