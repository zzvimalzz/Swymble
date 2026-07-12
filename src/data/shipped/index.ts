import { SWYMBLE_LABS } from '../labs/labs';
import { SWYMBLE_PROJECTS } from '../projects/projects';
import type { SwymbleLab, SwymbleProject } from '../types';

// UNIFIED SHIPPED MODEL (Swymble OS)
// One normalized view over projects + labs, powering the homepage workspace,
// the command palette, and (later) the Star Chart. Strangler-style adapter:
// projects.ts and labs.ts stay the authoritative sources — nothing is
// duplicated here, and existing pages keep reading the original files.

export type SwymbleShippedKind = 'client' | 'product' | 'experiment' | 'research' | 'game';

export type SwymbleShippedItem = {
  id: string;
  title: string;
  kind: SwymbleShippedKind;
  category: string;
  categoryColor?: string;
  status: 'Live' | 'In Development' | 'Private Beta' | 'Pending';
  summary: string;
  /** Logo/identity image (public-root path). */
  image: string;
  /** Larger visual for the window preview area; falls back to image. */
  poster?: string;
  client?: string;
  updatedAt?: string;
  /** Teaser/private items render redacted in public surfaces. */
  restricted: boolean;
  /** Primary destination when the window is opened. */
  href: { url: string; external: boolean };
  /** Featured items get the large workspace windows. */
  featured?: boolean;
};

// Lab id → kind. Anything unlisted ships as 'product' (labs are products by default).
const LAB_KIND: Record<string, SwymbleShippedKind> = {
  cortex: 'research',
  territory: 'experiment',
};

function fromProject(project: SwymbleProject): SwymbleShippedItem {
  const anchor = project.title.replace(/\s+/g, '-').toLowerCase();
  return {
    id: `project-${anchor}`,
    title: project.title,
    kind: 'client',
    category: project.category,
    categoryColor: project.categoryColor,
    status: project.status ?? 'Live',
    summary: project.description,
    image: project.image,
    poster: project.landingImage ?? project.image,
    client: project.client ?? undefined,
    restricted: false,
    href: { url: `/projects#${anchor}`, external: false },
    featured: true,
  };
}

function fromLab(lab: SwymbleLab): SwymbleShippedItem {
  const restricted = lab.visibility !== 'public';
  const externalAction = lab.actions?.find((action) => action.kind === 'external');
  return {
    id: `lab-${lab.id}`,
    title: lab.title,
    kind: LAB_KIND[lab.id] ?? 'product',
    category: lab.category,
    categoryColor: lab.categoryColor,
    status: lab.status,
    summary: lab.publicSummary,
    image: lab.image,
    client: undefined,
    updatedAt: lab.updatedAt,
    restricted,
    // Restricted work routes to its lab entry; public products open for real.
    href: externalAction && !restricted
      ? { url: externalAction.href, external: true }
      : { url: '/labs', external: false },
    featured: !restricted,
  };
}

const publicLabs = SWYMBLE_LABS.filter((lab) => lab.visibility !== 'private');

export const SWYMBLE_SHIPPED: SwymbleShippedItem[] = [
  ...publicLabs.map(fromLab),
  ...SWYMBLE_PROJECTS.map(fromProject),
];

export const SHIPPED_LIVE_COUNT = SWYMBLE_SHIPPED.filter((item) => item.status === 'Live').length;

/** Workspace ordering: featured live products first, then client work, then teasers. */
export const SHIPPED_WORKSPACE: SwymbleShippedItem[] = [...SWYMBLE_SHIPPED].sort((a, b) => {
  const rank = (item: SwymbleShippedItem) =>
    (item.restricted ? 2 : 0) + (item.status === 'Live' ? 0 : 1);
  return rank(a) - rank(b);
});
