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

/** One question/answer pair on a lab's page. Rendered visibly *and* emitted as FAQPage
 *  structured data — the question form is what assistants and answer engines quote back when
 *  someone asks "what is <lab>?", so write the answer to stand on its own without the page. */
export type SwymbleLabFaq = {
  question: string;
  answer: string;
};

/** A named capability, one step richer than a `safeHighlights` line. */
export type SwymbleLabFeature = {
  title: string;
  body: string;
};

/** A `label: value` fact in the lab page's spec table (platform, stack, status, …). */
export type SwymbleLabSpec = {
  label: string;
  value: string;
};

/**
 * Long-form content for the lab's own page at `/labs/<id>`.
 *
 * Every lab gets a detail page whether or not it sets this — without it the page is built from
 * the card fields alone. Filling it in is what turns the page from a restated card into
 * something with enough substance to rank for the lab's name and to be summarised accurately by
 * an assistant. Keep it public-safe, same rule as the card copy.
 */
export type SwymbleLabDetail = {
  /** One self-contained sentence answering "what is <lab>?". Used as the page's meta
   *  description, so keep it under ~160 characters. */
  oneLiner: string;
  /** Three-to-five word descriptor that goes in the page <title> after the lab's name. Say what
   *  the thing *is* in the words someone would search for, not a slogan. */
  tagline: string;
  /** Body paragraphs, rendered in order. */
  overview: string[];
  features?: SwymbleLabFeature[];
  specs?: SwymbleLabSpec[];
  faq?: SwymbleLabFaq[];
};

export type SwymbleLab = {
  id: string;
  /** Display name on the cards — deliberately upper case for the lab grid's type treatment. */
  title: string;
  /** Normally-cased product name for page titles, structured data and llms.txt. `title` is
   *  upper case for the card grid, and shouting a brand name in a search result or an assistant's
   *  answer reads as a different, worse product. Defaults to `title` when unset. */
  seoName?: string;
  category: string;
  categoryColor?: string;
  image: string;
  /** Overrides the colour the bubble field would otherwise pull out of this lab's logo. Hex only,
   *  e.g. '#ff9ecb'. See scripts/generate-lab-palette.mjs. */
  accentColor?: string;
  /** 'Archived' is for work that is finished with, not work that failed — it still gets a page
   *  and a card, just no claim to be running. Keep it out of SoftwareApplication in labSeo.ts. */
  status: 'In Development' | 'Private Beta' | 'Live' | 'Archived';
  visibility: SwymbleLabVisibility;
  publicSummary: string;
  safeHighlights: string[];
  tags: string[];
  updatedAt: string;
  /** Tie-break only. /labs is ordered by `updatedAt`, newest first (see data/labs/index.ts);
   *  `order` decides the sequence of labs sharing a month. Gaps of 10 leave room to slot one in. */
  order: number;
  blogCategoryId?: string;
  blogLink?: string;
  actions?: SwymbleLabAction[];
  primaryAction?: SwymbleLabAction;
  detail?: SwymbleLabDetail;
};

// ABOUT PAGE — see data/about/README.md
// The page is framed as a git repository: a header (`whoami`), a README, a language breakdown,
// the career graph, a `git config` block and a `git remote` sign-off. These types back everything
// except the graph, which has its own shapes below.

export type SwymbleAboutLink = {
  label: string;
  /** Internal route ('/projects#ib-solutions') or full external URL. */
  href: string;
};

export type SwymbleAboutAvailability = {
  /** Drives the status dot's color. */
  state: 'open' | 'limited' | 'closed';
  label: string;
};

/** One `## Heading` block of the rendered README. */
export type SwymbleAboutReadmeSection = {
  id: string;
  heading: string;
  body: string;
  /** Links that back the claim up — rendered as chips under the paragraph. */
  proof?: SwymbleAboutLink[];
};

/** A logo chip in the About page stack grid. Same chip treatment as the homepage tech stack
 *  (grayscale at rest, brand color on hover) plus a `usedIn` readout, which is the thing that
 *  makes it a claim rather than a wall of logos. */
export type SwymbleAboutStackTool = {
  id: string;
  name: string;
  /** Path under /public, e.g. '/images/stack_icons/react.png'. Logo should already be in its
   *  real brand color on a transparent background. */
  icon: string;
  /** One short line naming what it is. */
  role: string;
  /** Where it was actually used, revealed on hover. */
  usedIn: string[];
};

/** The parts of the stack that have no logo to show: practices, protocols, platform work. */
export type SwymbleAboutSkillDomain = {
  id: string;
  label: string;
  items: string[];
};

/** A `key = value` line in the `git config --list` block. */
export type SwymbleAboutConfigLine = {
  key: string;
  value: string;
  /** Makes the value a link. */
  href?: string;
};

/** A "currently ..." entry: what's in flight right now. */
export type SwymbleAboutCurrent = {
  id: string;
  label: string;
  value: string;
  detail?: string;
};

