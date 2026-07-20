import { SWYMBLE_ABOUT } from './about/about';
import { SWYMBLE_TECH_STACK } from './about/techstack';
import { SWYMBLE_BLOG } from './blog';
import { SWYMBLE_BRANDING } from './home/branding';
import { SWYMBLE_LATEST_UPDATES } from './home/latestupdates';
import { SWYMBLE_POSITIONING } from './home/positioning';
import { SWYMBLE_PROCESS } from './home/process';
import { SWYMBLE_SERVICES } from './home/services';
import { SWYMBLE_SOCIALS } from './home/socials';
import { SWYMBLE_TECH_STACK_SECTION } from './home/stack';
import { SWYMBLE_UNIVERSE } from './home/universe';
import { SWYMBLE_LABS } from './labs';
import { SWYMBLE_PROJECTS } from './projects/projects';
import type { SwymbleData } from './types';

export * from './types';

// DATA MAP (where to edit each section) — each folder has its own README with templates.
// - branding (name/tagline/marquee, used site-wide): home/branding.ts
// - socials (footer/contact, used site-wide): home/socials.ts
// - positioning (homepage claim + shipped/lab/blog counters): home/positioning.ts
// - tech stack logos + "what I build" list (homepage, after WORK WITH ME): home/stack.ts
// - latest updates: home/latestupdates.ts
// - swymble universe (desktop 3D scene): home/universe.ts
// - studio services (WORK WITH ME): home/services.ts
// - studio process (01-04 steps): home/process.ts
// - projects: projects/projects.ts
// - about: about/about.ts
// - tech stack (About page stack strip): about/techstack.ts
// - labs (one file per lab, named after its id): labs/
// - blog: blog/
export const SWYMBLE_DATA: SwymbleData = {
  name: SWYMBLE_BRANDING.name,
  tagline: SWYMBLE_BRANDING.tagline,
  marquee: SWYMBLE_BRANDING.marquee,
  contactIntro: SWYMBLE_BRANDING.contactIntro,
  positioning: SWYMBLE_POSITIONING,
  techStack: SWYMBLE_TECH_STACK_SECTION,
  services: SWYMBLE_SERVICES,
  process: SWYMBLE_PROCESS,
  projects: SWYMBLE_PROJECTS,
  latestUpdates: SWYMBLE_LATEST_UPDATES,
  endCardMobileImage: SWYMBLE_BRANDING.endCardMobileImage,
  about: SWYMBLE_ABOUT,
  labs: SWYMBLE_LABS,
  blog: SWYMBLE_BLOG,
  skills: SWYMBLE_TECH_STACK,
  universe: SWYMBLE_UNIVERSE,
  socials: SWYMBLE_SOCIALS,
};
