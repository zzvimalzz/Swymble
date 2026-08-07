import type { SwymbleLab } from '../types';

const lab: SwymbleLab = {
  id: 'mydompet',
  title: 'MYDOMPET',
  seoName: 'MyDompet',
  category: 'PERSONAL FINANCE',
  categoryColor: '#3498db',
  image: '/images/labs/mydompet_logo.png',
  status: 'In Development',
  visibility: 'teaser',
  publicSummary:
    'An offline-first money tracker for Android and iOS. Every transaction lives in SQLite on your own phone, there is no account server, and signing in is just picking a local profile.',
  safeHighlights: [
    'Fully on-device: SQLite storage, no cloud backend, works the same with Wi-Fi off',
    'Passwordless local profiles, with the session key held in the OS keychain',
    'Split Bill routes end-to-end encrypted packets through a relay that never sees an amount',
  ],
  tags: ['React Native', 'Expo', 'Offline First', 'E2E Encrypted'],
  updatedAt: 'Aug 2026',
  order: 25,
  detail: {
    oneLiner:
      'MyDompet is an offline-first money tracker for Android and iOS that keeps every transaction in SQLite on your own phone, with no account server.',
    tagline: 'Offline-First Money Tracker',
    overview: [
      'MyDompet is a personal finance app built by Swymble Labs around a single constraint: your spending data never leaves your phone. Every transaction is written to a SQLite database on the device itself. There is no account server behind the app, nothing to sign up for, and no copy of your ledger sitting in someone else’s database.',
      'That constraint shapes the whole product. Signing in is just picking a local profile — no password, no email, no verification step — and the key for that session is held in the operating system’s own keychain rather than in app storage. With Wi-Fi off, the app behaves exactly the same as with it on, because there was never a network round trip in the critical path to begin with.',
      'The one feature that does cross devices, Split Bill, is built to preserve the same guarantee. Rather than uploading a shared ledger, it routes end-to-end encrypted packets through a relay that never sees an amount — the relay moves ciphertext between phones and has nothing useful to leak.',
      'MyDompet is in development, built with React Native and Expo.',
    ],
    features: [
      {
        title: 'Local-only ledger',
        body: 'Transactions live in SQLite on the device. No cloud backend, no sync service, and no account to create.',
      },
      {
        title: 'Passwordless local profiles',
        body: 'Signing in means choosing a profile on the phone. The session key is held in the OS keychain instead of app storage.',
      },
      {
        title: 'Works offline by default',
        body: 'The app behaves identically with the network off, because nothing in the core flow depends on a server.',
      },
      {
        title: 'End-to-end encrypted Split Bill',
        body: 'Shared bills move between phones as encrypted packets through a relay that never sees an amount.',
      },
    ],
    specs: [
      { label: 'Platforms', value: 'Android, iOS' },
      { label: 'Built with', value: 'React Native, Expo, SQLite' },
      { label: 'Data storage', value: 'On-device only — no backend' },
      { label: 'Status', value: 'In development' },
    ],
    faq: [
      {
        question: 'What is MyDompet?',
        answer:
          'MyDompet is an offline-first personal finance and money tracking app for Android and iOS, built by Swymble Labs. It stores every transaction in a SQLite database on your own phone rather than on a server.',
      },
      {
        question: 'Does MyDompet need an account or an internet connection?',
        answer:
          'No. There is no account server, so there is nothing to register for. Signing in means selecting a local profile on the device, and the app works the same way with the network switched off.',
      },
      {
        question: 'How does MyDompet handle shared bills if there is no server?',
        answer:
          'Split Bill sends end-to-end encrypted packets between phones through a relay. The relay only forwards ciphertext and never sees a transaction amount.',
      },
    ],
  },
};

export default lab;
