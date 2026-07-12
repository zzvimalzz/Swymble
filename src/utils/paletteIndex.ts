import { SITE_ROUTES } from '../routes';
import { SWYMBLE_SHIPPED } from '../data/shipped';
import { SWYMBLE_BLOG_POSTS } from '../data/blog/posts';
import { SWYMBLE_SOCIALS } from '../data/home/socials';
import { BUILD_COMMIT } from './buildInfo';

// COMMAND PALETTE INDEX — one in-memory index over everything the site knows:
// routes, shipped work, blog posts, and a small set of true system commands.
// Built once at module scope from the same typed data that renders the pages,
// so the palette can never drift from the site.

export type PaletteGroup = 'NAVIGATE' | 'LAUNCH' | 'READ' | 'SYSTEM';

export type PaletteAction =
  | { type: 'navigate'; to: string }
  | { type: 'launch'; url: string }
  | { type: 'copy'; text: string; toast: string };

export type PaletteEntry = {
  id: string;
  group: PaletteGroup;
  title: string;
  meta?: string;
  keywords: string;
  action: PaletteAction;
};

const emailSocial = SWYMBLE_SOCIALS.find((social) => social.link.startsWith('mailto:'));
const emailAddress = emailSocial?.link.replace(/^mailto:/, '').split('?')[0];

const routeEntries: PaletteEntry[] = SITE_ROUTES.map((route) => ({
  id: `route-${route.path}`,
  group: 'NAVIGATE',
  title: route.path === '/' ? '~/home' : `~${route.path}`,
  meta: route.label.toUpperCase(),
  keywords: `${route.label} ${route.path} go page`.toLowerCase(),
  action: { type: 'navigate', to: route.path },
}));

const shippedEntries: PaletteEntry[] = SWYMBLE_SHIPPED.map((item) => ({
  id: `shipped-${item.id}`,
  group: 'LAUNCH',
  title: item.title,
  meta: item.status.toUpperCase(),
  keywords: `${item.title} ${item.category} ${item.kind} open launch`.toLowerCase(),
  action: item.href.external
    ? { type: 'launch', url: item.href.url }
    : { type: 'navigate', to: item.href.url },
}));

const postEntries: PaletteEntry[] = SWYMBLE_BLOG_POSTS.map((post) => ({
  id: `post-${post.id}`,
  group: 'READ',
  title: post.title,
  meta: post.date,
  keywords: `${post.title} ${post.tags.join(' ')} blog read`.toLowerCase(),
  action: { type: 'navigate', to: `/blog/${post.id}` },
}));

const systemEntries: PaletteEntry[] = [
  ...(emailAddress
    ? [{
        id: 'sys-copy-email',
        group: 'SYSTEM' as const,
        title: 'copy email',
        meta: emailAddress,
        keywords: 'copy email contact address clipboard',
        action: { type: 'copy' as const, text: emailAddress, toast: 'EMAIL COPIED ✓' },
      }]
    : []),
  {
    id: 'sys-run-game',
    group: 'SYSTEM',
    title: 'run glitch-runner',
    meta: 'GAME',
    keywords: 'run glitch runner game play sandbox arcade',
    action: { type: 'navigate', to: '/labs?sandbox=1' },
  },
  {
    id: 'sys-build',
    group: 'SYSTEM',
    title: 'build info',
    meta: `BUILD ${BUILD_COMMIT.toUpperCase()}`,
    keywords: 'build version commit hash info',
    action: { type: 'copy', text: BUILD_COMMIT, toast: `BUILD ${BUILD_COMMIT.toUpperCase()} COPIED ✓` },
  },
];

export const PALETTE_INDEX: PaletteEntry[] = [
  ...routeEntries,
  ...shippedEntries,
  ...postEntries,
  ...systemEntries,
];

const GROUP_ORDER: PaletteGroup[] = ['NAVIGATE', 'LAUNCH', 'READ', 'SYSTEM'];

/** Case-insensitive subsequence match with word-boundary and prefix bonuses. */
function score(query: string, entry: PaletteEntry): number {
  const haystack = `${entry.title} ${entry.keywords}`.toLowerCase();
  const needle = query.toLowerCase().trim();
  if (!needle) {
    return 1;
  }

  if (haystack.includes(needle)) {
    // Direct substring: strongest, earlier is better.
    return 100 - haystack.indexOf(needle);
  }

  // Subsequence: every query char must appear in order.
  let hi = 0;
  let hits = 0;
  for (const char of needle) {
    const found = haystack.indexOf(char, hi);
    if (found === -1) {
      return 0;
    }
    hits += found === hi ? 2 : 1; // consecutive runs score higher
    hi = found + 1;
  }
  return hits;
}

export function searchPalette(query: string, limit = 12): PaletteEntry[] {
  const scored = PALETTE_INDEX
    .map((entry) => ({ entry, s: score(query, entry) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) =>
      b.s - a.s || GROUP_ORDER.indexOf(a.entry.group) - GROUP_ORDER.indexOf(b.entry.group),
    );

  return scored.slice(0, limit).map(({ entry }) => entry);
}
