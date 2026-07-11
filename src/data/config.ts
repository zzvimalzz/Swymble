import { SWYMBLE_ABOUT } from './about';
import { SWYMBLE_BLOG } from './blog';
import { SWYMBLE_BRANDING } from './branding';
import { SWYMBLE_LABS } from './labs';
import { SWYMBLE_LATEST_UPDATES } from './latestupdates';
import { SWYMBLE_PROCESS } from './process';
import { SWYMBLE_PROJECTS } from './projects';
import { SWYMBLE_SERVICES } from './services';
import { SWYMBLE_SOCIALS } from './socials';
import { SWYMBLE_TECH_PLANET } from './techplanet';
import { SWYMBLE_UNIVERSE } from './universe';
import { SWYMBLE_WHAT_I_DO } from './whatido';
import type { SwymbleData } from './types';

export * from './types';

// DATA MAP (where to edit each section)
// - branding: branding.ts
// - home focus cards: whatido.ts
// - studio services: services.ts
// - studio process: process.ts
// - projects: projects.ts
// - latest updates: latestupdates.ts
// - about: about.ts
// - labs: labs.ts
// - blog: blog/
// - tech planet (About page stack strip): techplanet.ts
// - swymble universe (desktop 3D scene): universe.ts
// - socials: socials.ts
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
