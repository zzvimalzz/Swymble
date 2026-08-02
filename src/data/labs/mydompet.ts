import type { SwymbleLab } from '../types';

const lab: SwymbleLab = {
  id: 'mydompet',
  title: 'MYDOMPET',
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
};

export default lab;
