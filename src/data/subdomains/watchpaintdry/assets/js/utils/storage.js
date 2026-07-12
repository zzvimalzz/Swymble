
import { CONFIG } from '../config.js';

const { STORAGE_KEYS } = CONFIG;

const safeParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

export const Storage = {
    getVisits: () => parseInt(localStorage.getItem(STORAGE_KEYS.VISITS) || '0'),
    setVisits: (count) => localStorage.setItem(STORAGE_KEYS.VISITS, count.toString()),
    incrementVisits: () => {
        const visits = Storage.getVisits() + 1;
        Storage.setVisits(visits);
        return visits;
    },

    getClicks: () => parseInt(localStorage.getItem(STORAGE_KEYS.CLICKS) || '0'),
    setClicks: (count) => localStorage.setItem(STORAGE_KEYS.CLICKS, count.toString()),
    incrementClicks: () => {
        const clicks = Storage.getClicks() + 1;
        Storage.setClicks(clicks);
        return clicks;
    },

    getLongestSession: () => parseInt(localStorage.getItem(STORAGE_KEYS.LONGEST_SESSION) || '0'),
    setLongestSession: (time) => localStorage.setItem(STORAGE_KEYS.LONGEST_SESSION, time.toString()),
    updateLongestSession: (elapsed) => {
        const longest = Storage.getLongestSession();
        if (elapsed > longest) {
            Storage.setLongestSession(elapsed);
            return elapsed;
        }
        return longest;
    },

    getTotalWatchTime: () => parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_WATCH_TIME) || '0'),
    setTotalWatchTime: (time) => localStorage.setItem(STORAGE_KEYS.TOTAL_WATCH_TIME, time.toString()),
    addWatchTime: (elapsed) => {
        const total = Storage.getTotalWatchTime() + elapsed;
        Storage.setTotalWatchTime(total);
        return total;
    },

    getUnlockedAchievements: () => safeParse(
        localStorage.getItem(STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS), 
        []
    ),
    setUnlockedAchievements: (achievements) => localStorage.setItem(
        STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS, 
        JSON.stringify(achievements)
    ),
    addUnlockedAchievement: (achievementId) => {
        const unlocked = Storage.getUnlockedAchievements();
        if (!unlocked.includes(achievementId)) {
            unlocked.push(achievementId);
            Storage.setUnlockedAchievements(unlocked);
        }
        return unlocked;
    },

    getUnlockedPatienceLevels: () => safeParse(
        localStorage.getItem(STORAGE_KEYS.UNLOCKED_PATIENCE_LEVELS), 
        []
    ),
    setUnlockedPatienceLevels: (levels) => localStorage.setItem(
        STORAGE_KEYS.UNLOCKED_PATIENCE_LEVELS, 
        JSON.stringify(levels)
    ),
    addUnlockedPatienceLevel: (levelKey) => {
        const unlocked = Storage.getUnlockedPatienceLevels();
        if (!unlocked.includes(levelKey)) {
            unlocked.push(levelKey);
            Storage.setUnlockedPatienceLevels(unlocked);
        }
        return unlocked;
    },

    getUnlockedPaints: () => safeParse(
        localStorage.getItem(STORAGE_KEYS.UNLOCKED_PAINTS), 
        CONFIG.DEFAULT_UNLOCKED_PAINTS
    ),
    setUnlockedPaints: (paints) => localStorage.setItem(
        STORAGE_KEYS.UNLOCKED_PAINTS, 
        JSON.stringify(paints)
    ),
    addUnlockedPaint: (paintId) => {
        const unlocked = Storage.getUnlockedPaints();
        if (!unlocked.includes(paintId)) {
            unlocked.push(paintId);
            Storage.setUnlockedPaints(unlocked);
        }
        return unlocked;
    },

    getCurrentPaint: () => localStorage.getItem(STORAGE_KEYS.CURRENT_PAINT) || 'default',
    setCurrentPaint: (paintId) => localStorage.setItem(STORAGE_KEYS.CURRENT_PAINT, paintId),

    isAudioMuted: () => localStorage.getItem(STORAGE_KEYS.AUDIO_MUTED) === 'true',
    setAudioMuted: (muted) => localStorage.setItem(STORAGE_KEYS.AUDIO_MUTED, muted.toString())
};

export default Storage;
