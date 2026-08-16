import type { SwymbleLab } from '../types';
import { createSubdomainUrl } from '../../utils/siteUrls';

const lab: SwymbleLab = {
  id: 'oglets',
  title: 'OGLETS',
  seoName: 'Oglets',
  category: 'BROWSER CREATURE',
  categoryColor: '#c79bff',
  image: '/images/labs/oglets_logo.svg',
  status: 'Live',
  visibility: 'public',
  publicSummary:
    'A small creature made mostly of eyes, drawn from a weighted genome. You are given one the first time you open the page, it lives in your browser, and it watches you.',
  safeHighlights: [
    'One Oglet per browser, rolled on first visit and never rerolled',
    'Expressions caused by drives — held, greeted, ignored — never picked at random',
    'A nine-character code that writes the whole creature down, and a genome page that reads it back',
  ],
  tags: ['Toy', 'Canvas', 'Public'],
  updatedAt: 'Aug 2026',
  order: 45,
  detail: {
    oneLiner:
      'Oglets is a free browser toy: a small creature made mostly of eyes, drawn from a weighted genome, that lives in your browser and watches you.',
    tagline: 'A Creature Made Of Eyes',
    overview: [
      'An Oglet is a pair of eyes with a soul bolted on. There is no body, no limbs and no mouth — the eye is the whole face, and the expression lives in the geometry of the lids rather than in a set of swapped pictures. The upper lid\'s inner and outer edges move independently, so an Oglet can be a little sad or very sad, and can be interrupted halfway into either.',
      'You are given exactly one, rolled the first time you open the page and kept in your browser afterwards. There is deliberately no reroll button: being able to replace it on a whim is what would stop it mattering. Drag it, or tap it once to say hello. Leave it alone and it entertains itself — it tracks a speck only it can see, daydreams, or goes to check the last place your cursor was — and then naps. Come back and it greets you.',
      'Nothing it feels is arbitrary. Every expression is traced to a drive: it is happy when you hold it or when you return, cross when it is mashed, and sad only when you are on the page and not coming near. An Oglet by itself is perfectly content by itself.',
      'The genome page shows the alleles that made it — eye shape, pupil, palette and finish — each rendered as a live thumbnail with its real weight. Rarity is not a lookup table: a trait is rare because its allele is rare, which is what makes the same weights usable for inheritance later.',
      'Everything runs client-side on one canvas. There are no accounts, no network calls and no tracking; the only thing stored is your Oglet\'s nine-character code, in your browser.',
    ],
    features: [
      {
        title: 'One creature, kept in your browser',
        body: 'Rolled on first visit, stored as a nine-character code, and the same one every time you come back. No account, and no way to reroll it.',
      },
      {
        title: 'Emotion as geometry',
        body: 'Lids, gaze and blinks are simulated rather than animated, so expressions blend, overlap and get interrupted the way a real face does.',
      },
      {
        title: 'Feelings with reasons',
        body: 'Bond, cheer, annoyance and loneliness drive every expression. Sadness only ever comes from being ignored while you are on the page.',
      },
      {
        title: 'A genome you can read',
        body: 'Four genes and 576 categorical combinations, each allele shown as a live drawing with its true weight and rarity tier.',
      },
    ],
    specs: [
      { label: 'Where', value: 'oglets.swymble.com' },
      { label: 'Price', value: 'Free, no account needed' },
      { label: 'Data storage', value: 'Local browser storage only' },
      { label: 'Built with', value: 'One canvas, plain ES modules, no dependencies' },
      { label: 'Status', value: 'Live' },
    ],
    faq: [
      {
        question: 'What is Oglets?',
        answer:
          'Oglets is a free browser toy by Swymble Labs. An Oglet is a small creature made mostly of eyes, drawn from a weighted genome. You are given one the first time you open the page, it is kept in your browser, and it watches your cursor, reacts to being held or ignored, and sleeps when you are away.',
      },
      {
        question: 'Where can I get an Oglet?',
        answer:
          'Oglets is live at https://oglets.swymble.com. It runs in the browser with no account and no download, and your Oglet is created automatically the first time you open it.',
      },
      {
        question: 'Can I get a different Oglet?',
        answer:
          'No, and that is deliberate. You get one Oglet, rolled on your first visit and stored in your browser. Being able to reroll it on a whim is exactly what would stop it mattering.',
      },
      {
        question: 'Does Oglets collect any data?',
        answer:
          'No. Oglets runs entirely client-side with no accounts, no network calls and no tracking. The only thing stored is your Oglet\'s nine-character code in your own browser\'s local storage.',
      },
    ],
  },
  actions: [
    {
      label: 'OPEN OGLETS',
      href: createSubdomainUrl('oglets'),
      kind: 'external',
    },
  ],
};

export default lab;
