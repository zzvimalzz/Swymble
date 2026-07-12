
export const CONFIG = {
    TIMER: {
        UPDATE_INTERVAL: 100,
        SAVE_INTERVAL: 10000,
        CHECK_INTERVAL: 1000
    },

    ANIMATION: {
        MESSAGE_DISPLAY: 2000,
        MESSAGE_FADE: 300,
        NOTIFICATION_DISPLAY: 3000,
        NOTIFICATION_TRANSITION: 500,
        PANEL_TRANSITION: 300
    },

    UI: {
        DRAG_THRESHOLD: 100,
        MOBILE_BREAKPOINT: 768
    },

    STORAGE_KEYS: {
        VISITS: 'paintDryVisits',
        CLICKS: 'paintClicks',
        LONGEST_SESSION: 'longestSession',
        TOTAL_WATCH_TIME: 'totalWatchTime',
        UNLOCKED_ACHIEVEMENTS: 'unlockedAchievements',
        UNLOCKED_PATIENCE_LEVELS: 'unlockedPatienceLevels',
        UNLOCKED_PAINTS: 'unlockedPaints',
        CURRENT_PAINT: 'currentPaint',
        AUDIO_MUTED: 'audioMuted'
    },

    DEFAULT_UNLOCKED_PAINTS: ['default', 'sage', 'sky', 'lavender'],

    DATA_PATHS: {
        MESSAGES: 'assets/data/messages.json',
        ACHIEVEMENTS: 'assets/data/achievements.json',
        PATIENCE_LEVELS: 'assets/data/patience-levels.json'
    },

    FALLBACKS: {
        MESSAGES: [
            "The paint is still wet!",
            "Patience, young grasshopper... the paint needs more time.",
            "Still drying! Go make a coffee",
            "Did you think it would dry faster if you clicked?"
        ],
        PATIENCE_LEVELS: [
            { minMinutes: 0, maxMinutes: 5, emoji: '🎨', title: 'Beginner' },
            { minMinutes: 5, maxMinutes: 15, emoji: '🌟', title: 'Getting There' },
            { minMinutes: 15, maxMinutes: 30, emoji: '⭐', title: 'Dedicated' },
            { minMinutes: 30, maxMinutes: 60, emoji: '💎', title: 'Expert Watcher' },
            { minMinutes: 60, maxMinutes: 999999999, emoji: '🏆', title: 'Paint Master' }
        ]
    }
};

export const PAINTS = [
    { id: 'default', name: 'Classic Pink', color: 'linear-gradient(135deg, #ffd6e8 0%, #ffe5f0 50%, #ffdde7 100%)', locked: false },
    { id: 'sage', name: 'Sage Green', color: 'linear-gradient(135deg, #C9E4CA 0%, #E1F0E1 50%, #C9E4CA 100%)', locked: false },
    { id: 'sky', name: 'Sky Blue', color: 'linear-gradient(135deg, #d6e8ff 0%, #e5f0ff 50%, #dde7ff 100%)', locked: false },
    { id: 'lavender', name: 'Lavender', color: 'linear-gradient(135deg, #e8d6ff 0%, #f0e5ff 50%, #e7ddff 100%)', locked: false },
    { id: 'golden', name: 'Golden Hour', color: 'linear-gradient(135deg, #ffd700 0%, #ffec8b 50%, #ffdf00 100%)', locked: true, code: 'GOLDEN2025' },
    { id: 'midnight', name: 'Midnight', color: 'linear-gradient(135deg, #2c3e50 0%, #3498db 50%, #2c3e50 100%)', locked: true, code: 'NIGHTOWL' },
    { id: 'rainbow', name: 'Prism', color: 'linear-gradient(135deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)', locked: true, code: 'PRISM' }
];

export default CONFIG;
