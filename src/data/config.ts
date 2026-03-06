import { Github, Instagram, MessageCircle, Mail } from 'lucide-react';

export const SWYMBLE_DATA = {
  name: "SWYMBLE",
  tagline: "I BUILD DIGITAL EXPERIENCES THAT REFUSE TO BLEND IN.",
  marquee: "SWYMBLE - SWYMBLE - SWYMBLE - SWYMBLE - SWYMBLE - SWYMBLE - SWYMBLE - SWYMBLE - ",
  services: [
    { title: "STRATEGY", colorHex: "#EFFF04", colorRgb: "239, 255, 4", desc: "Blueprint your success. I analyze market gaps and define a clear, actionable roadmap for your brand's digital presence." },
    { title: "DESIGN", colorHex: "#FF003C", colorRgb: "255, 0, 60", desc: "Visuals that hit hard. Moving beyond templates to craft a unique, high-contrast aesthetic that captures your brand's true edge." },
    { title: "CREATIVE DEV", colorHex: "#00F0FF", colorRgb: "0, 240, 255", desc: "Performance meets physics. I build lightning-fast, custom-coded experiences with fluid animations and responsive interactions." }
  ],
  work: [
    { title: "AURORA", category: "BRAND & WEB", client: "Aurora Sports", image: "https://images.unsplash.com/photo-1481481303964-b52bef1d26fa?q=80&w=1200&auto=format&fit=crop" },
    { title: "VANGUARD", category: "MEMBERSHIP PLATFORM", client: "Vanguard Inc", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop" },
    { title: "ELEVATE", category: "CONSULTING SITE", client: null, image: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=1200&auto=format&fit=crop" },
    { title: "NEXUS", category: "E-COMMERCE", client: "Nexus Retail", image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop" }
  ],
  skills: [
    {
      category: "LANGUAGES",
      items: [
        { name: "TypeScript", color: "#3178c6", level: 50 },
        { name: "Python", color: "#3572A5", level: 30 },
        { name: "HTML/CSS", color: "#e34c26", level: 20 },
      ]
    },
    {
      category: "FRAMEWORKS",
      items: [
        { name: "React", color: "#61dafb", level: 40 },
        { name: "Next.js", color: "#ffffff", level: 30 },
        { name: "Node.js", color: "#339933", level: 20 },
        { name: "Tailwind", color: "#38b2ac", level: 10 }
      ]
    },
    {
      category: "TOOLS & OS",
      items: [
        { name: "Git", color: "#f14e32", level: 35 },
        { name: "Docker", color: "#2496ed", level: 30 },
        { name: "AWS", color: "#ff9900", level: 20 },
        { name: "Linux", color: "#fcc624", level: 15 }
      ]
    },
    {
      category: "EDITING",
      items: [
        { name: "Premiere Pro", color: "#9999ff", level: 45 },
        { name: "After Effects", color: "#e34c26", level: 35 },
        { name: "DaVinci", color: "#faaaaa", level: 25 },
      ]
    }
  ],
  socials: [
    { id: "gh", name: "GITHUB", link: "https://github.com", icon: Github },
    { id: "ig", name: "INSTAGRAM", link: "https://instagram.com", icon: Instagram },
    { id: "wa", name: "WHATSAPP", link: "https://whatsapp.com", icon: MessageCircle },
    { id: "em", name: "EMAIL", link: "mailto:hello@example.com", icon: Mail },
    // You can easily add more below; just import a new icon from 'lucide-react' at the top:
    // { id: "yt", name: "YOUTUBE", link: "https://youtube.com", icon: Video },
  ]
};
