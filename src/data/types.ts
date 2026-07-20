import type { LucideIcon } from 'lucide-react';

export type SwymbleStackTool = {
  id: string;
  name: string;
  /** Path under /public, e.g. '/images/stack_icons/react.svg'. Logo should already
   *  be in its real brand color — the chip shows it desaturated at rest and reveals
   *  the color on hover. */
  icon: string;
};

export type SwymbleBuildKind = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export type SwymbleTechStack = {
  /** Rendered muted/lighter, above headingLines. */
  headingLead: string;
  /** Rendered bold, one line each, below headingLead. */
  headingLines: string[];
  toolsLabel: string;
  tools: SwymbleStackTool[];
  builds: SwymbleBuildKind[];
};

export type SwymbleProject = {
  title: string;
  category: string;
  categoryColor?: string;
  client: string | null;
  image: string;
  landingImage?: string;
  mobileImage?: string;
  description: string;
  link?: string;
  blogLink?: string;
  status?: 'Live' | 'In Development' | 'Pending';
  outcomes?: string[];
  stack?: string[];
  testimonial?: { quote: string; author: string };
};

export type SwymbleService = {
  id: string;
  title: string;
  colorHex: string;
  colorRgb: string;
  desc: string;
};

export type SwymbleProcessStep = {
  id: string;
  step: string;
  title: string;
  desc: string;
};

export type SwymbleLabVisibility = 'public' | 'teaser' | 'private';

export type SwymbleLabAction = {
  label: string;
  href: string;
  kind: 'external' | 'internal' | 'mailto';
  variant?: 'primary' | 'secondary';
};

export type SwymbleLab = {
  id: string;
  title: string;
  category: string;
  categoryColor?: string;
  image: string;
  status: 'In Development' | 'Private Beta' | 'Live';
  visibility: SwymbleLabVisibility;
  publicSummary: string;
  safeHighlights: string[];
  tags: string[];
  updatedAt: string;
  /** Display order on /labs, ascending. Leave gaps of 10 between entries so new labs can be
   *  slotted in without renumbering everything else. */
  order: number;
  blogCategoryId?: string;
  blogLink?: string;
  actions?: SwymbleLabAction[];
  primaryAction?: SwymbleLabAction;
};

export type SwymbleAbout = {
  title: string;
  paragraphs: string[];
};

export type SwymbleBlogRichText = string | string[];

export type SwymbleBlogContentBlock =
  | { type: 'paragraph'; text: SwymbleBlogRichText; indent?: 0 | 1 | 2 | 3 }
  | { type: 'question'; text: SwymbleBlogRichText; indent?: 0 | 1 | 2 | 3 }
  | { type: 'quote'; text: SwymbleBlogRichText; cite?: SwymbleBlogRichText; indent?: 0 | 1 | 2 | 3 }
  | { type: 'list'; items: SwymbleBlogRichText[]; style?: 'bullet' | 'numbered'; indent?: 0 | 1 | 2 | 3 }
  | { type: 'spacer'; size?: 'sm' | 'md' | 'lg' }
  | { type: 'image'; src: string; caption?: SwymbleBlogRichText }
  | { type: 'heading'; text: SwymbleBlogRichText; level?: 2 | 3 | 4 }
  | { type: 'code'; code: string; language: string };

export type SwymbleBlogCategory = {
  id: string;
  label: string;
  description?: string;
  categoryColor?: string;
};

export type SwymbleBlogPost = {
  id: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  categories: string[];
  coverImage?: string;
  content: SwymbleBlogContentBlock[];
};

export type SwymbleBlogState = {
  title: string;
  description: string;
  emptyStateMsg: string;
  categories: SwymbleBlogCategory[];
  posts: SwymbleBlogPost[];
};

export type SwymbleLatestUpdateCard = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type SwymbleMoonModelId = 'moon-01' | 'moon-02' | 'moon-03' | 'moon-04' | 'moon-05' | 'moon-06' | 'moon-07' | 'moon-08';

export type SwymbleSkillProof = {
  label: string;
  href: string; // internal route ('/labs', '/projects#ib-solutions', '/blog/cortex-part-1') or full external URL (starts with 'http')
};

export type SwymbleSkillItem = {
  name: string;
  color: string;
  description?: string;
  moonModelId?: SwymbleMoonModelId;
  proof?: SwymbleSkillProof[];
};

export type SwymbleSkillCategory = {
  category: string;
  context?: string;
  items: SwymbleSkillItem[];
  proof?: SwymbleSkillProof[];
};

/** The Swymble Universe orbits (kinds of work) and moons (real shipped things) shown in the
 *  desktop 3D scene. Structurally identical to SwymbleSkillCategory. */
export type SwymbleUniverseOrbit = SwymbleSkillCategory;

export type SwymbleSocial = {
  id: string;
  name: string;
  link: string;
  icon: LucideIcon;
};

export type SwymblePositioningStat = {
  id: string;
  label: string;
  value: number;
};

export type SwymblePositioning = {
  /** First entry renders as the headline; the rest as body paragraphs. */
  statement: string[];
  /** If set and its label appears verbatim in a statement paragraph, that substring renders as a link. */
  statementLink?: { label: string; href: string };
  stats: SwymblePositioningStat[];
};

export type SwymbleData = {
  name: string;
  tagline: string;
  marquee: string;
  contactIntro: string;
  positioning: SwymblePositioning;
  techStack: SwymbleTechStack;
  services: SwymbleService[];
  process: SwymbleProcessStep[];
  projects: SwymbleProject[];
  latestUpdates: SwymbleLatestUpdateCard[];
  endCardMobileImage?: string;
  about: SwymbleAbout;
  labs: SwymbleLab[];
  blog: SwymbleBlogState;
  skills: SwymbleSkillCategory[];
  universe: SwymbleUniverseOrbit[];
  socials: SwymbleSocial[];
};
