import { Github, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ==========================================
// TYPES (Don't modify these unless adding new fields)
// ==========================================

export type SwymbleWhatIDo = {
  title: string;
  colorHex: string; // Used for accent colors (e.g. #FF003C)
  colorRgb: string; // Used for glowing shadows (e.g. 255, 0, 60)
  desc: string;
};

export type SwymbleProject = {
  title: string;
  category: string;
  client: string | null;           // Who did you build this for? null if personal.
  image: string;                   // Main desktop thumbnail (e.g. /ibsolutions_logo.png)
  landingImage?: string;           // Optional secondary image
  mobileImage?: string;            // The vertical image shown on the Mobile swipe cards
  description: string;
  link?: string;                   // External link to live site or repo
  blogLink?: string;               // Optional link to your blog post discussing this project 
  status?: 'Live' | 'In Development' | 'Pending'; 
};

export type SwymbleAbout = {
  title: string;
  paragraphs: string[];            // Each string is a new paragraph block
};

export type SwymbleBlogContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; caption?: string }
  | { type: 'heading'; text: string; level?: 2 | 3 | 4 }
  | { type: 'code'; code: string; language: string };

export type SwymbleBlogPost = {
  id: string;                      // URL slug (e.g. "introducing-cortex")
  title: string;
  date: string;                    // e.g. "YYYY-MM-DD"
  summary: string;
  tags: string[];                  // e.g. ["AI", "React"]
  coverImage?: string;             
  content: SwymbleBlogContentBlock[]; // The body of the blog post built with blocks
};

export type SwymbleBlogState = {
  title: string;
  description: string;
  emptyStateMsg: string;           // Fallback text when there are no posts yet
  posts: SwymbleBlogPost[];
};

export type SwymbleSkillItem = {
  name: string;
  color: string;                   // e.g. "#777BB4"
  level: number;                   // 1 to 100 for the progress bar
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
  marquee: string;                 // The fast moving banner text
  whatIDo: SwymbleWhatIDo[];       // Mobile 'WHAT I DO' / Desktop 'Strategy/Design/Develop'
  projects: SwymbleProject[];      // The Tinder deck projects / Desktop Work Carousel
  endCardMobileImage?: string;     // The fallback card when swiping is done
  about: SwymbleAbout;
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
  endCardMobileImage: '/white-logo.png', // <-- Change end card image here 

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
    { 
      title: "CORTEX", 
      category: "ARTIFICIAL INTELLIGENCE", 
      client: null, 
      image: "/cortex_logo.png",
      landingImage: "/cortex_website.png",
      mobileImage: "/cortex_logo.png",
      description: "A look into Cortex. A neural memory system that captures, organizes, and understands your thoughts through natural conversation. Cortex is designed to be your second brain, helping you remember and make sense of everything you experience.",
      link: "#",
      status: 'In Development'
    }
  ],

  // ABOUT SECTION
  about: {
    title: "ABOUT ME",
    paragraphs: [
      "I'm a Software engineer with hands-on experience building and supporting fintech and banking systems across multiple enterprise clients from banking sectors to the telco industry.",
      "Strong background in backend development, production systems, and regulatory-driven workflows. I have served as Technical Lead for Change Requests, owning the full lifecycle from requirements to production deployment, and have resolved high-priority incidents under strict SLAs.",
      "Outside of enterprise work, I build scalable platforms using modern architectures and AI-assisted development and most notably Cortex, a modular AI-powered cognitive assistant leveraging vector search, graph databases, and multi-provider orchestration."
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
