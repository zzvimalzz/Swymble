import { Github, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SwymbleService = {
  title: string;
  colorHex: string;
  colorRgb: string;
  desc: string;
};

export type SwymbleWork = {
  title: string;
  category: string;
  client: string | null;
  image: string;
  landingImage?: string;
  description: string;
  link?: string;
  blogLink?: string;
  status?: 'Live' | 'In Development' | 'Pending';
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
  services: SwymbleService[];
  work: SwymbleWork[];
  about: SwymbleAbout;
  blog: SwymbleBlogState;
  skills: SwymbleSkillCategory[];
  socials: SwymbleSocial[];
};

export const SWYMBLE_DATA: SwymbleData = {
  name: "SWYMBLE",
  tagline: "We build digital experiences that elevates your brand.",
  marquee: "SEPERATE YOUR BRAND FROM THE NOISE WITH SWYMBLE",
  services: [
    { title: "STRATEGY", colorHex: "#EFFF04", colorRgb: "239, 255, 4", desc: "Blueprint your success. I analyze market gaps and define a clear, actionable roadmap for your brand's digital presence." },
    { title: "DESIGN", colorHex: "#FF003C", colorRgb: "255, 0, 60", desc: "Visuals that hit hard. Moving beyond templates to craft a unique, high-contrast aesthetic that captures your brand's true edge." },
    { title: "DEVELOP", colorHex: "#00F0FF", colorRgb: "0, 240, 255", desc: "Performance meets physics. I build your custom digital experiences with precision and creativity that brings your vision to life." }
  ],
  work: [
    { 
      title: "IB Solutions", 
      category: "Company Profile", 
      client: "IB Solutions (M)", 
      image: "/ibsolutions_logo.png",
      landingImage: "/ibsolutions_website.png",
      description: "Complete digital transformation for IB Solutions. We rebuilt their company profile from the ground up, focusing on clean aesthetics, responsive layouts, and seamless user navigation.",
      link: "https://ibsolutions.com.my",
      // blogLink: "/blog",
      status: 'Live'
    },
    { 
      title: "CORTEX", 
      category: "ARTIFICIAL INTELLIGENCE", 
      client: null, 
      image: "/cortex_logo.png",
      landingImage: "/cortex_website.png",
      description: "A look into Cortex. A neural memory system that captures, organizes, and understands your thoughts through natural conversation. Cortex is designed to be your second brain, helping you remember and make sense of everything you experience.",
      link: "#",
      // blogLink: "/blog",
      status: 'In Development'
    }
    
  ],
// ==========================================
// ABOUT SECTION DATA
// ==========================================
  about: {
    title: "ABOUT ME",
    paragraphs: [
      "Software engineer with hands-on experience building and supporting fintech and banking systems across multiple enterprise clients — including Maxis, LPPSA, TAIB, and BMMB.",
      "Strong background in backend development, production systems, and regulatory-driven workflows. I have served as Technical Lead for Change Requests, owning the full lifecycle from requirements to production deployment, and have resolved high-priority incidents under strict SLAs.",
      "Outside of enterprise work, I build scalable platforms using modern architectures and AI-assisted development — most notably Cortex, a modular AI-powered cognitive assistant leveraging vector search, graph databases, and multi-provider orchestration."
    ]
  },

// ==========================================
// TECH & TOOLS SECTION DATA
// ==========================================
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
  socials: [
    { id: "gh", name: "GITHUB", link: "https://github.com/zzvimalzz", icon: Github },
    // { id: "wa", name: "WHATSAPP", link: "tel:+1234567890", icon: MessageCircle },
    { id: "em", name: "EMAIL", link: "mailto:hello@swymble.com", icon: Mail },
    // Import a new icon from 'lucide-react' at the top
  ],

// ==========================================
// BLOG SECTION DATA
// ==========================================
  blog: {
    title: "BLOG",
    description: "Read through my thoughts",
    emptyStateMsg: "No posts yet. Check back soon for random thoughts and deep dives into my projects and learnings.",
    posts: [
      // {
      //   id: "introducing-cortex",
      //   title: "Building Cortex: A Neural Memory System",
      //   date: "2026-03-01",
      //   summary: "A deep dive into how we built Cortex to serve as a second brain, leveraging AI to capture and organize thoughts.",
      //   tags: ["AI", "React", "Architecture"],
      //   coverImage: "/cortex_website.png",
      //   content: [
      //     { type: 'heading', text: 'The Origin of Cortex', level: 2 },
      //     { type: 'paragraph', text: 'Cortex started as a simple idea: what if you could talk to your notes? Over the past year, we have been developing a system that understands natural conversation and organizes data dynamically.' },
      //     { type: 'image', src: '/cortex_logo.png', caption: 'The Cortex Logo Concept' },
      //     { type: 'heading', text: 'Technical Challenges', level: 2 },
      //     { type: 'paragraph', text: 'Integrating vector databases with a conversational UI was no easy feat. Here is a small snippet of our indexing logic:' },
      //     { type: 'code', language: 'typescript', code: 'function indexThought(text: string) {\n  const vector = generateEmbedding(text);\n  db.insert(vector);\n}' }
      //   ]
      // }
    ]
  }
};
