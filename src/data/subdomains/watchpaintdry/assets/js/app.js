
import { CONFIG } from './config.js';
import { Storage } from './utils/storage.js';
import { Timer } from './modules/timer.js';
import { Audio } from './modules/audio.js';
import { Achievements } from './modules/achievements.js';
import { PatienceLevels } from './modules/patience-levels.js';
import { Notifications } from './modules/notifications.js';
import { Messages } from './modules/messages.js';
import { Paints } from './modules/paints.js';
import { Panels } from './modules/panels.js';
import { Theme } from './modules/theme.js';

class WatchPaintDryApp {
    constructor() {
        this.isInitialized = false;
        this.checkInterval = null;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            Theme.init();

            Notifications.init();

            await Promise.all([
                Messages.init(),
                Achievements.init(),
                PatienceLevels.init()
            ]);

            Timer.init();
            Audio.init();
            Paints.init();
            Panels.init();

            this.startPeriodicChecks();

            Timer.onTick((elapsed, minutes) => {
                this.onTimerTick(elapsed, minutes);
            });

            this.isInitialized = true;
            console.log('🎨 Watch Paint Dry initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    startPeriodicChecks() {
        this.checkInterval = setInterval(() => {
            this.checkProgress();
        }, CONFIG.TIMER.CHECK_INTERVAL);
    }

    checkProgress() {
        const sessionMinutes = Timer.getElapsedMinutes();
        const clicks = Storage.getClicks();

        Achievements.check(sessionMinutes, clicks);
        PatienceLevels.check(sessionMinutes);
    }

    onTimerTick(elapsed, minutes) {
    }

    getState() {
        return {
            isInitialized: this.isInitialized,
            sessionTime: Timer.getFormattedTime(),
            sessionMinutes: Timer.getElapsedMinutes(),
            clicks: Storage.getClicks(),
            visits: Storage.getVisits(),
            currentPaint: Paints.getCurrentPaint(),
            unlockedAchievements: Achievements.getUnlockedCount(),
            totalAchievements: Achievements.getAll().length
        };
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        Timer.destroy();
        this.isInitialized = false;
    }
}

const app = new WatchPaintDryApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

window.WatchPaintDry = app;

export default app;
