import { SWYMBLE_ABOUT } from './about';
import { SWYMBLE_BLOG } from './blog';
import { SWYMBLE_BRANDING } from './branding';
import { SWYMBLE_LABS } from './labs';
import { SWYMBLE_LATEST_UPDATES } from './latestupdates';
import { SWYMBLE_PROJECTS } from './projects';
import { SWYMBLE_SOCIALS } from './socials';
import { SWYMBLE_TECH_TOOLS } from './techtools';
import { SWYMBLE_WHAT_I_DO } from './whatido';
import type { SwymbleData } from './types';

export * from './types';

// DATA MAP (where to edit each section)
// - branding: branding.ts
// - what I do: whatido.ts
// - projects: projects.ts
// - latest updates: latestupdates.ts
// - about: about.ts
// - labs: labs.ts
// - blog: blog/
// - tech/tools: techtools.ts
// - socials: socials.ts
export const SWYMBLE_DATA: SwymbleData = {
  name: SWYMBLE_BRANDING.name,
  tagline: SWYMBLE_BRANDING.tagline,
  marquee: SWYMBLE_BRANDING.marquee,
  whatIDo: SWYMBLE_WHAT_I_DO,
  projects: SWYMBLE_PROJECTS,
  latestUpdates: SWYMBLE_LATEST_UPDATES,
  endCardMobileImage: SWYMBLE_BRANDING.endCardMobileImage,
  about: SWYMBLE_ABOUT,
  labs: SWYMBLE_LABS,
  blog: SWYMBLE_BLOG,
  skills: SWYMBLE_TECH_TOOLS,
  socials: SWYMBLE_SOCIALS,
};
