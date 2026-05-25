import type { LucideIcon } from 'lucide-react';

export type SwymbleWhatIDo = {
  title: string;
  colorHex: string;
  colorRgb: string;
  desc: string;
};

export type SwymbleProject = {
  title: string;
  category: string;
  client: string | null;
  image: string;
  landingImage?: string;
  mobileImage?: string;
  description: string;
  link?: string;
  blogLink?: string;
  status?: 'Live' | 'In Development' | 'Pending';
};

export type SwymbleLabVisibility = 'public' | 'teaser' | 'private';

export type SwymbleLabAction = {
  label: string;
  href: string;
  kind: 'external' | 'internal' | 'mailto';
};

export type SwymbleLab = {
  id: string;
  title: string;
  category: string;
  image: string;
  status: 'In Development' | 'Private Beta' | 'Live';
  visibility: SwymbleLabVisibility;
  publicSummary: string;
  safeHighlights: string[];
  tags: string[];
  updatedAt: string;
  blogCategoryId?: string;
  blogLink?: string;
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

export type SwymbleSkillItem = {
  name: string;
  color: string;
  level: number;
};

export type SwymbleSkillCategory = {
  category: string;
  items: SwymbleSkillItem[];
};

export type SwymbleSocial = {
  id: string;
  name: string;
  link: string;
  icon: LucideIcon;
};

export type SwymbleData = {
  name: string;
  tagline: string;
  marquee: string;
  whatIDo: SwymbleWhatIDo[];
  projects: SwymbleProject[];
  latestUpdates: SwymbleLatestUpdateCard[];
  endCardMobileImage?: string;
  about: SwymbleAbout;
  labs: SwymbleLab[];
  blog: SwymbleBlogState;
  skills: SwymbleSkillCategory[];
  socials: SwymbleSocial[];
};
