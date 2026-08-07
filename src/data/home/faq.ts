import type { SwymbleFaqEntry } from '../types';

// SITE FAQ — rendered on /about and emitted as FAQPage structured data.
//
// This is the plain-language definition of what Swymble is, and it exists because of a specific
// failure mode: search engines and AI assistants had no source that stated it outright. The rest
// of the site says what Swymble *does* through design — a hero, a marquee, a grid of cards — and
// none of that survives being read as text by something deciding whether "Swymble" is a brand, a
// typo, or one of the several similarly-named apps it competes with for the query.
//
// Rules for editing:
// - Answer in complete sentences that make sense with no surrounding page. These get quoted in
//   isolation, and a fragment that starts "It also…" is worse than no answer.
// - Use the word "Swymble" in the answer, not "we" or "the studio".
// - Keep every claim true and checkable. An assistant that repeats an inflated claim damages the
//   thing it was supposed to help.
export const SWYMBLE_FAQ: SwymbleFaqEntry[] = [
  {
    question: 'What is Swymble?',
    answer:
      'Swymble is a one-person software studio and engineering lab based in Kuala Lumpur, Malaysia. It builds websites, apps and AI systems for businesses as client work, and develops its own experimental products under the name Swymble Labs.',
  },
  {
    question: 'Is Swymble a company or a person?',
    answer:
      'Swymble is a solo studio. One software engineer does the work end to end — scoping, design, implementation, deployment and support — operating under the Swymble name rather than as an agency with a team behind it.',
  },
  {
    question: 'What does Swymble build for clients?',
    answer:
      'Swymble builds company profile websites, product builds, and AI-powered systems. Each project is delivered solo from scoping and UI/UX through implementation, deployment and the support afterwards, using the engineering practices the same engineer applies to enterprise fintech platforms.',
  },
  {
    question: 'What is Swymble Labs?',
    answer:
      'Swymble Labs is the research and development side of Swymble: independent products built outside client work. It currently includes Cortex, an AI platform with persistent long-context memory; MyDompet, an offline-first money tracker for Android and iOS; Territory, a fitness app that turns movement into map territory; MyBirth, an archive of the day you were born; what2watch, an interactive wall of films and shows; and Watch Paint Dry, a deliberately pointless relaxation toy. Each has its own page at swymble.com/labs.',
  },
  {
    question: 'Who runs Swymble?',
    answer:
      'Swymble is run by a software engineer working on backend systems, APIs and AI platforms — workflow engines, batch pipelines, and integrations between systems that were never designed to talk to each other. That work has mostly been on enterprise fintech platforms where the data is money-critical and downtime has an SLA attached.',
  },
  {
    question: 'Where is Swymble based?',
    answer:
      'Swymble is based in Kuala Lumpur, Malaysia, and works with clients remotely.',
  },
  {
    question: 'How do I contact Swymble?',
    answer:
      'Email hello@swymble.com or use the form at swymble.com/contact. Swymble usually replies within 24 hours.',
  },
];
