
import { CONFIG } from '../config.js';
import { Storage } from '../utils/storage.js';
import { safeFetch } from '../utils/helpers.js';
import { Notifications } from './notifications.js';

class PatienceLevelsManager {
    constructor() {
        this.levels = [];
        this.unlockedLevels = [];
        this.container = null;
        this.isLoaded = false;
    }

    async init(containerId = 'patienceLevelsDrawer') {
        this.container = document.getElementById(containerId);
        this.unlockedLevels = Storage.getUnlockedPatienceLevels();
        
        await this.loadLevels();
        this.render();
    }

    async loadLevels() {
        this.levels = await safeFetch(
            CONFIG.DATA_PATHS.PATIENCE_LEVELS, 
            CONFIG.FALLBACKS.PATIENCE_LEVELS
        );
        this.isLoaded = true;
    }

    getLevelKey(level) {
        return `${level.minMinutes}-${level.maxMinutes}`;
    }

    check(sessionMinutes) {
        if (!this.isLoaded || this.levels.length === 0) return [];

        const newlyUnlocked = [];
        let currentLevel = null;

        for (const level of this.levels) {
            if (sessionMinutes >= level.minMinutes && sessionMinutes < level.maxMinutes) {
                currentLevel = level;
                break;
            }
        }

        if (!currentLevel) return [];

        this.levels.forEach(level => {
            const key = this.getLevelKey(level);
            if (level.minMinutes <= currentLevel.minMinutes && !this.unlockedLevels.includes(key)) {
                this.unlockedLevels.push(key);
                newlyUnlocked.push(level);
            }
        });

        if (newlyUnlocked.length > 0) {
            Storage.setUnlockedPatienceLevels(this.unlockedLevels);
            this.render();

            newlyUnlocked.forEach(level => {
                Notifications.show(
                    level.emoji,
                    'Patience Level Unlocked!',
                    level.title
                );
            });
        }

        return newlyUnlocked;
    }

    getCurrentLevel(sessionMinutes) {
        for (const level of this.levels) {
            if (sessionMinutes >= level.minMinutes && sessionMinutes < level.maxMinutes) {
                return level;
            }
        }
        return this.levels[0] || null;
    }

    getCurrentLevelFormatted(sessionMinutes) {
        const level = this.getCurrentLevel(sessionMinutes);
        return level ? `${level.emoji} ${level.title}` : '🎨 Beginner';
    }

    isUnlocked(level) {
        return this.unlockedLevels.includes(this.getLevelKey(level));
    }

    getAll() {
        return this.levels;
    }

    render() {
        if (!this.container || this.levels.length === 0) return;

        this.container.innerHTML = this.levels.map(level => {
            const isUnlocked = this.isUnlocked(level);
            const timeRange = level.maxMinutes >= 999999999 
                ? `${level.minMinutes}+ min` 
                : `${level.minMinutes}-${level.maxMinutes} min`;

            return `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${level.emoji}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${level.title}</div>
                        <div class="achievement-description">${timeRange}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

export const PatienceLevels = new PatienceLevelsManager();
export default PatienceLevels;
