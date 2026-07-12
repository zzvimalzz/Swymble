/**
 * Achievements Module
 * Handles achievement tracking, unlocking, and display
 */

import { CONFIG } from '../config.js';
import { Storage } from '../utils/storage.js';
import { safeFetch } from '../utils/helpers.js';
import { Notifications } from './notifications.js';

class AchievementsManager {
    constructor() {
        this.achievements = [];
        this.unlockedAchievements = [];
        this.container = null;
        this.isLoaded = false;
    }

    /**
     * Initialize achievements manager
     * @param {string} containerId - ID of the achievements container
     */
    async init(containerId = 'achievementsDrawer') {
        this.container = document.getElementById(containerId);
        this.unlockedAchievements = Storage.getUnlockedAchievements();
        
        await this.loadAchievements();
        this.render();
    }

    /**
     * Load achievements from JSON file
     */
    async loadAchievements() {
        this.achievements = await safeFetch(CONFIG.DATA_PATHS.ACHIEVEMENTS, []);
        this.isLoaded = true;
    }

    /**
     * Check and unlock achievements based on current stats
     * @param {number} sessionMinutes - Current session time in minutes
     * @param {number} clicks - Total click count
     * @returns {Array} Newly unlocked achievements
     */
    check(sessionMinutes, clicks) {
        if (!this.isLoaded || this.achievements.length === 0) return [];

        const visits = Storage.getVisits();
        const newlyUnlocked = [];

        this.achievements.forEach(achievement => {
            if (this.unlockedAchievements.includes(achievement.id)) return;

            let shouldUnlock = false;
            const { type, value } = achievement.requirement;

            switch (type) {
                case 'session':
                    shouldUnlock = sessionMinutes >= value;
                    break;
                case 'clicks':
                    shouldUnlock = clicks >= value;
                    break;
                case 'visits':
                    shouldUnlock = visits >= value;
                    break;
            }

            if (shouldUnlock) {
                this.unlockedAchievements.push(achievement.id);
                newlyUnlocked.push(achievement);
            }
        });

        if (newlyUnlocked.length > 0) {
            Storage.setUnlockedAchievements(this.unlockedAchievements);
            this.render();

            // Show notifications for each unlocked achievement
            newlyUnlocked.forEach(achievement => {
                Notifications.show(
                    achievement.icon,
                    'Achievement Unlocked!',
                    achievement.name
                );
            });
        }

        return newlyUnlocked;
    }

    /**
     * Check if an achievement is unlocked
     * @param {string} achievementId - Achievement ID to check
     * @returns {boolean} Whether the achievement is unlocked
     */
    isUnlocked(achievementId) {
        return this.unlockedAchievements.includes(achievementId);
    }

    /**
     * Get achievement by ID
     * @param {string} achievementId - Achievement ID
     * @returns {Object|null} Achievement object or null
     */
    getById(achievementId) {
        return this.achievements.find(a => a.id === achievementId) || null;
    }

    /**
     * Get all achievements
     * @returns {Array} All achievements
     */
    getAll() {
        return this.achievements;
    }

    /**
     * Get unlocked achievement count
     * @returns {number} Count of unlocked achievements
     */
    getUnlockedCount() {
        return this.unlockedAchievements.length;
    }

    /**
     * Render achievements in container
     */
    render() {
        if (!this.container || this.achievements.length === 0) return;

        this.container.innerHTML = this.achievements.map(achievement => {
            const isUnlocked = this.isUnlocked(achievement.id);
            return `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Export singleton instance
export const Achievements = new AchievementsManager();
export default Achievements;