export type SwymbleAbout = {
  title: string;
  /** Repo name shown in the header, e.g. 'swymble/engineer'. */
  repo: string;
  role: string;
  location: string;
  availability: SwymbleAboutAvailability;
  /** Short header bio — two or three lines, not the full README. */
  intro: string[];
  readme: SwymbleAboutReadmeSection[];
  /** Single line given pull-quote treatment between the README and the languages. */
  pullQuote: string;
  stack: SwymbleAboutStackTool[];
  skillDomains: SwymbleAboutSkillDomain[];
  config: SwymbleAboutConfigLine[];
  currently: SwymbleAboutCurrent[];
};

// CAREER REPOSITORY (About page git-graph) — see data/about/career/README.md
export type SwymbleCareerNodeType = 'education' | 'employment' | 'milestone' | 'project' | 'award' | 'future';

export type SwymbleCareerTag = { label: string; date?: string };

export type SwymbleCareerLink = { label: string; href: string };

export type SwymbleCareerNode = {
  /** Unique across the whole graph. */
  id: string;
  /** Drives node shape: 'education' = diamond, everything else = square. */
  type: SwymbleCareerNodeType;
  title: string;
  org?: string;
  /** 'YYYY' or 'MM-YYYY' — the node's position in time (its start, if it spans a range). Also
   *  the chronological sort key. */
  date: string;
  /** Optional — same format as `date`, or the literal 'Present' for an ongoing role. Purely
   *  cosmetic (renders as "date – endDate"); only `date` affects layout/sorting. */
  endDate?: string;
  /** Short highlighted result/achievement line, e.g. 'CGPA 3.83/4.00'. */
  results?: string;
  /** A single paragraph, or a bullet list for multi-point roles. */
  description?: string | string[];
  tech?: string[];
  links?: SwymbleCareerLink[];
  /** Public-root path, e.g. '/images/foo.png'. */
  image?: string;
  /** Git-tag style decorations on this commit (e.g. Promotion, Resigned) rendered as flags. */
  tags?: SwymbleCareerTag[];
  /** Hollow, breathing "ghost commit" for an upcoming milestone. */
  isFuture?: boolean;
};

export type SwymbleCareerBranch = {
  /** e.g. 'main', 'swymble', 'ibsolutions', 'what2watch'. Referenced by any branch forking from it. */
  id: string;
  label: string;
  /** Drives the Filters pills — filtering happens per-node, this is the branch's dominant one. */
  category: 'career' | 'education' | 'project';
  /** Which branch this forks from. Omit only for the trunk ('main'). The fork/merge points are
   *  found automatically from dates — no node reference needed. */
  parentBranchId?: string;
  /** 'merged' draws the branch curving back into its parent after its last node (e.g. finished
   *  client work); 'ongoing'/'active' leaves it open, continuing off the top of the graph. */
  status: 'active' | 'merged' | 'ongoing';
  /** Chronological, oldest first. */
  nodes: SwymbleCareerNode[];
};

export type SwymbleCareerRepository = SwymbleCareerBranch[];

// RESUME (the one-page employer view at /resume) — see data/resume.ts
// Deliberately an *overlay*, not a copy: the roles, education and projects themselves are read
// straight out of SWYMBLE_CAREER so the resume can never quietly drift from the About page. This
// type only carries the things a CV needs that the site doesn't — a summary in resume voice,
// tighter bullets, grouped skills, and the handful of entries a CV leaves out.

/** A named group of skills, e.g. 'Languages'. */
export type SwymbleResumeSkillGroup = {
  id: string;
  label: string;
  items: string[];
};

export type SwymbleResume = {
  /** Name at the top of the resume. Omit to fall back to the site's brand name — set it to a
   *  legal name if the employer version should read as a person rather than a studio. */
  name?: string;
  /** One line under the name, e.g. 'Software Engineer · Backend & Platform'. */
  headline: string;
  /** Two or three sentences: the professional summary an employer reads first. */
  summary: string[];
  /** Career node ids to leave off the resume. Include-by-default is deliberate — a new role or
   *  degree added to the career data shows up here automatically, and this list only has to name
   *  what does not belong on a CV (pre-degree education). */
  excludeNodeIds: string[];
  /** Resume-voice bullets keyed by career node id; falls back to the node's own description. */
  bullets: Record<string, string[]>;
  skillGroups: SwymbleResumeSkillGroup[];
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

/** One question/answer pair in the sitewide FAQ — see data/home/faq.ts. */
export type SwymbleFaqEntry = {
  question: string;
  answer: string;
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
  career: SwymbleCareerRepository;
  resume: SwymbleResume;
  labs: SwymbleLab[];
  blog: SwymbleBlogState;
  socials: SwymbleSocial[];
  faq: SwymbleFaqEntry[];
};
