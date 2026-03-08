import type { SwymbleProject } from './types';

// PROJECTS SECTION
// Required fields:
// - title, category, client, image, description
// Optional fields:
// - landingImage/mobileImage: alternate visuals for route/device contexts
// - link: external website URL
// - blogLink: optional route to a project blog article (for future use)
// - status: 'Live' | 'In Development' | 'Pending'
export const SWYMBLE_PROJECTS: SwymbleProject[] = [
  {
    title: 'IB Solutions',
    category: 'Company Profile',
    client: 'IB Solutions (M)',
    image: '/ibsolutions_logo.png',
    landingImage: '/ibsolutions_website.png',
    mobileImage: '/ibsolutions_website.png',
    description:
      'Complete digital transformation for IB Solutions. We rebuilt their company profile from the ground up, focusing on clean aesthetics, responsive layouts, and seamless user navigation.',
    link: 'https://ibsolutions.com.my',
    status: 'Live',
  },
];
