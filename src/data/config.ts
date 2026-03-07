import { Github, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ==========================================
// TYPES (Don't modify these unless adding new fields)
// ==========================================

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
  blogLink?: string;
  primaryAction?: SwymbleLabAction;
};

export type SwymbleAbout = {
  title: string;
  paragraphs: string[]; 
};

export type SwymbleBlogContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; caption?: string }
  | { type: 'heading'; text: string; level?: 2 | 3 | 4 }
  | { type: 'code'; code: string; language: string };

export type SwymbleBlogPost = {
  id: string;  
  title: string;
  date: string; 
  summary: string;
  tags: string[]; 
  coverImage?: string;             
  content: SwymbleBlogContentBlock[]; 
};

export type SwymbleBlogState = {
  title: string;
  description: string;
  emptyStateMsg: string;  
  posts: SwymbleBlogPost[];
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
  endCardMobileImage?: string;  
  about: SwymbleAbout;
  labs: SwymbleLab[];
  blog: SwymbleBlogState;
  skills: SwymbleSkillCategory[];
  socials: SwymbleSocial[];
};

// ==========================================
// MY DATA (Edit everything below this line!)
// ==========================================

export const SWYMBLE_DATA: SwymbleData = {
  // BRANDING & HERO
  name: "SWYMBLE",
  tagline: "We build digital experiences that elevates your brand.",
  marquee: "SEPERATE YOUR BRAND FROM THE NOISE WITH SWYMBLE",

  // 'WHAT I DO' SECTION
  // Edit the titles, colors (required for gradient fx), and descriptions here
  whatIDo: [
    { title: "STRATEGY", colorHex: "#EFFF04", colorRgb: "239, 255, 4", desc: "Blueprint your success. I analyze market gaps and define a clear, actionable roadmap for your brand's digital presence." },
    { title: "DESIGN", colorHex: "#FF003C", colorRgb: "255, 0, 60", desc: "Visuals that hit hard. Moving beyond templates to craft a unique, high-contrast aesthetic that captures your brand's true edge." },
    { title: "DEVELOP", colorHex: "#00F0FF", colorRgb: "0, 240, 255", desc: "Performance meets physics. I build your custom digital experiences with precision and creativity that brings your vision to life." }
  ],

  // END CARD
  // The image shown on mobile when a user swipes through all projects
  endCardMobileImage: '/white-logo.png',

  // PROJECTS LIST
  projects: [
    { 
      title: "IB Solutions", 
      category: "Company Profile", 
      client: "IB Solutions (M)", 
      image: "/ibsolutions_logo.png",
      landingImage: "/ibsolutions_website.png",
      mobileImage: "/ibsolutions_website.png", // Using the landingImage for tall layout
      description: "Complete digital transformation for IB Solutions. We rebuilt their company profile from the ground up, focusing on clean aesthetics, responsive layouts, and seamless user navigation.",
      link: "https://ibsolutions.com.my",
      status: 'Live'
    },
    // Cortex moved to Labs
  ],

  // LABS - IN PROGRESS EXPERIMENTS
  // NOTES:
  // 1) Keep Labs copy public-safe: avoid architecture internals, prompts, infra details, secrets.
  // 2) Use visibility='private' for entries you do not want rendered publicly.
  // 3) Card has a single optional button via `primaryAction`:
  //    - kind: 'internal' -> route path like /blog/slug
  //    - kind: 'external' -> full URL opened in a new tab
  //    - kind: 'mailto'   -> email CTA with prefilled subject
  // 4) Optional `blogLink` lets you attach a blog post route to the card.
  //    If both `primaryAction` and `blogLink` are provided, BOTH buttons are shown.
  //    - primaryAction = main button (e.g. "VISIT LIVE", "JOIN WAITLIST", "REQUEST DEMO")
  //    - blogLink      = secondary "READ BLOG" button
  // 5) You can add as many labs as you want. Keep id values unique.
  labs: [
    // FULL TEMPLATE EXAMPLE (copy this block and edit values):
    // {
    //   id: "your-lab-id",
    //   title: "PROJECT NAME",
    //   category: "AI PLATFORM",
    //   image: "/white-logo.png",
    //   status: 'In Development', // allowed: 'In Development' | 'Private Beta' | 'Live'
    //   visibility: 'teaser', // allowed: 'public' | 'teaser' | 'private'
    //   publicSummary: "One-line non-sensitive summary of your lab.",
    //   safeHighlights: [
    //     "Public-safe capability or progress point",
    //     "Another public-safe highlight",
    //     "Optional third highlight"
    //   ],
    //   tags: ["AI", "R&D", "Security"],
    //   updatedAt: "Apr 2026",
    //   blogLink: "/blog/your-post-id", // optional
    //   primaryAction: {
    //     label: "VISIT LIVE PREVIEW",
    //     href: "https://example.com",
    //     kind: "external" // allowed: "internal" | "external" | "mailto"
    //   }
    // },
    { 
      id: "cortex",
      title: "CORTEX", 
      category: "ARTIFICIAL INTELLIGENCE", 
      image: "/cortex_logo.png",
      status: 'In Development',
      visibility: 'teaser',
      publicSummary: "A proprietary cognitive platform focused on long-context memory and operator decision support for complex digital workflows.",
      safeHighlights: [
        "Private architecture under active R&D",
        "Operator-first UX experiments",
        "Controlled pilot evaluations in progress"
      ],
      tags: ["AI", "R&D", "Private"],
      updatedAt: "Mar 2026",
      primaryAction: {
        label: "REQUEST PRIVATE DEMO",
        href: "mailto:hello@swymble.com?subject=CORTEX%20Private%20Demo",
        kind: "mailto"
      }
    },
    { 
      id: "alias-vault",
      title: "ALIAS VAULT", 
      category: "PRIVACY TOOL", 
      image: "/white-logo.png",
      status: 'Private Beta',
      visibility: 'teaser',
      publicSummary: "A privacy-first alias management concept designed to reduce personal email exposure across signups and transactional workflows.",
      safeHighlights: [
        "Disposable identity workflows",
        "Admin and abuse-control policy layer",
        "Private usability validation"
      ],
      tags: ["Privacy", "Security", "Beta"],
      updatedAt: "Mar 2026",
      primaryAction: {
        label: "JOIN BETA WAITLIST",
        href: "mailto:hello@swymble.com?subject=Alias%20Vault%20Beta%20Waitlist",
        kind: "mailto"
      }
    }
  ],

  // ABOUT SECTION
  about: {
    title: "ABOUT ME",
    paragraphs: [
      "I'm a Software engineer with hands-on experience building and supporting fintech and banking systems across multiple enterprise clients from banking sectors to the telco industry.",
      "Strong background in backend development, production systems, and regulatory-driven workflows. I have served as Technical Lead for Change Requests, owning the full lifecycle from requirements to production deployment, and have resolved high-priority incidents under strict SLAs.",
      "Outside of enterprise work, I build scalable platforms using modern architectures and AI-assisted development, including Cortex, a proprietary cognitive system currently in private R&D."
    ]
  },

  // SKILLS & TECH
  skills: [
    {
      category: "LANGUAGES",
      items: [
        { name: "PHP", color: "#777BB4", level: 80 },
        { name: "Python", color: "#3776AB", level: 60 },
        { name: "HTML/CSS", color: "#E34F26", level: 45 },
        { name: "PL/SQL", color: "#F29111", level: 60 },
        { name: "JavaScript", color: "#F7DF1E", level: 55 },
        { name: "TypeScript", color: "#3178C6", level: 45 },
      ]
    },
    {
      category: "Backend & APIs",
      items: [
        { name: "REST APIs", color: "#0096D6", level: 70 },
        { name: "Batch Jobs", color: "#A8B9CC", level: 65 },
        { name: "Workflow Logic", color: "#10A54A", level: 75 }
      ]
    },
    {
      category: "Databases & DevOps",
      items: [
        { name: "PostgreSQL", color: "#336791", level: 55 },
        { name: "MySQL", color: "#4479A1", level: 40 },
        { name: "Neo4j", color: "#018BFF", level: 45 },
        { name: "Docker", color: "#2496ED", level: 55 },
        { name: "CI/CD Pipelines", color: "#F05032", level: 60 },
        { name: "Linux", color: "#FCC624", level: 40 }
      ]
    },
    {
      category: "AI & Data",
      items: [
        { name: "Retrieval-Augmented Generation (RAG)", color: "#FF6A00", level: 65 },
        { name: "Vector & Graph Search", color: "#00B4AB", level: 60 },
        { name: "Multi-Agent Orchestration", color: "#9B59B6", level: 55 },
        { name: "Claude Code", color: "#D19A66", level: 45 },
        { name: "ChatGPT Codex", color: "#10A37F", level: 45 },
      ]
    },
    {
      category: "Domains",
      items: [
        { name: "Fintech & Banking Systems", color: "#1E3A8A", level: 85 },
        { name: "Loan Origination", color: "#16A34A", level: 80 },
        { name: "Production Support", color: "#DC2626", level: 80 },
        { name: "AI Automation Systems", color: "#7C3AED", level: 65 }
      ]
    }
  ],

  // SOCIAL LINKS
  socials: [
    { id: "gh", name: "GITHUB", link: "https://github.com/zzvimalzz", icon: Github },
    { id: "em", name: "EMAIL", link: "mailto:hello@swymble.com", icon: Mail },
  ],

  // BLOG ENGINE
  blog: {
    title: "BLOG",
    description: "Read through my thoughts",
    emptyStateMsg: "No posts yet. Check back soon for random thoughts and deep dives into my projects and learnings.",
    
    // EXAMPLES OF HOW TO ADD POSTS: Uncomment the block below to activate a post.
    posts: [
      /*
      {
        id: "introducing-cortex",
        title: "Building Cortex: A Neural Memory System",
        date: "2026-03-01",
        summary: "A deep dive into how we built Cortex...",
        tags: ["AI", "React", "Architecture"],
        coverImage: "/cortex_website.png",
        
        // Use 'content' blocks to structure your blog:
        content: [
          { type: 'heading', text: 'The Origin of Cortex', level: 2 },
          { type: 'paragraph', text: 'Cortex started as a simple idea...' },
          { type: 'image', src: '/cortex_logo.png', caption: 'The Concept' },
          { type: 'code', language: 'typescript', code: 'console.log("Hello AI");' }
        ]
      }
      */
    ]
  }
};
