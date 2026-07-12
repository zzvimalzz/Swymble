import { SWYMBLE_ABOUT } from './about/about';
import { SWYMBLE_TECH_PLANET } from './about/techplanet';
import { SWYMBLE_BLOG } from './blog';
import { SWYMBLE_LATEST_UPDATES } from './home/latestupdates';
import { SWYMBLE_UNIVERSE } from './home/universe';
import { SWYMBLE_WHAT_I_DO } from './home/whatido';
import { SWYMBLE_LABS } from './labs/labs';
import { SWYMBLE_PROJECTS } from './projects/projects';
import { SWYMBLE_BRANDING } from './site/branding';
import { SWYMBLE_SOCIALS } from './site/socials';
import { SWYMBLE_PROCESS } from './studio/process';
import { SWYMBLE_SERVICES } from './studio/services';
import type { SwymbleData } from './types';

export * from './types';

// DATA MAP (where to edit each section)
// - branding: site/branding.ts
// - socials: site/socials.ts
// - home focus cards: home/whatido.ts
// - latest updates: home/latestupdates.ts
// - swymble universe (desktop 3D scene): home/universe.ts
// - studio services: studio/services.ts
// - studio process: studio/process.ts
// - projects: projects/projects.ts
// - about: about/about.ts
// - tech planet (About page stack strip): about/techplanet.ts
// - labs: labs/labs.ts
// - blog: blog/
export const SWYMBLE_DATA: SwymbleData = {
  name: SWYMBLE_BRANDING.name,
  tagline: SWYMBLE_BRANDING.tagline,
  marquee: SWYMBLE_BRANDING.marquee,
  contactIntro: SWYMBLE_BRANDING.contactIntro,
  whatIDo: SWYMBLE_WHAT_I_DO,
  services: SWYMBLE_SERVICES,
  process: SWYMBLE_PROCESS,
  projects: SWYMBLE_PROJECTS,
  latestUpdates: SWYMBLE_LATEST_UPDATES,
  endCardMobileImage: SWYMBLE_BRANDING.endCardMobileImage,
  about: SWYMBLE_ABOUT,
  labs: SWYMBLE_LABS,
  blog: SWYMBLE_BLOG,
  skills: SWYMBLE_TECH_PLANET,
  universe: SWYMBLE_UNIVERSE,
  socials: SWYMBLE_SOCIALS,
};
