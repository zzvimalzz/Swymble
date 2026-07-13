import { Bot, Layout, Monitor, Puzzle, Rocket, Smartphone } from 'lucide-react';
import type { SwymbleTechStack } from '../types';

// TECH STACK SECTION (homepage, after "WORK WITH ME")
// - headingLead/headingLines: the big statement — lead renders muted, each line in
//   headingLines renders bold on its own line
// - tools: logo chips (no text under them). To add one:
//     1. Drop the icon file (svg or png, in its real brand color, transparent
//        background) into public/images/stack_icons/
//     2. Add an entry below with icon: '/images/stack_icons/<filename>'
//   Chips show the logo desaturated at rest and reveal its real color on hover —
//   no color field needed here.
// - builds: the "what I build" list on the right, icon + label
export const SWYMBLE_TECH_STACK_SECTION: SwymbleTechStack = {
  headingLead: 'I build stuff',
  headingLines: ['for me', 'and for you.'],
  toolsLabel: 'My tech stack',
  tools: [
    { id: 'typescript', name: 'TypeScript', icon: '/images/stack_icons/typescript.png' },
    { id: 'javascript', name: 'JavaScript', icon: '/images/stack_icons/javascript.png' },
    { id: 'react', name: 'React', icon: '/images/stack_icons/react.png' },
    { id: 'vite', name: 'Vite', icon: '/images/stack_icons/vite.png' },
    { id: 'nodejs', name: 'Node.js', icon: '/images/stack_icons/nodejs.png' },
    { id: 'threejs', name: 'Three.js', icon: '/images/stack_icons/threejs.png' },
    { id: 'php', name: 'PHP', icon: '/images/stack_icons/php.png' },
    { id: 'python', name: 'Python', icon: '/images/stack_icons/python.png' },
    { id: 'postgresql', name: 'PostgreSQL', icon: '/images/stack_icons/postgresql.png' },
    { id: 'mysql', name: 'MySQL', icon: '/images/stack_icons/mysql.png' },
    { id: 'docker', name: 'Docker', icon: '/images/stack_icons/docker.png' },
    { id: 'linux', name: 'Linux', icon: '/images/stack_icons/linux.png' },
    { id: 'github', name: 'GitHub', icon: '/images/stack_icons/github.png' },
    { id: 'claude', name: 'Claude', icon: '/images/stack_icons/claude.png' },
    { id: 'chatgpt', name: 'ChatGPT', icon: '/images/stack_icons/chatgpt.png' },
  ],
  builds: [
    { id: 'web-apps', label: 'Web Applications', icon: Monitor },
    { id: 'browser-extensions', label: 'Browser Extensions', icon: Puzzle },
    { id: 'startup-mvps', label: 'Startup MVPs', icon: Rocket },
    { id: 'landing-pages', label: 'Landing Pages', icon: Layout },
    { id: 'mobile-apps', label: 'Mobile Apps', icon: Smartphone },
    { id: 'ai-automation', label: 'AI Automation', icon: Bot },
  ],
};
