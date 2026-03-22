import { Github, Mail, MessageCircleMore } from 'lucide-react';
import type { SwymbleSocial } from './types';

// SOCIAL LINKS SECTION
// - id: unique short key
// - name: label shown in UI
// - link: URL or mailto link
// - icon: Lucide icon component imported above
export const SWYMBLE_SOCIALS: SwymbleSocial[] = [
  { id: 'gh', name: 'GITHUB', link: 'https://github.com/zzvimalzz', icon: Github },
  { id: 'em', name: 'EMAIL', link: 'mailto:hello@swymble.com', icon: Mail },
  { id: 'wa', name: 'WHATSAPP', link: 'https://wa.me/60172358500', icon: MessageCircleMore },

];
